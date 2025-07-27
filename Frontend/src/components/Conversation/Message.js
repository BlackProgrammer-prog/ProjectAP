




//.................................................................MAIN


import { Stack } from "@mui/material"
import { format, startOfDay, isSameDay } from "date-fns"
import TelegramMessage from "./TelegramMessage"
import Timeline from "./Timeline"

const Message = ({ messages, onDeleteMessage }) => {
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

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <Stack spacing={1}>
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
                        />
                    ))}
                </Stack>
            ))}
        </Stack>
    )
}

export default Message

