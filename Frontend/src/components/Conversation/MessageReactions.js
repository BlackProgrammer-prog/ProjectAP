import { Box, Stack, Typography, IconButton, Popover, useTheme } from "@mui/material";
import { useState } from "react";

// ایموجی‌های پیش‌فرض برای ری‌اکشن
const REACTION_EMOJIS = [
    { emoji: "❤️", name: "heart" },
    { emoji: "😆", name: "laugh" },
    { emoji: "😮", name: "wow" },
    { emoji: "👍", name: "thumbsUp" },
    { emoji: "👎", name: "thumbsDown" },
];

const MessageReactions = ({ message, onReactionChange }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const [showReactions, setShowReactions] = useState(false);

    // دریافت ری‌اکشن‌های پیام
    const reactions = message.reactions || {};

    // محاسبه تعداد کل ری‌اکشن‌ها
    const totalReactions = Object.values(reactions).reduce((sum, users) => sum + users.length, 0);

    // بررسی اینکه آیا کاربر فعلی روی این پیام ری‌اکشن گذاشته یا نه
    const currentUserReaction = Object.entries(reactions).find(([emoji, users]) =>
        users.includes("me")
    );

    const handleReactionClick = (event) => {
        setAnchorEl(event.currentTarget);
        setShowReactions(true);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setShowReactions(false);
    };

    const handleEmojiClick = (emojiName) => {
        if (onReactionChange) {
            onReactionChange(message.id, emojiName);
        }
        handleClose();
    };

    // اگر هیچ ری‌اکشنی وجود ندارد، چیزی نمایش نده
    if (totalReactions === 0) {
        return null;
    }

    return (
        <>
            {/* نمایش ری‌اکشن‌های موجود */}
            <Box
                
                sx={{
                    position: "absolute",
                    top: "59px",
                    left: "30%",
                    transform: "translateX(-50%)",
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: "12px",
                    padding: "2px 8px",
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    zIndex: 1,
                    cursor: "pointer",
                    "&:hover": {
                        backgroundColor: theme.palette.action.hover,
                    },
                }}
                onClick={handleReactionClick}
            >
                <Stack direction="row" spacing={0.5} alignItems="center">
                    {Object.entries(reactions).slice(0, 3).map(([emojiName, users]) => {
                        const emoji = REACTION_EMOJIS.find(e => e.name === emojiName)?.emoji;
                        return (
                            <Typography
                                key={emojiName}
                                sx={{
                                    fontSize: "0.875rem",
                                    opacity: users.includes("me") ? 1 : 0.8,
                                }}
                            >
                                {emoji}
                            </Typography>
                        );
                    })}
                    {Object.keys(reactions).length > 3 && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: theme.palette.text.secondary,
                                fontSize: "0.75rem",
                            }}
                        >
                            +{Object.keys(reactions).length - 3}
                        </Typography>
                    )}
                </Stack>
            </Box>

            {/* پاپ‌آپ انتخاب ری‌اکشن */}
            <Popover
                open={showReactions}
                anchorEl={anchorEl}
                onClose={handleClose}
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
                    },
                }}
            >
                <Stack direction="row" spacing={1}>
                    {REACTION_EMOJIS.map(({ emoji, name }) => {
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
            </Popover>
        </>
    );
};

export default MessageReactions; 