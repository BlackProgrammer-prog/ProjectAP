import requests
import json
from datetime import datetime
import time

# آدرس سرور
BASE_URL = "http://localhost:9000"

def test_api():
    """تست کامل API"""
    
    print("=== شروع تست API مدیریت محتوا ===\n")
    
    # ۱. بررسی سلامت سرور
    print("۱. بررسی سلامت سرور...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ سرور فعال است")
            print(f"   پاسخ: {response.json()}")
        else:
            print("❌ مشکل در سرور")
            return
    except Exception as e:
        print(f"❌ خطا در اتصال: {e}")
        return
    
    print("-" * 50)
    
    # ۲. تست پیام‌های مختلف
    test_messages = [
        {
            "id": "msg-001",
            "sender_id": "user-123",
            "receiver_id": "user-456", 
            "content": "سلام دوست عزیز، چطوری؟",
            "description": "پیام عادی"
        },
        {
            "id": "msg-002", 
            "sender_id": "user-123",
            "receiver_id": "user-456",
            "content": "تو واقعا احمقی و کسی هستی",
            "description": "پیام فحش"
        },
        {
            "id": "msg-003",
            "sender_id": "user-789", 
            "receiver_id": "user-456",
            "content": "اگه این کارو بکنی میکشمت",
            "description": "پیام تهدید"
        },
        {
            "id": "msg-004",
            "sender_id": "user-123",
            "receiver_id": "user-456", 
            "content": "ایـــــــــن پیـــــــام اسپـــــــم هستتتتتتتتت",
            "description": "پیام اسپم"
        },
        {
            "id": "msg-005",
            "sender_id": "user-555",
            "receiver_id": "user-456",
            "content": "!!!!!@@@@@##### چه خبر؟",
            "description": "الگوی مشکوک"
        }
    ]
    
    print("۲. تست بررسی پیام‌ها...")
    
    for i, msg in enumerate(test_messages, 1):
        print(f"\n{i}. تست {msg['description']}")
        print(f"   محتوا: {msg['content']}")
        
        # ساخت payload کامل
        payload = {
            "id": msg["id"],
            "sender_id": msg["sender_id"], 
            "receiver_id": msg["receiver_id"],
            "type": "PRIVATE",
            "content": msg["content"],
            "timestamp": int(time.time()),
            "edited_timestamp": int(time.time()),
            "status": 0,
            "deleted": False,
            "delivered": False,
            "read": False
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/moderate",
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                status = "✅ مجاز" if result['allowed'] else "❌ مسدود"
                print(f"   نتیجه: {status}")
                print(f"   اقدام: {result['action']}")
                print(f"   دلیل: {result['reason']}")
                print(f"   اطمینان: {result['confidence']}%")
                print(f"   امتیاز: {result['score']}")
            else:
                print(f"   ❌ خطا: {response.status_code}")
                print(f"   پیام: {response.text}")
                
        except Exception as e:
            print(f"   ❌ خطا در درخواست: {e}")
    
    print("\n" + "-" * 50)
    
    # ۳. مشاهده پیام‌های مسدود شده
    print("\n۳. مشاهده پیام‌های مسدود شده...")
    try:
        response = requests.get(f"{BASE_URL}/blocked-messages")
        if response.status_code == 200:
            data = response.json()
            print(f"   تعداد پیام‌های مسدود: {data['count']}")
            
            for msg in data['messages'][:3]:  # نمایش ۳ پیام اول
                print(f"   - ID: {msg['message_id']}")
                print(f"     فرستنده: {msg['sender_id']}")
                print(f"     محتوا: {msg['content'][:50]}...")
                print(f"     دلیل: {msg['violations']}")
                print(f"     زمان مسدود: {msg['blocked_at']}")
                print()
        else:
            print(f"   ❌خطا: {response.status_code}")
    except Exception as e:
        print(f"   ❌ خطا: {e}")
    
    print("-" * 50)
    
    # ۴. مشاهده آمار
    print("\n۴. مشاهده آمار سیستم...")
    try:
        response = requests.get(f"{BASE_URL}/stats")
        if response.status_code == 200:
            stats = response.json()
            
            print("   آمار دیتابیس:")
            db_stats = stats['database_stats']
            print(f"   - کل پیام‌های مسدود: {db_stats.get('total_blocked_messages', 0)}")
            print(f"   - پیام‌های امروز: {db_stats.get('today_blocked_messages', 0)}")
            
            if db_stats.get('top_violators'):
                print("   - متخلفین برتر:")
                for violator in db_stats['top_violators'][:3]:
                    print(f"     {violator['sender_id']}: {violator['violation_count']} تخلف")
            
            print("\n   آمار هوش مصنوعی:")
            ai_stats = stats['ai_stats']
            print(f"   - کل کلمات ممنوع: {ai_stats['total_banned_words']}")
            print(f"   - دسته‌بندی‌ها: {', '.join(ai_stats['categories'])}")
            print(f"   - حد آستانه: {ai_stats['threshold']}")
            
        else:
            print(f"   ❌ خطا: {response.status_code}")
    except Exception as e:
        print(f"   ❌ خطا: {e}")
    
    print("\n" + "-" * 50)
    
    # ۵. تست اضافه کردن کلمه ممنوع
    print("\n۵. تست اضافه کردن کلمه ممنوع...")
    try:
        new_word_payload = {
            "word": "تست_کلمه_ممنوع",
            "category": "فحش"
        }
        
        response = requests.post(
            f"{BASE_URL}/add-banned-word",
            json=new_word_payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ {result['message']}")
            print(f"   کلمه: {result['word']}")
            print(f"   دسته: {result['category']}")
        else:
            print(f"   ❌ خطا: {response.status_code}")
    except Exception as e:
        print(f"   ❌ خطا: {e}")
    
    print("\n=== پایان تست ===")

if __name__ == "__main__":
    print("برای اجرای این تست، ابتدا سرور را روشن کنید:")
    print("python your_main_script.py")
    print("\nسپس این اسکریپت را اجرا کنید.")
    print("-" * 50)
    
    input("Enter را فشار دهید تا تست شروع شود...")
    test_api()