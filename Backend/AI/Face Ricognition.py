from flask import Flask, request, jsonify
import face_recognition
import cv2
import numpy as np
import sqlite3
import base64
import io
from PIL import Image
import json
from datetime import datetime

app = Flask(name)

# تنظیمات دیتابیس
def init_database():
    """ایجاد جدول برای ذخیره اطلاعات کاربران"""
    conn = sqlite3.connect('face_auth.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            face_encoding TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()

def base64_to_image(base64_string):
    """تبدیل base64 به تصویر"""
    try:
        # حذف prefix اگر وجود داشته باشد
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]

        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    except Exception as e:
        raise ValueError(f"خطا در تبدیل تصویر: {str(e)}")

def extract_face_encoding(image):
    """استخراج encoding چهره از تصویر"""
    # تبدیل به RGB برای face_recognition
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # شناسایی موقعیت چهره‌ها
    face_locations = face_recognition.face_locations(rgb_image)

    if not face_locations:
        raise ValueError("هیچ چهره‌ای در تصویر شناسایی نشد")

    if len(face_locations) > 1:
        raise ValueError("بیش از یک چهره در تصویر شناسایی شد. لطفا تصویری با یک چهره ارسال کنید")

    # استخراج encoding چهره
    face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
    return face_encodings[0]

def save_user_to_db(user_id, name, face_encoding):
    """ذخیره کاربر جدید در دیتابیس"""
    conn = sqlite3.connect('face_auth.db')
    cursor = conn.cursor()

    try:
        # تبدیل encoding به string برای ذخیره
        encoding_str = json.dumps(face_encoding.tolist())

        cursor.execute('''
            INSERT INTO users (user_id, name, face_encoding)
            VALUES (?, ?, ?)
        ''', (user_id, name, encoding_str))

        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def get_user_from_db(user_id):
    """دریافت اطلاعات کاربر از دیتابیس"""
    conn = sqlite3.connect('face_auth.db')
    cursor = conn.cursor()

    cursor.execute('''
        SELECT name, face_encoding FROM users WHERE user_id = ?
    ''', (user_id,))

    result = cursor.fetchone()
    conn.close()

    if result:
        name, encoding_str = result
        face_encoding = np.array(json.loads(encoding_str))
        return name, face_encoding
    return None, None

@app.route('/register', methods=['POST'])
def register_user():
    """API برای ثبت کاربر جدید"""
    try:
        data = request.get_json()

        # بررسی وجود فیلدهای ضروری
        if not all(k in data for k in ['user_id', 'name', 'image']):
            return jsonify({
                'success': False,
                'message': 'فیلدهای user_id، name و image الزامی هستند'
            }), 400

        user_id = data['user_id']
        name = data['name']
        image_base64 = data['image']

        # تبدیل base64 به تصویر
        image = base64_to_image(image_base64)

        # استخراج encoding چهره
        face_encoding = extract_face_encoding(image)

        # ذخیره در دیتابیس
        if save_user_to_db(user_id, name, face_encoding):
            return jsonify({
                'success': True,
                'message': f'کاربر {name} با موفقیت ثبت شد'})
        else:
            return jsonify({
                'success': False,
                'message': 'این شناسه کاربر قبلا ثبت شده است'
            }), 409

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطای داخلی: {str(e)}'
        }), 500

@app.route('/authenticate', methods=['POST'])
def authenticate_user():
    """API برای احراز هویت کاربر"""
    try:
        data = request.get_json()

        # بررسی وجود فیلدهای ضروری
        if not all(k in data for k in ['user_id', 'image']):
            return jsonify({
                'success': False,
                'message': 'فیلدهای user_id و image الزامی هستند'
            }), 400

        user_id = data['user_id']
        image_base64 = data['image']

        # دریافت اطلاعات کاربر از دیتابیس
        stored_name, stored_encoding = get_user_from_db(user_id)

        if stored_encoding is None:
            return jsonify({
                'success': False,
                'message': 'کاربر یافت نشد'
            }), 404

        # تبدیل base64 به تصویر
        image = base64_to_image(image_base64)

        # استخراج encoding چهره جدید
        current_encoding = extract_face_encoding(image)

        # مقایسه چهره‌ها
        face_distance = face_recognition.face_distance([stored_encoding], current_encoding)[0]

        # تبدیل distance به درصد تطابق
        # face_distance معمولا بین 0 تا 1 است (کمتر یعنی شباهت بیشتر)
        similarity_percentage = max(0, (1 - face_distance) * 100)

        # آستانه تطابق (85 درصد)
        threshold = 85.0

        if similarity_percentage >= threshold:
            return jsonify({
                'success': True,
                'message': 'احراز هویت با موفقیت انجام شد',
                'user_name': stored_name,
                'similarity_percentage': round(similarity_percentage, 2),
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'message': 'احراز هویت ناموفق - تطابق کافی نیست',
                'similarity_percentage': round(similarity_percentage, 2),
                'required_threshold': threshold
            }), 401

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطای داخلی: {str(e)}'
        }), 500

@app.route('/users', methods=['GET'])
def list_users():
    """API برای مشاهده لیست کاربران ثبت شده"""
    try:
        conn = sqlite3.connect('face_auth.db')
        cursor = conn.cursor()

        cursor.execute('SELECT user_id, name, created_at FROM users')
        users = cursor.fetchall()
        conn.close()

        user_list = []
        for user in users:
            user_list.append({
                'user_id': user[0],
                'name': user[1],
                'created_at': user[2]
            })

        return jsonify({
            'success': True,
            'users': user_list,
            'total_users': len(user_list)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'خطای داخلی: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """بررسی سلامت سرویس"""
    return jsonify({
        'status': 'healthy',
        'message': 'سیستم احراز هویت در حال اجرا است',
        'timestamp': datetime.now().isoformat()
    })

if name == 'main':