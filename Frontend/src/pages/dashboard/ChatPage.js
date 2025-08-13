import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, Stack } from "@mui/material";
import { Chat_History } from "../../data";
import Conversation from "../../components/Conversation";
import Chats from "./Chats";
import { savePrivateChat, loadPrivateChat, clearPrivateChat } from "../../utils/chatStorage";
import { v4 as uuidv4 } from 'uuid';
import { loadPV } from "../../utils/pvStorage";

const ChatPage = () => {
    const { username } = useParams(); // username == customUrl
    const pv = loadPV();
    const chatProfile = (pv || []).find((p) => p.customUrl === username);

    // پیام‌های چت خصوصی بین کاربر فعلی و کاربر انتخاب شده
    const [messages, setMessages] = useState(() => {
        const loadedMessages = loadPrivateChat(username) || Chat_History;
        // اضافه کردن id به پیام‌های موجود که id ندارند
        return loadedMessages.map(msg => ({
            ...msg,
            id: msg.id || uuidv4()
        }));
    });

    // اگر username تغییر کرد، پیام‌های چت خصوصی جدید را لود کن
    useEffect(() => {
        const loadedMessages = loadPrivateChat(username) || Chat_History;
        const messagesWithIds = loadedMessages.map(msg => ({
            ...msg,
            id: msg.id || uuidv4()
        }));
        setMessages(messagesWithIds);
    }, [username]);

    // ذخیره پیام جدید در چت خصوصی
    const handleSendMessage = (text) => {
        const newMessage = {
            id: uuidv4(), // آیدی یکتا
            type: "msg",
            message: text,
            incoming: false,
            outgoing: true,
            sender: "me", // کاربر فعلی
            receiver: username, // کاربر مقابل (کلید چت = customUrl)
            timestamp: new Date().toISOString(),
        };
        const updated = [...messages, newMessage];
        setMessages(updated);
        savePrivateChat(username, updated);
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

