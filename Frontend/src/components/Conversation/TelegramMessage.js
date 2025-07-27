import { Stack, Box, Typography, Avatar, useTheme } from "@mui/material";
import { format } from "date-fns";
import { MessageOption } from "./MsgType";
import { faker } from "@faker-js/faker";
import { useParams } from "react-router-dom";
import { ChatList } from "../../data";

const TelegramMessage = ({ message, onDeleteMessage, currentUser = "me" }) => {
    const theme = useTheme();
    const { username } = useParams();
    const isOwnMessage = message.sender === currentUser || message.outgoing;

    // پیدا کردن اطلاعات کاربر مقابل از ChatList
    const otherUser = ChatList.find((c) => c.username === username);

    // تعیین آواتار بر اساس فرستنده
    const getAvatar = () => {
        if (isOwnMessage) {
            return faker.image.avatar(); // آواتار کاربر فعلی
        } else {
            return otherUser ? otherUser.img : faker.image.avatar(); // آواتار کاربر مقابل
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
                <Box
                    sx={{
                        maxWidth: "70%",
                        backgroundColor: isOwnMessage
                            ? theme.palette.primary.main
                            : theme.palette.mode === "light"
                                ? "#f0f0f0"
                                : theme.palette.grey[800],
                        borderRadius: isOwnMessage
                            ? "18px 18px 4px 18px"
                            : "18px 18px 18px 4px",
                        padding: "8px 12px",
                        position: "relative",
                        wordBreak: "break-word",
                    }}
                >
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