import { useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Box, Stack } from "@mui/material";
import { Chat_History } from "../../data";
import Conversation from "../../components/Conversation";
import Chats from "./Chats";
import { savePrivateChat, loadPrivateChat, clearPrivateChat } from "../../utils/chatStorage";
import { v4 as uuidv4 } from 'uuid';
import { loadPV, getStoredEmails } from "../../utils/pvStorage";
import { useAuth } from "../../Login/Component/Context/AuthContext";
import webSocketService from "../../Login/Component/Services/WebSocketService";
import Swal from "sweetalert2";

const ChatPage = () => {
    const { username } = useParams(); // username == customUrl
    const { token, user } = useAuth();
    const pv = loadPV();
    const chatProfile = useMemo(() => (pv || []).find((p) => p.customUrl === username), [pv, username]);
    const peerEmail = chatProfile?.email || chatProfile?.username; // fallback if email is absent
    const myEmail = user?.email;

    // پیام‌های چت خصوصی بین کاربر فعلی و کاربر انتخاب شده
    const [messages, setMessages] = useState(() => {
        const loadedMessages = loadPrivateChat(username) || Chat_History;
        // اضافه کردن id به پیام‌های موجود که id ندارند
        return loadedMessages.map(msg => ({
            ...msg,
            id: msg.id || uuidv4()
        }));
    });

    // اگر username تغییر کرد، پیام‌های چت خصوصی جدید را لود کن و از سرور درخواست بگیر
    useEffect(() => {
        const loadedMessages = loadPrivateChat(username) || Chat_History;
        const messagesWithIds = loadedMessages.map(msg => ({
            ...msg,
            id: msg.id || uuidv4()
        }));
        setMessages(messagesWithIds);

        // Request last N messages from server
        if (token && peerEmail) {
            webSocketService.send({ type: 'get_messages', token, with: peerEmail, limit: 100 });
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

        return {
            id: serverId,
            type: 'msg',
            message: text,
            incoming: !outgoing,
            outgoing: outgoing,
            sender: outgoing ? (myEmail || 'me') : (peerEmail || username),
            receiver: outgoing ? (peerEmail || username) : (myEmail || 'me'),
            timestamp: ts,
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

            // Handle bulk messages response
            if (data && data.status === 'success' && Array.isArray(data.messages)) {
                const adapted = data.messages.map(adaptServerMessage);
                setMessages(adapted);
                savePrivateChat(username, adapted);
                Swal.fire({ toast: true, position: 'bottom-start', icon: 'success', title: `دریافت ${data.count ?? adapted.length} پیام`, showConfirmButton: false, timer: 1800, timerProgressBar: true });
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
                        const next = [...prev, incomingMsg];
                        savePrivateChat(username, next);
                        return next;
                    });
                }
            }
        });
        return () => off && off();
    }, [username, myEmail, peerEmail]);

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
        };
        const updated = [...messages, newMessage];
        setMessages(updated);
        savePrivateChat(username, updated);

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
        const updated = messages.filter(msg => msg.id !== messageId);
        setMessages(updated);
        savePrivateChat(username, updated);
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

        setMessages(updatedMessages);
        savePrivateChat(username, updatedMessages);
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
        savePrivateChat(username, updatedMessages);
    };

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
                />
            </Box>
        </Stack>
    );
};

export default ChatPage;

