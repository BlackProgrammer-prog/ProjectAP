




//.................................................................MAIN


import { Stack } from "@mui/material"
import { format, startOfDay, isSameDay } from "date-fns"
import TelegramMessage from "./TelegramMessage"
import Timeline from "./Timeline"
import { AppBar, Toolbar, Checkbox, Button, Typography } from "@mui/material";
import { useState } from "react";

const Message = ({ messages, onDeleteMessage, onReactionChange, onForwardMessage, onEditMessage }) => {
    // گروه‌بندی پیام‌ها بر اساس تاریخ
    const groupMessagesByDate = (messages) => {
        if (!messages || messages.length === 0) return [];

        const grouped = [];
        let currentDate = null;
        let currentGroup = [];

        messages.forEach((message) => {
            if (message.type === "divider") return;

            const messageDate = message.timestamp
                ? startOfDay(new Date(message.timestamp))
                : startOfDay(new Date());

            if (!currentDate || !isSameDay(currentDate, messageDate)) {
                // ذخیره گروه قبلی
                if (currentGroup.length > 0) {
                    grouped.push({
                        date: currentDate,
                        messages: currentGroup
                    });
                }

                // شروع گروه جدید
                currentDate = messageDate;
                currentGroup = [message];
            } else {
                // اضافه کردن به گروه فعلی
                currentGroup.push(message);
            }
        });

        // اضافه کردن آخرین گروه
        if (currentGroup.length > 0) {
            grouped.push({
                date: currentDate,
                messages: currentGroup
            });
        }

        return grouped;
    };

    // --- Select mode state ---
    const [selectMode, setSelectMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]); // array of message ids

    // Handle click on a message to enter select mode
    const handleMessageClick = (messageId) => {
        if (!selectMode) {
            setSelectMode(true);
            setSelectedMessages([messageId]);
        }
    };
    // Handle checkbox toggle
    const handleToggleSelect = (messageId) => {
        setSelectedMessages((prev) =>
            prev.includes(messageId)
                ? prev.filter((id) => id !== messageId)
                : [...prev, messageId]
        );
    };
    // Select all messages
    const handleSelectAll = () => {
        const allIds = messages.map((msg) => msg.id);
        setSelectedMessages(allIds);
    };
    // Cancel selection
    const handleCancelSelection = () => {
        setSelectMode(false);
        setSelectedMessages([]);
    };
    // If all messages are selected
    const allSelected = selectedMessages.length === messages.length && messages.length > 0;

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <Stack spacing={1}>
            {/* AppBar for select mode */}
            {selectMode && (
                <AppBar position="sticky" color="default" elevation={1} sx={{ mb: 2 }}>
                    <Toolbar>
                        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                            {selectedMessages.length} پیام انتخاب شده
                        </Typography>
                        <Button onClick={handleSelectAll} disabled={allSelected} color="primary">
                            انتخاب همه
                        </Button>
                        <Button onClick={handleCancelSelection} color="inherit">
                            لغو انتخاب
                        </Button>
                    </Toolbar>
                </AppBar>
            )}
            {groupedMessages.map((group, groupIndex) => (
                <Stack key={groupIndex} spacing={1}>
                    {/* Timeline برای تاریخ */}
                    <Timeline date={group.date} />

                    {/* پیام‌های این تاریخ */}
                    {group.messages.map((message, messageIndex) => (
                        <TelegramMessage
                            key={message.id || messageIndex}
                            message={message}
                            onDeleteMessage={onDeleteMessage}
                            onReactionChange={onReactionChange}
                            onForwardMessage={onForwardMessage}
                            onEditMessage={onEditMessage}
                            selectMode={selectMode}
                            selected={selectedMessages.includes(message.id)}
                            onMessageClick={() => handleMessageClick(message.id)}
                            onToggleSelect={() => handleToggleSelect(message.id)}
                        />
                    ))}
                </Stack>
            ))}
        </Stack>
    )
}

export default Message

