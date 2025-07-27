
// ..........................................................MAIN

import Header from "./Header"
import Footer from "./Footer"
import { Stack, Box } from "@mui/material"
import Message from "./Message"
import { Timeline } from "./MsgType"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"

const Conversation = ({ messages, onSend, onDeleteMessage, onDeleteChat }) => {
    const { username } = useParams()
    const [blockedUsers, setBlockedUsers] = useState(() => {
        const stored = localStorage.getItem('blocked_users');
        return stored ? JSON.parse(stored) : [];
    });
    const [isBlocked, setIsBlocked] = useState(false);

    // بررسی وضعیت بلاک کاربر
    useEffect(() => {
        setIsBlocked(blockedUsers.includes(username));
    }, [blockedUsers, username]);

    const handleBlockUser = (userToBlock, isNowBlocked) => {
        setBlockedUsers(prev => {
            const newBlockedUsers = isNowBlocked
                ? [...prev, userToBlock]
                : prev.filter(user => user !== userToBlock);
            localStorage.setItem('blocked_users', JSON.stringify(newBlockedUsers));
            return newBlockedUsers;
        });
    };

    const handleDeleteChat = (userToDelete) => {
        if (onDeleteChat) {
            onDeleteChat(userToDelete);
        }
    };

    return (
        <Stack>
            {/* chat header */}
            <Header
                onBlockUser={handleBlockUser}
                onDeleteChat={handleDeleteChat}
            />

            {/* Messages area with Timeline */}
            <Box
                sx={{
                    position: "fixed",
                    top: "100px",
                    left: 422,
                    right: 0,
                    bottom: "80px", // فضا برای footer
                    overflowY: "auto",
                    px: 3,
                    py: 2,
                }}
            >
                <Message messages={messages} onDeleteMessage={onDeleteMessage} />
            </Box>

            {/* chat footer */}
            <Footer
                username={username}
                onSend={onSend}
                isBlocked={isBlocked}
            />
        </Stack>
    )
}

export default Conversation


// ..................................................................................
