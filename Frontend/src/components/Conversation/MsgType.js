"use client"

import { Box, Divider, IconButton, Menu, MenuItem, Stack, Typography, useTheme } from "@mui/material"
import {
    DotsThreeVertical,
    DownloadSimple,
    Image,
    ArrowBendUpLeft,
    ArrowRight,
    Star,
    SmileyWink,
    Flag,
    Trash,
    Copy,
} from "phosphor-react"
import { useState } from "react"
import ForwardDialog from "./ForwardDialog"
import { MdEdit } from "react-icons/md";

// Message options with icons
const Message_options = [
    {
        title: "Reply",
        icon: <ArrowBendUpLeft size={16} />,
        color: "#1976d2",
    },
    {
        title: "React to message",
        icon: <SmileyWink size={16} />,
        color: "#ff9800",
    },
    {
        title: "Forward message",
        icon: <ArrowRight size={16} />,
        color: "#4caf50",
    },
    {
        title: "Copy message",
        icon: <Copy size={16} />,
        color: "#9c27b0",
    },
    {
        title: "Edit message",
        icon: <MdEdit size={16} />,
        color: "#ffc107",
    },
    {
        title: "Report",
        icon: <Flag size={16} />,
        color: "#ff5722",
    },
    {
        title: "Delete message",
        icon: <Trash size={16} />,
        color: "#f44336",
    },
]

