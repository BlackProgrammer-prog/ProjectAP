import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Box, Stack } from "@mui/material";
import { Chat_History } from "../../data";
import Conversation from "../../components/Conversation";
import Chats from "./Chats";
import { savePrivateChat, loadPrivateChat, clearPrivateChat, ensureChatExists, savePrivateChatMerged } from "../../utils/chatStorage";
import { v4 as uuidv4 } from 'uuid';
import { loadPV, getStoredEmails } from "../../utils/pvStorage";
import { useAuth } from "../../Login/Component/Context/AuthContext";
import webSocketService from "../../Login/Component/Services/WebSocketService";
import Swal from "sweetalert2";

const ChatPage = () => {
    const { username } = useParams(); // username == customUrl
    const { token, user } = useAuth();
    const pv = loadPV();
    const chatProfile = useMemo(() => (pv || []).find((p) => p.customUrl === username || p.email === username || p.username === username), [pv, username]);
    const peerEmail = chatProfile?.email || (username && username.includes('@') ? username : undefined) || chatProfile?.username; // prefer real email
    const myEmail = user?.email;

    // پیام‌های چت خصوصی بین کاربر فعلی و کاربر انتخاب شده
    // در رفرش صفحه، کش لوکال پاک و فقط پیام‌های سرور لود می‌شود
    const [messages, setMessages] = useState([]);

    // اگر username تغییر کرد، پیام‌های چت خصوصی جدید را لود کن و از سرور درخواست بگیر
    useEffect(() => {
        const keyOther = peerEmail || username;
        // پاکسازی کش لوکال برای جلوگیری از دوبل شدن پیام‌ها و تکیه بر پاسخ سرور
        try { clearPrivateChat(keyOther); } catch {}
        ensureChatExists(keyOther);
        setMessages([]);

        // Request last N messages from server (by peer email)
        if (token && peerEmail) {
            webSocketService.send({ type: 'get_messages', token, with: peerEmail, limit: 100, order: 'asc' });
        } else if (!peerEmail) {
            // toast warning if peer email missing
            Swal.fire({ toast: true, position: 'bottom-start', icon: 'warning', title: 'ایمیل مخاطب یافت نشد', showConfirmButton: false, timer: 2500, timerProgressBar: true });
        }

        // Also refresh open chats list on page entry
        if (token) {
            webSocketService.send({ type: 'get_open_chats', token });
        }
    }, [username, token, peerEmail]);

    // Helper: map server message to local message shape
    const adaptServerMessage = (msg) => {
        const serverId = msg.id || msg._id || uuidv4();
        const text = msg.content || msg.message || msg.text || '';
        // timestamp can be numeric epoch (seconds or ms) or ISO
        let ts = msg.timestamp || msg.time || msg.created_at;
        if (typeof ts === 'number') {
            // Heuristic: treat < 10^12 as seconds
            const ms = ts < 1e12 ? ts * 1000 : ts;
            ts = new Date(ms).toISOString();
        }
        if (!ts) ts = new Date().toISOString();

        // Derive outgoing using sender_id if available
        const myUserId = user?.user_id || user?.id;
        const senderId = msg.sender_id || msg.senderId || msg.sender || null;
        const receiverId = msg.receiver_id || msg.receiverId || msg.receiver || null;
        let outgoing = false;
        if (myUserId && senderId) {
            outgoing = String(myUserId) === String(senderId);
        } else if (myEmail && (msg.sender || msg.from || msg.sender_email || msg.senderEmail)) {
            const from = msg.sender || msg.from || msg.sender_email || msg.senderEmail;
            outgoing = String(from).toLowerCase() === String(myEmail).toLowerCase();
        } else if (typeof msg.outgoing === 'boolean') {
            outgoing = msg.outgoing;
        }

        const isRead = typeof msg.read === 'boolean' ? msg.read : (msg.read === 1 ? true : false);

        return {
            id: serverId,
            type: 'msg',
            message: text,
            incoming: !outgoing,
            outgoing: outgoing,
            sender: outgoing ? (myEmail || 'me') : (peerEmail || username),
            receiver: outgoing ? (peerEmail || username) : (myEmail || 'me'),
            timestamp: ts,
            read: isRead,
        };
    };

    // Listen to incoming WS messages for get_messages responses and new messages
    useEffect(() => {
        const off = webSocketService.addGeneralListener((raw) => {
            let data;
            try { data = JSON.parse(raw); } catch { return; }

            if (data && data.status === 'error' && data.message) {
                const known = [
                    "Missing 'with' (peer email)",
                    'User not in contacts',
                    'User not found',
                    'Chat manager not initialized'
                ];
                if (known.includes(data.message)) {
                    Swal.fire({ toast: true, position: 'bottom-start', icon: 'error', title: data.message, showConfirmButton: false, timer: 2800, timerProgressBar: true });
                } else {
                    // Ignore unrelated errors like "Unknown message type" from other features (e.g., heartbeat)
                    console.warn('Ignoring non-chat error:', data.message);
                }
                return;
            }

            // Handle bulk messages response (be lenient on status)
            if (data && Array.isArray(data.messages)) {
                const keyOther = peerEmail || username;
                const adapted = data.messages.map(adaptServerMessage);
                // جایگزینی کامل با پاسخ سرور
                savePrivateChat(keyOther, adapted);
                setMessages(adapted);
                Swal.fire({ toast: true, position: 'bottom-start', icon: 'success', title: `دریافت ${data.count ?? adapted.length} پیام`, showConfirmButton: false, timer: 1800, timerProgressBar: true });
                return;
            }

            // پیام ویرایش‌شده برای گیرنده/نمایشگر چت
            if (data && data.type === 'message_edited' && data.message_id) {
                const keyOther = peerEmail || username;
                setMessages((prev) => {
                    const updated = (prev || []).map((m) => (
                        m.id === data.message_id
                            ? { ...m, message: data.new_content ?? m.message, edited: true, edited_timestamp: new Date().toISOString() }
                            : m
                    ));
                    savePrivateChat(keyOther, updated);
                    return updated;
                });
                Swal.fire({ toast: true, position: 'bottom-start', icon: 'info', title: 'یک پیام ویرایش شد', showConfirmButton: false, timer: 1600, timerProgressBar: true });
                return;
            }

            // حذف پیام برای گیرنده/نمایشگر چت
            if (data && data.type === 'message_deleted' && data.message_id) {
                const keyOther = peerEmail || username;
                setMessages((prev) => {
                    const updated = (prev || []).filter((m) => m.id !== data.message_id);
                    savePrivateChat(keyOther, updated);
                    return updated;
                });
                Swal.fire({ toast: true, position: 'bottom-start', icon: 'warning', title: 'یک پیام حذف شد', showConfirmButton: false, timer: 1500, timerProgressBar: true });
                return;
            }

            // Handle read receipt notification to sender
            if (data && data.type === 'message_read' && data.message_id) {
                const msgId = data.message_id;
                const keyOther = peerEmail || username;
                setMessages((prev) => {
                    const updated = (prev || []).map((m) => (m.id === msgId ? { ...m, read: true } : m));
                    savePrivateChat(keyOther, updated);
                    return updated;
                });
                Swal.fire({ toast: true, position: 'bottom-start', icon: 'info', title: 'پیام شما خوانده شد', showConfirmButton: false, timer: 1800, timerProgressBar: true });
                return;
            }

            // Handle single incoming message event (if server sends live updates)
            if ((data?.type && String(data.type).includes('message')) && (data.message || data.text || data.content)) {
                const incomingMsg = adaptServerMessage(data);
                // Only append if belongs to this peer chat
                const involvesPeer = (incomingMsg.sender && peerEmail && String(incomingMsg.sender).toLowerCase() === String(peerEmail).toLowerCase()) ||
                                     (incomingMsg.receiver && myEmail && String(incomingMsg.receiver).toLowerCase() === String(myEmail).toLowerCase());
                if (involvesPeer) {
                    setMessages((prev) => {
                        const keyOther = peerEmail || username;
                        // جلوگیری از دوبل: اگر پیام ارسالی خودمان است و pending مشابه وجود دارد، جایگزین کن
                        let replaced = false;
                        const next = (prev || []).map((m) => {
                            if (!replaced && incomingMsg.outgoing && m?.outgoing && m?.pending && m?.message === incomingMsg.message) {
                                replaced = true;
                                return { ...incomingMsg, pending: false };
                            }
                            return m;
                        });
                        const finalNext = replaced ? next : [...next, incomingMsg];
                        savePrivateChat(keyOther, finalNext);
                        return finalNext;
                    });
                    // Mark as read immediately for incoming messages when viewing this chat
                    try {
                        if (token && incomingMsg.incoming && incomingMsg.id) {
                            webSocketService.send({ type: 'mark_as_read', token, message_id: incomingMsg.id });
                        }
                    } catch {}
                }
            }
        });
        return () => off && off();
    }, [username, myEmail, peerEmail, token]);

    // ذخیره پیام جدید در چت خصوصی
    const handleSendMessage = (text) => {
        const newMessage = {
            id: uuidv4(), // آیدی یکتا
            type: "msg",
            message: text,
            incoming: false,
            outgoing: true,
            sender: myEmail || "me", // کاربر فعلی
            receiver: peerEmail || username, // کاربر مقابل
            timestamp: new Date().toISOString(),
            read: false,
            pending: true,
        };
        const keyOther = peerEmail || username;
        const updated = [...messages, newMessage];
        setMessages(updated);
        savePrivateChat(keyOther, updated);

        // Try to send to server as well (API contract)
        if (token && peerEmail) {
            // Send using the required format
            webSocketService.send({ type: 'send_message', token, to: peerEmail, message: text });
        }

        // After sending a message, push current PV emails set to server as updated open chats
        try {
            if (token) {
                const emails = getStoredEmails();
                if (Array.isArray(emails)) {
                    webSocketService.send({ type: 'update_open_chats', token, open_chats: emails });
                }
            }
        } catch {}
    };

    // حذف پیام از چت خصوصی
    const handleDeleteMessage = (messageId) => {
        const keyOther = peerEmail || username;
        const updated = messages.filter(msg => msg.id !== messageId);
        setMessages(updated);
        savePrivateChat(keyOther, updated);
        // ارسال درخواست حذف به سرور
        try {
            if (token && messageId) {
                webSocketService.send({ type: 'delete_message', token, message_id: messageId });
            }
        } catch {}
    };

    // حذف کامل چت
    const handleDeleteChat = (userToDelete) => {
        clearPrivateChat(userToDelete);
        setMessages([]); // پاک کردن پیام‌ها از state
    };

    // مدیریت ری‌اکشن‌های پیام
    const handleReactionChange = (messageId, emojiName) => {
        const updatedMessages = messages.map(msg => {
            if (msg.id === messageId) {
                const currentReactions = msg.reactions || {};
                const currentUsers = currentReactions[emojiName] || [];

                // بررسی اینکه آیا کاربر فعلی قبلاً این ری‌اکشن را گذاشته یا نه
                const userIndex = currentUsers.indexOf("me");

                if (userIndex > -1) {
                    // حذف ری‌اکشن کاربر
                    const newUsers = currentUsers.filter(user => user !== "me");
                    if (newUsers.length === 0) {
                        // اگر هیچ کاربری این ری‌اکشن را ندارد، کل ری‌اکشن را حذف کن
                        const { [emojiName]: removed, ...restReactions } = currentReactions;
                        return { ...msg, reactions: restReactions };
                    } else {
                        // به‌روزرسانی لیست کاربران
                        return {
                            ...msg,
                            reactions: {
                                ...currentReactions,
                                [emojiName]: newUsers
                            }
                        };
                    }
                } else {
                    // اضافه کردن ری‌اکشن کاربر
                    return {
                        ...msg,
                        reactions: {
                            ...currentReactions,
                            [emojiName]: [...currentUsers, "me"]
                        }
                    };
                }
            }
            return msg;
        });

        const keyOther = peerEmail || username;
        setMessages(updatedMessages);
        savePrivateChat(keyOther, updatedMessages);
    };

    // فوروارد پیام به مخاطب دیگر
    const handleForwardMessage = (targetUsername, messageToForward) => {
        // ایجاد پیام فوروارد شده
        const forwardedMessage = {
            id: uuidv4(),
            type: "msg",
            message: messageToForward.message,
            incoming: false,
            outgoing: true,
            sender: "me",
            receiver: targetUsername,
            timestamp: new Date().toISOString(),
            forwarded: true,
             originalSender: messageToForward.sender === "me" ? "شما" : chatProfile?.fullName || chatProfile?.username || chatProfile?.email || "کاربر",
            originalChat: username,
        };

        // ذخیره پیام فوروارد شده در چت هدف
        const targetChatMessages = loadPrivateChat(targetUsername) || [];
        const updatedTargetMessages = [...targetChatMessages, forwardedMessage];
        savePrivateChat(targetUsername, updatedTargetMessages);

        // نمایش پیام موفقیت
        alert(`پیام با موفقیت به ${targetUsername} فوروارد شد!`);
    };

    // ویرایش پیام
    const handleEditMessage = (messageId, newText) => {
        const updatedMessages = messages.map(msg =>
            msg.id === messageId ? { ...msg, message: newText } : msg
        );
        setMessages(updatedMessages);
        const keyOther = peerEmail || username;
        savePrivateChat(keyOther, updatedMessages);
        // ارسال درخواست ویرایش به سرور
        try {
            if (token && messageId && typeof newText === 'string') {
                webSocketService.send({ type: 'edit_message', token, message_id: messageId, new_content: newText });
            }
        } catch {}
    };

    // When opening a chat or messages arrive, mark all unread incoming as read
    useEffect(() => {
        if (!token) return;
        const keyOther = peerEmail || username;
        const unreadIncoming = (messages || []).filter((m) => m && m.incoming === true && m.read !== true && m.id);
        if (unreadIncoming.length === 0) return;
        try {
            unreadIncoming.forEach((m) => {
                webSocketService.send({ type: 'mark_as_read', token, message_id: m.id });
            });
        } catch {}
        // Optimistic local update
        const updated = messages.map((m) => (m && m.incoming === true && m.read !== true ? { ...m, read: true } : m));
        setMessages(updated);
        savePrivateChat(keyOther, updated);
    }, [token, peerEmail, username, messages]);

    if (!chatProfile) return <div>مخاطب یافت نشد</div>;

    return (
        <Stack direction={"row"}>
            <Chats />
            <Box
                sx={{
                    position: "fixed",
                    top: 30,
                    left: 420,
                    height: "100vh",
                    width: "calc(100vw - 420px)",
                }}
            >
                <Conversation
                    chatData={chatProfile}
                    messages={messages}
                    onSend={handleSendMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onDeleteChat={handleDeleteChat}
                    onReactionChange={handleReactionChange}
                    onForwardMessage={handleForwardMessage}
                    onEditMessage={handleEditMessage}
                    onReportMessage={(msg) => {
                        try {
                            if (!msg?.id) return;
                            if (!token) {
                                Swal.fire({ toast: true, position: 'bottom-start', icon: 'error', title: 'ابتدا وارد شوید', showConfirmButton: false, timer: 1800, timerProgressBar: true });
                                return;
                            }
                            Swal.fire({
                                title: 'گزارش پیام',
                                input: 'text',
                                inputLabel: 'دلیل گزارش را وارد کنید',
                                inputPlaceholder: 'مثل: محتوای نامناسب',
                                showCancelButton: true,
                                confirmButtonText: 'ارسال',
                                cancelButtonText: 'انصراف'
                            }).then((res) => {
                                if (res.isConfirmed) {
                                    const reason = res.value || '';
                                    webSocketService.send({ type: 'report_message', token, message_id: msg.id, reason });
                                    Swal.fire({ toast: true, position: 'bottom-start', icon: 'success', title: 'گزارش ارسال شد', showConfirmButton: false, timer: 1800, timerProgressBar: true });
                                }
                            });
                        } catch {}
                    }}
                />
            </Box>
        </Stack>
    );
};

export default ChatPage;

