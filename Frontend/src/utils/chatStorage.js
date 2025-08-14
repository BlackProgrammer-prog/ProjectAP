// تعریف کاربر فعلی (می‌توانید این را از context یا redux بگیرید)
const CURRENT_USER = "me"; // یا هر نامی که می‌خواهید

// ذخیره پیام‌های چت خصوصی بین دو کاربر
export function savePrivateChat(otherUser, messages) {
    const chatKey = `chat_between_${CURRENT_USER}_${otherUser}`;
    localStorage.setItem(chatKey, JSON.stringify(messages));
}

// دریافت پیام‌های چت خصوصی بین دو کاربر
export function loadPrivateChat(otherUser) {
    const chatKey = `chat_between_${CURRENT_USER}_${otherUser}`;
    const data = localStorage.getItem(chatKey);
    return data ? JSON.parse(data) : [];
}

// پاک کردن چت خصوصی یک کاربر
export function clearPrivateChat(otherUser) {
    const chatKey = `chat_between_${CURRENT_USER}_${otherUser}`;
    localStorage.removeItem(chatKey);
}

// دریافت لیست تمام چت‌های خصوصی
export function getAllPrivateChats() {
    const chats = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`chat_between_${CURRENT_USER}_`)) {
            const otherUser = key.replace(`chat_between_${CURRENT_USER}_`, '');
            chats[otherUser] = JSON.parse(localStorage.getItem(key));
        }
    }
    return chats;
} 