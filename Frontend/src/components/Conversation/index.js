
// ..........................................................MAIN

import Header from "./Header"
import Footer from "../Chat/Footer"
import { Stack, Box } from "@mui/material"
import Message from "./Message"
import { Timeline } from "./MsgType"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import WallpaperDialog from "../WallpaperDialog"

const Conversation = ({ chatData, messages, onSend, onDeleteMessage, onDeleteChat, onReactionChange, onForwardMessage, onEditMessage }) => {
    const { username } = useParams()
    const [blockedUsers, setBlockedUsers] = useState(() => {
        const stored = localStorage.getItem('blocked_users');
        return stored ? JSON.parse(stored) : [];
    });
    const [isBlocked, setIsBlocked] = useState(false);

    // Search state
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Search handlers
    const handleSearchChange = (active, query = '') => {
        setIsSearchActive(active);
        setSearchQuery(query);
    };

    const [chatWallpaper, setChatWallpaper] = useState(null);
    const [openWallpaperDialog, setOpenWallpaperDialog] = useState(false);
    const handleWallpaperChange = (newWallpaper) => {
        setChatWallpaper(newWallpaper);
    };


    // بارگذاری والپیپر از localStorage
    useEffect(() => {
        const savedWallpaper = localStorage.getItem('chatWallpaper');
        if (savedWallpaper) {
            setChatWallpaper(JSON.parse(savedWallpaper));
        }
    }, []);

    return (
        <Stack>
            {/* Header */}
            <Stack
                sx={{
                    backgroundImage: chatWallpaper ? `url(${chatWallpaper.image})` : '#f5f7fa',
                    backgroundSize: 'cover',
                }}>
                <Header
                    chatData={chatData}
                    onBlockUser={handleBlockUser}
                    onDeleteChat={handleDeleteChat}
                    onSearchChange={handleSearchChange}
                    isSearchActive={isSearchActive}
                />
            </Stack>


            {/* Messages area with Timeline */}
            <Box
                sx={{
                    position: "fixed",
                    top: isSearchActive ? "160px" : "100px",
                    left: 422,
                    right: 0,
                    bottom: "80px",
                    overflowY: "auto",
                    px: 3,
                    py: 2,
                    // backgroundColor: theme => theme.palette.mode === 'light'
                    //     ? 'rgba(255, 255, 255, 0.85)'
                    //     : 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(5px)',
                    backgroundImage: chatWallpaper ? `url(${chatWallpaper.image})` : '#f5f7fa',
                    backgroundSize: 'cover',
                }}
            >
                <Message
                    messages={messages}
                    onDeleteMessage={onDeleteMessage}
                    onReactionChange={onReactionChange}
                    onForwardMessage={onForwardMessage}
                    onEditMessage={onEditMessage}
                    isSearchActive={isSearchActive}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                />
            </Box>

            {/* chat footer */}
            <Footer
                onSend={onSend}
                disabled={isBlocked}
            />
            <WallpaperDialog
                open={openWallpaperDialog}
                onClose={() => setOpenWallpaperDialog(false)}
                onSelectWallpaper={handleWallpaperChange}
            />
        </Stack>
    );
};
export default Conversation