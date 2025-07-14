// import { useParams } from "react-router-dom";
// import { Box, Stack } from "@mui/material";
// import Conversation from "../../components/Conversation";
// import { useTheme } from "@mui/material/styles";
// import { ChatList } from "../../data";
// import Header from "../../components/Conversation/Header";
// import Message from "../../components/Conversation/Message";
// import Footer from "../../components/Conversation/Footer";

// const ChatPage = () => {
//     const theme = useTheme();
//     // const { username } = useParams(); // دریافت ID مخاطب از URL
//     // const chat = ChatList.find((chat) => chat.username === username); // یافتن مخاطب بر اساس ID
//     const { username } = useParams();
//     const chat = ChatList.find((chat) => chat.username === username);


//     if (!chat) {
//         return <div>مخاطب یافت نشد</div>;
//     }

//     return (
//         <Stack direction={"row"}>
//             {/* ناحیه اصلی مکالمه */}
//             <Box
//                 sx={{
//                     position: 'fixed',
//                     top: 30,
//                     left: 420,
//                     height: "100vh",
//                     width: "calc(100vw - 420px)",
//                     backgroundColor: theme.palette.mode === "light" ? "#F0F4FA" : theme.palette.background.paper,
//                 }}
//             >
//                 <Conversation chatData={chat} username={username} /> {/* ارسال اطلاعات مخاطب به کامپوننت Conversation */}
//             </Box>
//         </Stack>
//     );
// };

// export default ChatPage;

//===========================================

import { useParams } from "react-router-dom";
import { useState } from "react";
import { Box, Stack } from "@mui/material";
import { ChatList, Chat_History } from "../../data";
import Conversation from "../../components/Conversation";

const ChatPage = () => {
    const { username } = useParams();
    const chat = ChatList.find((c) => c.username === username);

    const [messages, setMessages] = useState(Chat_History); // استیت پیام‌ها

    const handleSendMessage = (text) => {
        const newMessage = {
            type: "msg",
            message: text,
            incoming: false,
            outgoing: true,
        };
        setMessages((prev) => [...prev, newMessage]);
    };

    if (!chat) return <div>مخاطب یافت نشد</div>;

    return (
        <Stack direction={"row"}>
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

