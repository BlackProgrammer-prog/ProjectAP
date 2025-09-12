
// ..........................................................MAIN

import Header from "./Header"
import Footer from "../Chat/Footer"
import { Stack, Box } from "@mui/material"
import Message from "./Message"
import { Timeline } from "./MsgType"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import WallpaperDialog from "../WallpaperDialog"

const Conversation = ({ chatData, messages, onSend, onDeleteMessage, onDeleteChat, onReactionChange, onForwardMessage, onEditMessage, onReportMessage, isGroup = false }) => {
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
                    onExportChat={async () => {
                        try {
                            // Load html2pdf bundle from CDN if not present
                            const ensureHtml2Pdf = () => new Promise((resolve, reject) => {
                                if (window.html2pdf) { resolve(); return; }
                                const s = document.createElement('script');
                                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                                s.async = true;
                                s.onload = () => resolve();
                                s.onerror = reject;
                                document.body.appendChild(s);
                            });
                            await ensureHtml2Pdf();

                            const title = (chatData && (chatData.fullName || chatData.name || chatData.customUrl)) || 'Chat';
                            const fileName = `chat_${title}`.replace(/\s+/g, '_') + '.pdf';

                            // Build a clean, printable container
                            const container = document.createElement('div');
                            container.style.padding = '16px';
                            container.style.fontFamily = 'sans-serif';
                            container.style.width = '800px';
                            container.style.maxWidth = '100%';
                            container.style.color = '#111';

                            const header = document.createElement('div');
                            header.style.marginBottom = '12px';
                            header.innerHTML = `<h2 style="margin:0 0 6px 0;">${title}</h2>` +
                                `<div style="font-size:12px;color:#666;">Exported at ${new Date().toLocaleString()}</div>`;
                            container.appendChild(header);

                            const list = document.createElement('div');
                            list.style.display = 'flex';
                            list.style.flexDirection = 'column';
                            list.style.gap = '8px';
                            container.appendChild(list);

                            const safe = (v) => (v == null ? '' : String(v));
                            const formatTime = (ts) => {
                                try {
                                    const d = new Date(ts);
                                    return d.toLocaleString();
                                } catch { return ''; }
                            };

                            (Array.isArray(messages) ? messages : []).forEach((m) => {
                                const wrapper = document.createElement('div');
                                wrapper.style.border = '1px solid #e5e7eb';
                                wrapper.style.borderRadius = '8px';
                                wrapper.style.padding = '8px 10px';
                                wrapper.style.background = m && m.outgoing ? '#eef6ff' : '#f9fafb';

                                const meta = document.createElement('div');
                                meta.style.fontSize = '11px';
                                meta.style.color = '#6b7280';
                                const senderLabel = isGroup ? (safe(m.senderName) || safe(m.sender) || '') : (m && m.outgoing ? 'You' : (chatData && (chatData.fullName || chatData.name || chatData.customUrl)) || 'Peer');
                                meta.textContent = `${formatTime(m && m.timestamp)} • ${senderLabel}`;
                                wrapper.appendChild(meta);

                                const content = document.createElement('div');
                                content.style.whiteSpace = 'pre-wrap';
                                content.style.wordBreak = 'break-word';
                                content.style.fontSize = '13px';
                                content.style.marginTop = '4px';
                                content.textContent = safe(m && (m.message || m.content || ''));
                                wrapper.appendChild(content);

                                list.appendChild(wrapper);
                            });

                            document.body.appendChild(container);
                            // @ts-ignore - html2pdf injected globally
                            await window.html2pdf().from(container).set({
                                margin:       10,
                                filename:     fileName,
                                image:        { type: 'jpeg', quality: 0.95 },
                                html2canvas:  { scale: 2, useCORS: true },
                                jsPDF:        { unit: 'pt', format: 'a4', orientation: 'portrait' }
                            }).save();
                            document.body.removeChild(container);
                        } catch {}
                    }}
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
                    onReportMessage={onReportMessage}
                    isSearchActive={isSearchActive}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    isGroup={isGroup}
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