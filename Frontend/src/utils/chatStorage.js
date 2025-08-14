// تعریف کاربر فعلی (می‌توانید این را از context یا redux بگیرید)
const CURRENT_USER = "me"; // یا هر نامی که می‌خواهید

// کلید ذخیره‌سازی را بر اساس شناسه چت (معمولاً customUrl) بسازید
export function getChatKey(otherUser) {
    return `chat_between_${CURRENT_USER}_${otherUser}`;
}

// ذخیره پیام‌های چت خصوصی بین دو کاربر (جایگزینی کامل)
export function savePrivateChat(otherUser, messages) {
    const chatKey = getChatKey(otherUser);
    const safeArray = Array.isArray(messages) ? messages : [];
    localStorage.setItem(chatKey, JSON.stringify(safeArray));
}

// ادغام پیام‌های جدید با قبلی‌ها بر اساس id و مرتب‌سازی بر اساس زمان
export function savePrivateChatMerged(otherUser, newMessages) {
    try {
        const existing = loadPrivateChat(otherUser);
        const map = new Map();
        const put = (msg) => {
            if (!msg) return;
            const id = msg.id || msg._id || `${Date.now()}_${Math.random()}`;
            map.set(id, { ...msg, id });
        };
        (existing || []).forEach(put);
        (Array.isArray(newMessages) ? newMessages : []).forEach(put);

        // به آرایه تبدیل و بر اساس timestamp مرتب‌سازی
        const toIso = (ts) => {
            if (!ts) return new Date(0).toISOString();
            if (typeof ts === 'number') {
                const ms = ts < 1e12 ? ts * 1000 : ts;
                return new Date(ms).toISOString();
            }
            try { return new Date(ts).toISOString(); } catch { return new Date(0).toISOString(); }
        };
        const merged = Array.from(map.values()).sort((a, b) => (toIso(a.timestamp) > toIso(b.timestamp) ? 1 : -1));
        savePrivateChat(otherUser, merged);
        return merged;
    } catch (e) {
        // در صورت خطا fallback به جایگزینی ساده
        savePrivateChat(otherUser, Array.isArray(newMessages) ? newMessages : []);
        return Array.isArray(newMessages) ? newMessages : [];
    }
}

// افزودن یک پیام جدید به انتهای چت
export function appendPrivateMessage(otherUser, message) {
    const list = loadPrivateChat(otherUser);
    const next = [...(Array.isArray(list) ? list : []), message];
    savePrivateChat(otherUser, next);
    return next;
}

// دریافت پیام‌های چت خصوصی بین دو کاربر
export function loadPrivateChat(otherUser) {
    const chatKey = getChatKey(otherUser);
    const data = localStorage.getItem(chatKey);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
}

// پاک کردن چت خصوصی یک کاربر
export function clearPrivateChat(otherUser) {
    const chatKey = getChatKey(otherUser);
    localStorage.removeItem(chatKey);
}

// دریافت لیست تمام چت‌های خصوصی
export function getAllPrivateChats() {
    const chats = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`chat_between_${CURRENT_USER}_`)) {
            const otherUser = key.replace(`chat_between_${CURRENT_USER}_`, '');
            try { chats[otherUser] = JSON.parse(localStorage.getItem(key)); } catch { chats[otherUser] = []; }
        }
    }
    return chats;
}

// پاک کردن همه چت‌های خصوصی کاربر فعلی
export function clearAllPrivateChatsForCurrentUser() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`chat_between_${CURRENT_USER}_`)) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
}