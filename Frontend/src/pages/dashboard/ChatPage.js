import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Box, Stack } from "@mui/material";
import { ChatList, Chat_History } from "../../data";
import Conversation from "../../components/Conversation";
import Chats from "./Chats";
import { savePrivateChat, loadPrivateChat } from "../../utils/chatStorage";

const ChatPage = () => {
    const { username } = useParams();
    const chat = ChatList.find((c) => c.username === username);

    // پیام‌های چت خصوصی بین کاربر فعلی و کاربر انتخاب شده
    const [messages, setMessages] = useState(() => loadPrivateChat(username) || Chat_History);

    // اگر username تغییر کرد، پیام‌های چت خصوصی جدید را لود کن
    useEffect(() => {
        setMessages(loadPrivateChat(username) || Chat_History);
    }, [username]);

    // ذخیره پیام جدید در چت خصوصی
    const handleSendMessage = (text) => {
        const newMessage = {
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
                />
            </Box>
        </Stack>
    );
};

export default ChatPage;

