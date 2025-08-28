import re
import string
import sqlite3
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from flask import Flask, request, jsonify
from contextlib import contextmanager
import uuid
import threading

# ==================== MESSAGE MODERATION AI ====================
class MessageModerationAI:
    """
    سیستم هوش مصنوعی ساده برای تشخیص محتوای ممنوع در پیام‌های مسنجر
    """
    
    def __init__(self):
        # کلمات ممنوع و عبارات نامناسب
        self.banned_words = {
            'فحش': [
                'خر', 'احمق', 'کسی', 'بیشرف', 'عوضی', 'کثافت',
                'حرامی', 'گوه', 'لعنتی', 'جهنمی', 'لاشی'
            ],
            'تهدید': [
                'میکشمت', 'می‌کشم', 'خفه', 'بزنمت', 'تهدید',
                'نابودت', 'انتقام', 'بدت می‌کنم', 'پشیمونت'
            ],
            'نفرت': [
                'متنفرم', 'عین حیوون', 'آشغال', 'زباله',
                'نکبت', 'منحوس', 'ضد انسان', 'تروریست'
            ],
            'جنسی': [
                'سکس', 'رابطه جنسی', 'عریان', 'برهنه',
                'پورن', 'جنسی', 'شهوانی'
            ]
        }
        
        # الگوهای مشکوک
        self.suspicious_patterns = [
            r'[۰-۹a-zA-Z]*[فحش|کس|گه|لعن][۰-۹a-zA-Z]*',
            r'(.)\1{4,}',
            r'[!@#$%^&*]{3,}',
            r'[A-Z]{5,}',
        ]
        
        # امتیاز‌دهی
        self.severity_scores = {
            'فحش': 30,
            'تهدید': 50,
            'نفرت': 25,
            'جنسی': 40,
            'spam': 20,
            'suspicious_pattern': 15
        }
        
        # حد آستانه برای تشخیص محتوای ممنوع
        self.threshold = 40
        
    def preprocess_text(self, text: str) -> str:
        """پیش‌پردازش متن"""
        text = re.sub(r'[^\w\s\u06A0-\u06FF]', ' ', text)
        text = text.lower()
        text = ' '.join(text.split())
        return text
    
    def check_banned_words(self, text: str) -> Tuple[int, List[str]]:
        """بررسی وجود کلمات ممنوع"""
        score = 0
        found_words = []
        violations = []
        
        preprocessed_text = self.preprocess_text(text)
        
        for category, words in self.banned_words.items():
            for word in words:
                if word in preprocessed_text:
                    score += self.severity_scores.get(category, 20)
                    found_words.append(word)
                    violations.append(f"{category}: {word}")
        
        return score, violations
    
    def check_suspicious_patterns(self, text: str) -> Tuple[int, List[str]]:
        """بررسی الگوهای مشکوک"""
        score = 0
        violations = []
        
        for pattern in self.suspicious_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                score += self.severity_scores['suspicious_pattern']
                violations.append(f"الگوی مشکوک: {pattern[:20]}...")
        
        return score, violations
    
    def check_spam(self, text: str) -> Tuple[int, List[str]]:
        """بررسی اسپم"""
        violations = []
        score = 0
        
        if len(text) > 1000:
            score += 10
            violations.append("پیام خیلی طولانی")
        
        words = text.split()
        if len(words) > 10:
            word_freq = {}
            for word in words:
                word_freq[word] = word_freq.get(word, 0) + 1
            
            max_freq = max(word_freq.values()) if word_freq else 0
            if max_freq > 5:
                score += self.severity_scores['spam']
                violations.append(f"تکرار زیاد کلمه (حداکثر {max_freq} بار)")
        
        return score, violations
    
    def analyze_message(self, message: str, user_id: str = None) -> Dict:
        """تجزیه و تحلیل کامل پیام"""
        if not message or not message.strip():
            return {
                'is_forbidden': False,
                'confidence': 0,
                'score': 0,
                'violations': [],
                'analysis_time': datetime.now().isoformat(),
                'action': 'allow'
            }
        total_score = 0
        all_violations = []
        
        # بررسی کلمات ممنوع
        banned_score, banned_violations = self.check_banned_words(message)
        total_score += banned_score
        all_violations.extend(banned_violations)
        
        # بررسی الگوهای مشکوک
        pattern_score, pattern_violations = self.check_suspicious_patterns(message)
        total_score += pattern_score
        all_violations.extend(pattern_violations)
        
        # بررسی اسپم
        spam_score, spam_violations = self.check_spam(message)
        total_score += spam_score
        all_violations.extend(spam_violations)
        
        # تعیین وضعیت نهایی
        is_forbidden = total_score >= self.threshold
        confidence = min(total_score / 100.0, 1.0)
        
        # تعیین اقدام
        if total_score >= 70:
            action = 'block'
        elif total_score >= 40:
            action = 'review'
        elif total_score >= 20:
            action = 'warn'
        else:
            action = 'allow'
        
        return {
            'is_forbidden': is_forbidden,
            'confidence': round(confidence * 100, 2),
            'score': total_score,
            'violations': all_violations,
            'analysis_time': datetime.now().isoformat(),
            'action': action,
            'message_length': len(message),
            'user_id': user_id
        }

    def add_banned_word(self, word: str, category: str = 'فحش') -> bool:
        """افزودن یک کلمه ممنوع جدید به دسته موردنظر. اگر وجود داشته باشد False برمی‌گرداند."""
        if not word or not category:
            return False
        # نرمال‌سازی ساده
        word_norm = self.preprocess_text(word)
        if not word_norm:
            return False
        if category not in self.banned_words:
            self.banned_words[category] = []
        if word_norm in (w.lower() for w in self.banned_words[category]):
            return False
        self.banned_words[category].append(word_norm)
        return True