export const MessageOption = ({ el, message, onDeleteMessage, onReactionChange, onForwardMessage, onEditClick }) => {
    const [anchorEl, setAnchorEl] = useState(null)
    const [reactionAnchorEl, setReactionAnchorEl] = useState(null)
    const [forwardDialogOpen, setForwardDialogOpen] = useState(false)
    const open = Boolean(anchorEl)
    const reactionOpen = Boolean(reactionAnchorEl)
    const theme = useTheme()

    // ایموجی‌های پیش‌فرض برای ری‌اکشن
    const REACTION_EMOJIS = [
        { emoji: "❤️", name: "heart" },
        { emoji: "😆", name: "laugh" },
        { emoji: "😮", name: "wow" },
        { emoji: "👍", name: "thumbsUp" },
        { emoji: "👎", name: "thumbsDown" },
    ];

    const handleClick = (e) => {
        setAnchorEl(e.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleReactionClick = (e) => {
        setReactionAnchorEl(e.currentTarget)
    }

    const handleReactionClose = () => {
        setReactionAnchorEl(null)
    }

    const handleMenuItemClick = (option, e) => {
        if (option.title === "Copy message") {
            // کپی کردن پیام به کلیپ‌بورد
            navigator.clipboard.writeText(message).then(() => {
                alert("پیام کپی شد!");
            }).catch((err) => {
                console.error("خطا در کپی پیام:", err);
            });
        } else if (option.title === "Delete message") {
            // حذف پیام
            if (onDeleteMessage && el.id) {
                onDeleteMessage(el.id);
            }
        } else if (option.title === "React to message") {
            // نمایش پاپ‌آپ ری‌اکشن
            handleReactionClick(e);
        } else if (option.title === "Forward message") {
            // نمایش دیالوگ فوروارد
            setForwardDialogOpen(true);
        } else if (option.title === "Edit message") {
            if (onEditClick) onEditClick();
        }
        handleClose();
    }

    const handleEmojiClick = (emojiName) => {
        if (onReactionChange && el.id) {
            onReactionChange(el.id, emojiName);
        }
        handleReactionClose();
    }

    const handleForward = (targetUsername, messageToForward) => {
        if (onForwardMessage) {
            onForwardMessage(targetUsername, messageToForward);
        }
    }

    return (
        <>
            <IconButton
                onClick={handleClick}
                size="small"
                sx={{
                    opacity: 0.7,
                    "&:hover": {
                        opacity: 1,
                        backgroundColor: "rgba(0,0,0,0.04)",
                    },
                }}
            >
                <DotsThreeVertical size={16} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        minWidth: 200,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        border: `1px solid ${theme.palette.divider}`,
                    },
                }}
            >
                <Stack spacing={0.5} py={1}>
                    {Message_options.map((option, index) => (
                        <MenuItem
                            key={index}
                            onClick={(e) => handleMenuItemClick(option, e)}
                            sx={{
                                mx: 1,
                                borderRadius: 1,
                                fontSize: "0.875rem",
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                py: 1,
                                "&:hover": {
                                    backgroundColor: theme.palette.action.hover,
                                    "& .menu-icon": {
                                        color: option.color,
                                    },
                                },
                            }}
                        >
                            <Box
                                className="menu-icon"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    display: "flex",
                                    alignItems: "center",
                                    transition: "color 0.2s ease",
                                }}
                            >
                                {option.icon}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {option.title}
                            </Typography>
                        </MenuItem>
                    ))}
                </Stack>
            </Menu>

            {/* پاپ‌آپ انتخاب ری‌اکشن */}
            <Menu
                anchorEl={reactionAnchorEl}
                open={reactionOpen}
                onClose={handleReactionClose}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "center",
                }}
                transformOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                PaperProps={{
                    sx: {
                        borderRadius: "16px",
                        padding: "8px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                        border: `1px solid ${theme.palette.divider}`,
                        minWidth: "auto",
                    },
                }}
            >
                <Stack direction="row" spacing={1}>
                    {REACTION_EMOJIS.map(({ emoji, name }) => {
                        const reactions = el.reactions || {};
                        const isSelected = reactions[name]?.includes("me");
                        const reactionCount = reactions[name]?.length || 0;

                        return (
                            <Box
                                key={name}
                                sx={{
                                    position: "relative",
                                    cursor: "pointer",
                                    padding: "4px",
                                    borderRadius: "8px",
                                    backgroundColor: isSelected ? theme.palette.primary.light : "transparent",
                                    "&:hover": {
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                }}
                                onClick={() => handleEmojiClick(name)}
                            >
                                <Typography
                                    sx={{
                                        fontSize: "1.25rem",
                                        opacity: isSelected ? 1 : 0.8,
                                    }}
                                >
                                    {emoji}
                                </Typography>

                                {/* نمایش تعداد ری‌اکشن */}
                                {reactionCount > 0 && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            position: "absolute",
                                            top: "-4px",
                                            right: "-4px",
                                            backgroundColor: theme.palette.primary.main,
                                            color: "white",
                                            borderRadius: "50%",
                                            width: "16px",
                                            height: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "0.625rem",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {reactionCount}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            </Menu>

            {/* دیالوگ فوروارد پیام */}
            <ForwardDialog
                open={forwardDialogOpen}
                onClose={() => setForwardDialogOpen(false)}
                onForward={handleForward}
                message={el}
            />
        </>
    )
}

export const DocMsg = ({ el, onDeleteMessage, onReactionChange, onForwardMessage }) => {
    const theme = useTheme()
    return (
        <Stack direction={"row"} justifyContent={el.incoming ? "start" : "end"}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Box
                    p={1.5}
                    sx={{
                        backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
                        width: "max-content",
                        maxWidth: "70%",
                    }}
                    borderRadius={1.5}
                >
                    <Stack spacing={2}>
                        <Stack
                            p={2}
                            direction={"row"}
                            alignItems={"center"}
                            sx={{
                                backgroundColor: theme.palette.background.paper,
                                borderRadius: 1,
                            }}
                        >
                            <Image size={28} />
                            <Stack p={2}>
                                <Typography variant="caption">Abstract.png</Typography>
                            </Stack>
                            <Stack>
                                <IconButton>
                                    <DownloadSimple />
                                </IconButton>
                            </Stack>
                        </Stack>
                        <Typography
                            variant="body2"
                            sx={{
                                color: el.incoming ? theme.palette.text : "#fff",
                            }}
                        >
                            {el.message}
                        </Typography>
                    </Stack>
                </Box>
                {!el.incoming && <MessageOption el={el} message={el.message} onDeleteMessage={onDeleteMessage} onReactionChange={onReactionChange} onForwardMessage={onForwardMessage} onEditClick={undefined} />}
            </Stack>
        </Stack>
    )
}

export const LinkMsg = ({ el, onDeleteMessage, onReactionChange, onForwardMessage }) => {
    const theme = useTheme()
    return (
        <Stack direction={"row"} justifyContent={el.incoming ? "start" : "end"}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                {el.incoming && <MessageOption el={el} message={el.message} onDeleteMessage={onDeleteMessage} onReactionChange={onReactionChange} onForwardMessage={onForwardMessage} onEditClick={undefined} />}
                <Box
                    p={1.5}
                    sx={{
                        backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
                        width: "max-content",
                        maxWidth: "70%",
                    }}
                    borderRadius={1.5}
                >
                    <Stack spacing={2}>
                        <Stack
                            p={2}
                            spacing={3}
                            alignItems={"center"}
                            sx={{
                                backgroundColor: theme.palette.background.paper,
                                borderRadius: 1,
                            }}
                        >
                            <img
                                src={el.preview || "/placeholder.svg"}
                                alt={el.message}
                                style={{ maxHeight: 210, borderRadius: 1 }}
                            />
                        </Stack>
                    </Stack>
                </Box>
                {!el.incoming && <MessageOption el={el} message={el.message} onDeleteMessage={onDeleteMessage} onReactionChange={onReactionChange} onForwardMessage={onForwardMessage} onEditClick={undefined} />}
            </Stack>
        </Stack>
    )
}

export const MediaMsg = ({ el, onDeleteMessage, onReactionChange, onForwardMessage }) => {
    const theme = useTheme()
    return (
        <Stack direction={"row"} justifyContent={el.incoming ? "start" : "end"}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                {el.incoming && <MessageOption el={el} message={el.message} onDeleteMessage={onDeleteMessage} onReactionChange={onReactionChange} onForwardMessage={onForwardMessage} onEditClick={undefined} />}
                <Box
                    p={1.5}
                    sx={{
                        backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
                        width: "max-content",
                        maxWidth: "70%",
                    }}
                >
                    <Stack>
                        <img src={el.img || "/placeholder.svg"} alt={el.message} style={{ maxWidth: 210, borderRadius: "10px" }} />
                        <Typography variant="body2" color={el.incoming ? theme.palette.text.primary : "#fff"}>
                            {el.message}
                        </Typography>
                    </Stack>
                </Box>
                {!el.incoming && <MessageOption el={el} message={el.message} onDeleteMessage={onDeleteMessage} onReactionChange={onReactionChange} onForwardMessage={onForwardMessage} onEditClick={undefined} />}
            </Stack>
        </Stack>
    )
}

export const TextMsg = ({ el, onDeleteMessage, onReactionChange, onForwardMessage }) => {
    const theme = useTheme()
    return (
        <Stack direction={"row"} justifyContent={el.incoming ? "start" : "end"}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                {el.incoming && <MessageOption el={el} message={el.message} onDeleteMessage={onDeleteMessage} onReactionChange={onReactionChange} onForwardMessage={onForwardMessage} onEditClick={undefined} />}
                <Box
                    p={1.5}
                    sx={{
                        backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
                        width: "max-content",
                        maxWidth: "70%",
                    }}
                    borderRadius={1.5}
                >
                    <Typography variant="body2" color={el.incoming ? theme.palette.text.primary : "#fff"}>
                        {el.message}
                    </Typography>
                </Box>
                {!el.incoming && <MessageOption el={el} message={el.message} onDeleteMessage={onDeleteMessage} onReactionChange={onReactionChange} onForwardMessage={onForwardMessage} onEditClick={undefined} />}
            </Stack>
        </Stack>
    )
}
