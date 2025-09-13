from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import cv2
import numpy as np
import sqlite3
import base64
import io
from PIL import Image
import json
from datetime import datetime
import hashlib
import os

app = Flask(__name__)
# Allow cross-origin requests from the web app (fix CORS errors in browser)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)
app.config['JSON_AS_ASCII'] = False
app.config['MAX_CONTENT_LENGTH'] = 8 * 1024 * 1024  # up to ~8MB images

# مسیر دیتابیس اصلی پروژه (همان که بک‌اند C++ استفاده می‌کند)
DB_PATH = r"C:/Users/HOME/Desktop/ProjectAP/ProjectAP/Database/app_database.db"

# تنظیمات و مهاجرت دیتابیس
def init_database():
    """اطمینان از وجود ستون های ذخیره الگوی چهره و مقداردهی خالی"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        # ستون پیشنهادی کاربر: Face
        try:
            cur.execute("ALTER TABLE users ADD COLUMN Face TEXT")
        except sqlite3.Error:
            pass
        try:
            cur.execute("UPDATE users SET Face = '' WHERE Face IS NULL")
        except sqlite3.Error:
            pass
        # ستون جایگزین قبلی: face_encoding
        try:
            cur.execute("ALTER TABLE users ADD COLUMN face_encoding TEXT")
        except sqlite3.Error:
            pass
        try:
            cur.execute("UPDATE users SET face_encoding = '' WHERE face_encoding IS NULL")
        except sqlite3.Error:
            pass
        conn.commit()
    finally:
        conn.close()


def base64_to_image(base64_string):
    """تبدیل base64 به تصویر OpenCV (BGR)"""
    if not isinstance(base64_string, str):
        raise ValueError("image must be base64 string")
    try:
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    except Exception as e:
        raise ValueError(f"خطا در تبدیل تصویر: {str(e)}")


def extract_face_encoding(image):
    """استخراج encoding چهره از تصویر (یک چهره)"""
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_image)
    if not face_locations:
        raise ValueError("هیچ چهره‌ای در تصویر شناسایی نشد")
    if len(face_locations) > 1:
        raise ValueError("بیش از یک چهره شناسایی شد؛ لطفاً تصویر با یک چهره ارسال شود")
    face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
    return face_encodings[0]


# کمکی‌های دیتابیس

def _get_user_by_email(conn, email):
    cur = conn.cursor()
    cur.execute("SELECT id, email, username, password_hash FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    return row


def _get_user_by_id(conn, user_id):
    cur = conn.cursor()
    cur.execute("SELECT id, email, username, password_hash FROM users WHERE id = ?", (user_id,))
    row = cur.fetchone()
    return row


def _save_face_encoding(conn, user_id, encoding_vec):
    enc_str = json.dumps(encoding_vec.tolist()) if isinstance(encoding_vec, np.ndarray) else encoding_vec
    cur = conn.cursor()
    # ابتدا تلاش برای ستون Face (مطابق درخواست)
    try:
        cur.execute("UPDATE users SET Face = ? WHERE id = ?", (enc_str, user_id))
        if cur.rowcount == 0:
            raise sqlite3.OperationalError("no rows updated")
        return
    except sqlite3.Error:
        pass
    # در غیر اینصورت از ستون face_encoding استفاده کن
    cur.execute("UPDATE users SET face_encoding = ? WHERE id = ?", (enc_str, user_id))


def _get_face_encoding(conn, user_id):
    cur = conn.cursor()
    # ابتدا ستون Face
    try:
        cur.execute("SELECT Face FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        if row and row[0]:
            return row[0]
    except sqlite3.Error:
        pass
    # سپس ستون face_encoding
    try:
        cur.execute("SELECT face_encoding FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        if row and row[0]:
            return row[0]
    except sqlite3.Error:
        pass
    return ''


def _hash_password_sha256(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


# API ها
@app.route('/face/enroll', methods=['POST'])
def enroll_face():
    """ثبت/به‌روزرسانی الگوی چهره یک کاربر در users.face_encoding"""
    try:
        data = request.get_json(force=True)
        if not data or ('image' not in data) or (('email' not in data) and ('user_id' not in data)):
            return jsonify({"success": False, "message": "email یا user_id و image الزامی است"}), 400
        image_b64 = data['image']
        conn = sqlite3.connect(DB_PATH)
        try:
            row = _get_user_by_email(conn, data['email']) if 'email' in data else _get_user_by_id(conn, data['user_id'])
            if not row:
                return jsonify({"success": False, "message": "کاربر یافت نشد"}), 404
            user_id = row[0]
            # استخراج الگو
            image = base64_to_image(image_b64)
            encoding = extract_face_encoding(image)
            # ذخیره
            _save_face_encoding(conn, user_id, encoding)
            conn.commit()
            return jsonify({"success": True, "message": "الگوی چهره با موفقیت ذخیره شد"})
        finally:
            conn.close()
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"خطای داخلی: {str(e)}"}), 500


@app.route('/face/verify', methods=['POST'])
def verify_face():
    """بررسی تطابق تصویر ارسالی با الگوی ثبت‌شده (آستانه 90%)"""
    try:
        data = request.get_json(force=True)
        if not data or ('image' not in data) or (('email' not in data) and ('user_id' not in data)):
            return jsonify({"success": False, "message": "email یا user_id و image الزامی است"}), 400
        image_b64 = data['image']
        threshold = float(data.get('threshold', 90.0))
        conn = sqlite3.connect(DB_PATH)
        try:
            row = _get_user_by_email(conn, data['email']) if 'email' in data else _get_user_by_id(conn, data['user_id'])
            if not row:
                return jsonify({"success": False, "message": "کاربر یافت نشد"}), 404
            user_id = row[0]
            face_encoding_str = _get_face_encoding(conn, user_id) or ''
            if face_encoding_str == '':
                return jsonify({"success": False, "message": "الگوی چهره برای این کاربر ثبت نشده است"}), 404
            try:
                stored_encoding = np.array(json.loads(face_encoding_str), dtype=np.float64)
            except Exception:
                return jsonify({"success": False, "message": "الگوی چهره ذخیره‌شده نامعتبر است"}), 500
            # استخراج الگوی جدید
            image = base64_to_image(image_b64)
            current_encoding = extract_face_encoding(image)
            # محاسبه شباهت
            face_distance = face_recognition.face_distance([stored_encoding], current_encoding)[0]
            similarity_percentage = max(0.0, (1.0 - float(face_distance)) * 100.0)
            ok = similarity_percentage >= threshold
            return jsonify({
                "success": ok,
                "similarity_percentage": round(float(similarity_percentage), 2),
                "required_threshold": float(threshold)
            }), (200 if ok else 401)
        finally:
            conn.close()
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"خطای داخلی: {str(e)}"}), 500


@app.route('/face/reset_password', methods=['POST'])
def reset_password():
    """تغییر پسورد کاربر در users.password_hash با هش SHA-256"""
    try:
        data = request.get_json(force=True)
        if not data or ('new_password' not in data) or (('email' not in data) and ('user_id' not in data)):
            return jsonify({"success": False, "message": "email یا user_id و new_password الزامی است"}), 400
        new_password = data['new_password']
        new_hash = _hash_password_sha256(new_password)
        conn = sqlite3.connect(DB_PATH)
        try:
            if 'email' in data:
                row = _get_user_by_email(conn, data['email'])
            else:
                row = _get_user_by_id(conn, data['user_id'])
            if not row:
                return jsonify({"success": False, "message": "کاربر یافت نشد"}), 404
            user_id = row[0]
            cur = conn.cursor()
            cur.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
            conn.commit()
            return jsonify({"success": True, "message": "پسورد با موفقیت تغییر کرد"})
        finally:
            conn.close()
    except Exception as e:
        return jsonify({"success": False, "message": f"خطای داخلی: {str(e)}"}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Face service running',
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    init_database()
    print("Face recognition service started on :10000")
    print("APIs:")
    print("- POST /face/enroll (email|user_id, image)")
    print("- POST /face/verify (email|user_id, image, [threshold=90])")
    print("- POST /face/reset_password (email|user_id, new_password)")
    # Use threaded to handle concurrent requests from browser
    app.run(debug=True, host='0.0.0.0', port=10000, threaded=True)