# ==================== DATABASE MANAGER ====================
class DatabaseManager:
    """مدیریت پایگاه داده برای ذخیره پیام‌های مسدود شده"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.lock = threading.Lock()
        self._init_database()
    
    def _init_database(self):
        """ایجاد جدول در صورت عدم وجود"""
        with self._get_db_connection() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS blocked_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id TEXT NOT NULL UNIQUE,
                    sender_id TEXT NOT NULL,
                    receiver_id TEXT,
                    content TEXT NOT NULL,
                    violations TEXT,
                    confidence REAL,
                    score INTEGER,
                    timestamp INTEGER,
                    blocked_at TEXT NOT NULL,
                    UNIQUE(message_id)
                )
            ''')
            
            # ایجاد ایندکس برای جستجوی سریع‌تر
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_sender_id 
                ON blocked_messages(sender_id)
            ''')
            
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_blocked_at 
                ON blocked_messages(blocked_at)
            ''')
            
            conn.commit()
    
    @contextmanager
    def _get_db_connection(self):
        """مدیریت اتصال به پایگاه داده"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path, timeout=30.0)
            conn.row_factory = sqlite3.Row  # برای دسترسی آسان‌تر به ستون‌ها
            yield conn
        except sqlite3.Error as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()
    
    def save_blocked_message(self, message_data: Dict, analysis_result: Dict) -> bool:
        """ذخیره پیام مسدود شده"""
        try:
            with self.lock:
                with self._get_db_connection() as conn:
                    conn.execute('''
                        INSERT OR IGNORE INTO blocked_messages 
                        (message_id, sender_id, receiver_id, content, violations, 
                         confidence, score, timestamp, blocked_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        message_data['id'],
                        message_data['sender_id'],
                        message_data.get('receiver_id'),
                        message_data['content'],
                        ', '.join(analysis_result.get('violations', [])),
                        analysis_result.get('confidence', 0),
                        analysis_result.get('score', 0),
                        message_data.get('timestamp'),
                        datetime.now().isoformat()
                    ))
                    conn.commit()
                    return True
        except sqlite3.Error as e:
            print(f"خطا در ذخیره پیام: {e}")
            return False
    
    def get_blocked_messages(self, sender_id: str = None, limit: int = 100) -> List[Dict]:
        """دریافت پیام‌های مسدود شده"""
        try:
            with self._get_db_connection() as conn:
                if sender_id:
                    cursor = conn.execute('''
                        SELECT * FROM blocked_messages 
                        WHERE sender_id = ? 
                        ORDER BY blocked_at DESC 
                        LIMIT ?
                    ''', (sender_id, limit))
                else:
                    cursor = conn.execute('''
                        SELECT * FROM blocked_messages 
                        ORDER BY blocked_at DESC 
                        LIMIT ?
                    ''', (limit,))
                
                return [dict(row) for row in cursor.fetchall()]
        except sqlite3.Error as e:
            print(f"خطا در دریافت پیام‌ها: {e}")
            return []
    
    def get_stats(self) -> Dict:
        """آمار پیام‌های مسدود شده"""
        try:
            with self._get_db_connection() as conn:
                # تعداد کل
                total_cursor = conn.execute('SELECT COUNT(*) FROM blocked_messages')
                total_blocked = total_cursor.fetchone()[0]
                
                # تعداد امروز
                today = datetime.now().date().isoformat()
                today_cursor = conn.execute('''
                    SELECT COUNT(*) FROM blocked_messages 
                    WHERE DATE(blocked_at) = ?
                ''', (today,))
                today_blocked = today_cursor.fetchone()[0]
                
                # کاربران با بیشترین تخلف
                top_users_cursor = conn.execute('''
                    SELECT sender_id, COUNT(*) as violation_count
                    FROM blocked_messages 
                    GROUP BY sender_id 
                    ORDER BY violation_count DESC 
                    LIMIT 10
                ''')
                top_violators = [dict(row) for row in top_users_cursor.fetchall()]
                
                return {
                    'total_blocked_messages': total_blocked,
                    'today_blocked_messages': today_blocked,
                    'top_violators': top_violators
                }
        except sqlite3.Error as e:
            print(f"خطا در دریافت آمار: {e}")
            return {}

# ==================== FLASK API ====================
app = Flask(__name__)

# *** اینجا آدرس دیتابیس خود را قرار دهید ***
DATABASE_PATH = "C:/Users/HOME/Desktop/ProjectAP/ProjectAP/Database/app_database.db"  # <-- اینجا آدرس دیتابیس را تغییر دهید

# ایجاد نمونه‌های سیستم
moderator = MessageModerationAI()
db_manager = DatabaseManager(DATABASE_PATH)

@app.route('/health', methods=['GET'])
def health_check():
    """بررسی سلامت سیستم"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/moderate', methods=['POST'])
def moderate_message():
    """API اصلی برای بررسی پیام"""
    try:
        # دریافت داده از فرانت
        data = request.get_json()
        
        # بررسی صحت داده‌ها
        required_fields = ['id', 'sender_id', 'content']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'فیلد {field} الزامی است'
                }), 400
        
        # تجزیه و تحلیل پیام
        analysis = moderator.analyze_message(data['content'], data['sender_id'])
        
        # اگر پیام باید مسدود شود، در دیتابیس ذخیره می‌شود
        if analysis['action'] == 'block':
            save_success = db_manager.save_blocked_message(data, analysis)
            if not save_success:
                print(f"خطا در ذخیره پیام مسدود شده: {data['id']}")
        
        # پاسخ به فرانت
        result = {
            'message_id': data['id'],
            'allowed': analysis['action'] != 'block',
            'action': analysis['action'],
            'reason': ', '.join(analysis['violations']) if analysis['violations'] else 'محتوای مناسب',
            'confidence': analysis['confidence'],
            'score': analysis['score'],
            'timestamp': analysis['analysis_time']
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'error': f'خطای سرور: {str(e)}'
        }), 500

@app.route('/blocked-messages', methods=['GET'])
def get_blocked_messages():
    """دریافت لیست پیام‌های مسدود شده"""
    try:
        sender_id = request.args.get('sender_id')
        limit = int(request.args.get('limit', 100))
        
        messages = db_manager.get_blocked_messages(sender_id, limit)
        
        return jsonify({
            'messages': messages,
            'count': len(messages),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'error': f'خطای سرور: {str(e)}'
        }), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """دریافت آمار سیستم"""
    try:
        db_stats = db_manager.get_stats()
        ai_stats = {
            'total_banned_words': sum(len(words) for words in moderator.banned_words.values()),
            'categories': list(moderator.banned_words.keys()),
            'threshold': moderator.threshold,
            'patterns_count': len(moderator.suspicious_patterns)
        }
        
        return jsonify({
            'database_stats': db_stats,
            'ai_stats': ai_stats,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'error': f'خطای سرور: {str(e)}'
        }), 500

@app.route('/add-banned-word', methods=['POST'])
def add_banned_word():
    """اضافه کردن کلمه جدید به لیست ممنوعه"""
    try:
        data = request.get_json()
        word = data.get('word')
        category = data.get('category', 'فحش')
        
        if not word:
            return jsonify({'error': 'کلمه الزامی است'}), 400
        
        success = moderator.add_banned_word(word, category)
        
        return jsonify({
            'success': success,
            'message': 'کلمه اضافه شد' if success else 'کلمه از قبل موجود است',
            'word': word,
            'category': category
        })
        
    except Exception as e:
        return jsonify({
            'error': f'خطای سرور: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'آدرس یافت نشد'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'متد مجاز نیست'}), 405

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({'error': 'خطای داخلی سرور'}), 500

if __name__ == '__main__':
    print("🚀 سرور مدیریت محتوای پیام راه‌اندازی شد")
    print(f"📊 پایگاه داده: {DATABASE_PATH}")
    print("🌐 آدرس‌های API:")
    print("   POST /moderate - بررسی پیام")
    print("   GET /blocked-messages - پیام‌های مسدود شده")
    print("   GET /stats - آمار سیستم")
    print("   POST /add-banned-word - اضافه کردن کلمه ممنوع")
    print("   GET /health - بررسی سلامت")
    print("-" * 50)
    
    app.run(host='0.0.0.0', port=9000, debug=False)