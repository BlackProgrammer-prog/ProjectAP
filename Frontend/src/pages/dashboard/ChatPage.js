import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, Stack } from "@mui/material";
import { ChatList, Chat_History } from "../../data";
import Conversation from "../../components/Conversation";
import Chats from "./Chats";
import { savePrivateChat, loadPrivateChat, clearPrivateChat } from "../../utils/chatStorage";
import { v4 as uuidv4 } from 'uuid';

const ChatPage = () => {
    const { username } = useParams();
    const chat = ChatList.find((c) => c.username === username);

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
            receiver: username, // کاربر مقابل
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

    if (!chat) return <div>مخاطب یافت نشد</div>;

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
                    username={username}
                    chatData={chat}
                    messages={messages}
                    onSend={handleSendMessage}
                    onDeleteMessage={handleDeleteMessage}
                    onDeleteChat={handleDeleteChat}
                />
            </Box>
        </Stack>
    );
};

export default ChatPage;

