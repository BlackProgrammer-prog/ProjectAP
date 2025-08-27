// LocalStorage helpers for Group chats (per current user and group id)

function getCurrentUserKeyPart() {
    try {
        const raw = localStorage.getItem('user');
        if (raw) {
            const parsed = JSON.parse(raw);
            const id = parsed?.email || parsed?.username || parsed?.id || 'me';
            return String(id);
        }
    } catch {}
    return 'me';
}

export function getGroupChatKey(groupIdOrUrl) {
    const current = getCurrentUserKeyPart();
    return `group_chat_${current}_${groupIdOrUrl}`;
}

export function ensureGroupChatExists(groupIdOrUrl) {
    const key = getGroupChatKey(groupIdOrUrl);
    if (localStorage.getItem(key) == null) {
        localStorage.setItem(key, JSON.stringify([]));
    }
}

export function saveGroupChat(groupIdOrUrl, messages) {
    const key = getGroupChatKey(groupIdOrUrl);
    const safeArray = Array.isArray(messages) ? messages : [];
    localStorage.setItem(key, JSON.stringify(safeArray));
}

export function saveGroupChatMerged(groupIdOrUrl, newMessages) {
    try {
        const existing = loadGroupChat(groupIdOrUrl);
        const map = new Map();
        const put = (msg) => {
            if (!msg) return;
            const id = msg.id || msg._id || `${Date.now()}_${Math.random()}`;
            map.set(id, { ...msg, id });
        };
        (existing || []).forEach(put);
        (Array.isArray(newMessages) ? newMessages : []).forEach(put);

        const toIso = (ts) => {
            if (!ts) return new Date(0).toISOString();
            if (typeof ts === 'number') {
                const ms = ts < 1e12 ? ts * 1000 : ts;
                return new Date(ms).toISOString();
            }
            try { return new Date(ts).toISOString(); } catch { return new Date(0).toISOString(); }
        };
        const merged = Array.from(map.values()).sort((a, b) => (toIso(a.timestamp) > toIso(b.timestamp) ? 1 : -1));
        saveGroupChat(groupIdOrUrl, merged);
        return merged;
    } catch (e) {
        saveGroupChat(groupIdOrUrl, Array.isArray(newMessages) ? newMessages : []);
        return Array.isArray(newMessages) ? newMessages : [];
    }
}

export function appendGroupMessage(groupIdOrUrl, message) {
    const list = loadGroupChat(groupIdOrUrl);
    const next = [...(Array.isArray(list) ? list : []), message];
    saveGroupChat(groupIdOrUrl, next);
    return next;
}

export function loadGroupChat(groupIdOrUrl) {
    const key = getGroupChatKey(groupIdOrUrl);
    const data = localStorage.getItem(key);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
}

export function clearGroupChat(groupIdOrUrl) {
    const key = getGroupChatKey(groupIdOrUrl);
    localStorage.removeItem(key);
}




