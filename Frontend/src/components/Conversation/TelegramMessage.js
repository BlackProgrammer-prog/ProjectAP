import { Stack, Box, Typography, Avatar, useTheme, TextField, IconButton, Button, Checkbox } from "@mui/material";
import { format } from "date-fns";
import { MessageOption } from "./MsgType";
import MessageReactions from "./MessageReactions";
import { faker } from "@faker-js/faker";
import { useParams } from "react-router-dom";
import { loadPV } from "../../utils/pvStorage";
import { resolveAvatarUrl } from "../../utils/resolveAvatarUrl";
import { useState } from "react";
import React from "react";
import { useRef } from "react";

const TelegramMessage = ({ message, onDeleteMessage, onReactionChange, onForwardMessage, onEditMessage, onReportMessage, currentUser = "me", selectMode = false, selected = false, onMessageClick, onToggleSelect }) => {
    const theme = useTheme();
    const menuRef = useRef(null);
    const { username } = useParams();
    const isOwnMessage = message.sender === currentUser || message.outgoing;

    // پیدا کردن اطلاعات کاربر مقابل از PV (localStorage)
    const pv = loadPV();
    const otherUser = (pv || []).find((p) => p.customUrl === username);

    // تعیین آواتار بر اساس فرستنده
    const getAvatar = () => {
        if (message && message.senderAvatar) {
            return message.senderAvatar;
        }
        if (isOwnMessage) {
            return faker.image.avatar();
        } else {
            return otherUser ? resolveAvatarUrl(otherUser.avatarUrl) : faker.image.avatar();
        }
    };

    // فرمت کردن زمان
    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return format(date, "HH:mm");
        } catch {
            return "00:00";
        }
    };

    // حالت ویرایش
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.message);

    // وقتی پیام تغییر کرد، مقدار ورودی را به‌روزرسانی کن
    React.useEffect(() => {
        setEditText(message.message);
    }, [message.message]);

    const handleEditClick = () => {
        setIsEditing(true);
    };
    const handleEditCancel = () => {
        setIsEditing(false);
        setEditText(message.message);
    };
    const handleEditSave = () => {
        if (editText.trim() && editText !== message.message) {
            onEditMessage && onEditMessage(message.id, editText);
        }
        setIsEditing(false);
    };
    const handleEditInputKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleEditSave();
        } else if (e.key === "Escape") {
            handleEditCancel();
        }
    };

    return (
        <Stack
            direction="row"
            justifyContent={isOwnMessage ? "flex-end" : "flex-start"}
            spacing={1}
            sx={{ mb: 2 }}
        >
            {/* آواتار فرستنده (فقط برای پیام‌های دیگران) */}
            {!isOwnMessage && (
                <Avatar
                    src={getAvatar()}
                    sx={{
                        width: 32,
                        height: 32,
                        mt: "auto",
                        mb: 0.5,
                    }}
                />
            )}

            {/* پیام */}
            <Stack direction="row" alignItems="flex-end" spacing={1}>
                {/* Checkbox for select mode */}
                {selectMode && (
                    <Checkbox
                        checked={selected}
                        onChange={onToggleSelect}
                        sx={{ alignSelf: "center" }}
                        color="primary"
                    />
                )}
                <Box
                    sx={{
                        maxWidth: "70%",
                        backgroundColor: selected ? "#e0e0e0" : (isOwnMessage
                            ? theme.palette.primary.main
                            : theme.palette.mode === "light"
                                ? "#f0f0f0"
                                : theme.palette.grey[800]),
                        borderRadius: isOwnMessage
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                        padding: "8px 12px",
                        position: "relative",
                        wordBreak: "break-word",
                        cursor: selectMode && !isEditing ? "pointer" : "default",
                        transition: "background 0.2s",
                        boxShadow: theme.shadows[1], //add
                    }}
                    onClick={(!isEditing && selectMode) ? onToggleSelect : (!isEditing ? onMessageClick : undefined)}
                    onContextMenu={(e) => {
                        // Right-click opens the same options menu
                        try {
                            if (menuRef && menuRef.current && typeof menuRef.current.openAt === 'function') {
                                menuRef.current.openAt(e);
                            } else {
                                e.preventDefault();
                            }
                        } catch {}
                    }}
                >
                    {/* نام فرستنده برای پیام‌های گروهی */}
                    {message?.senderName && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: isOwnMessage ? "rgba(255,255,255,0.85)" : theme.palette.text.secondary,
                                fontWeight: 600,
                                display: 'block',
                                mb: 0.5,
                            }}
                        >
                            {message.senderName}
                        </Typography>
                    )}
                    {/* نمایش ری‌اکشن‌ها */}
                    <MessageReactions
                        message={message}
                        onReactionChange={onReactionChange}
                    />
                    {/* نمایش اطلاعات فوروارد */}
                    {message.forwarded && (
                        <Box
                            sx={{
                                mb: 1,
                                p: 1,
                                backgroundColor: isOwnMessage
                                    ? "rgba(255,255,255,0.1)"
                                    : theme.palette.mode === "light"
                                        ? "rgba(0,0,0,0.05)"
                                        : "rgba(255,255,255,0.05)",
                                borderRadius: 1,
                                borderLeft: `3px solid ${theme.palette.primary.main}`,
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: isOwnMessage ? "rgba(255,255,255,0.8)" : theme.palette.text.secondary,
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    display: "block",
                                    mb: 0.5,
                                }}
                            >
                                فوروارد شده از {message.originalSender}
                            </Typography>
                        </Box>
                    )}

                    {/* حالت ویرایش */}
                    {isEditing ? (
                        <Stack spacing={1} direction="row" alignItems="center">
                            <TextField
                                size="small"
                                fullWidth
                                value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={handleEditInputKeyDown}
                                autoFocus
                                multiline
                                minRows={1}
                                maxRows={4}
                                sx={{
                                    backgroundColor: isOwnMessage ? "#fff" : theme.palette.background.paper,
                                    borderRadius: 1,
                                }}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={handleEditSave}
                            >
                                ذخیره
                            </Button>
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                onClick={handleEditCancel}
                                sx={{ minWidth: 40 }}
                            >
                                لغو
                            </Button>
                        </Stack>
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                color: isOwnMessage ? "#fff" : theme.palette.text.primary,
                                fontSize: "0.875rem",
                                lineHeight: 1.4,
                            }}
                        >
                            {message.message}
                        </Typography>
                    )}

                    {/* زمان ارسال */}
                    <Typography
                        variant="caption"
                        sx={{
                            color: isOwnMessage ? "rgba(255,255,255,0.7)" : theme.palette.text.secondary,
                            fontSize: "0.75rem",
                            display: "block",
                            textAlign: "right",
                            mt: 0.5,
                        }}
                    >
                        {formatTime(message.timestamp)}
                    </Typography>
                </Box>

                {/* دکمه‌های آپشن */}
                <MessageOption
                    el={message}
                    message={message.message}
                    onDeleteMessage={onDeleteMessage}
                    onReactionChange={onReactionChange}
                    onForwardMessage={onForwardMessage}
                    onEditClick={isOwnMessage ? handleEditClick : undefined}
                    onReportMessage={onReportMessage}
                    ref={menuRef}
                />
            </Stack>

            {/* آواتار کاربر فعلی (فقط برای پیام‌های خودش) */}
            {isOwnMessage && (
                <Avatar
                    src={getAvatar()}
                    sx={{
                        width: 32,
                        height: 32,
                        mt: "auto",
                        mb: 0.5,
                    }}
                />
            )}
        </Stack>
    );
};

export default TelegramMessage; 