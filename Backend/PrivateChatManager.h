#pragma once
#include "Message.h"
#include "Database.h"
#include <memory>
#include <vector>
#include <unordered_map>

class PrivateChatManager {
public:
    explicit PrivateChatManager(std::shared_ptr<Database> db);

    // مدیریت پیام‌ها
    bool sendMessage(const Message& message);
    std::vector<Message> getMessages(const std::string& user1,
                                     const std::string& user2,
                                     int limit = 100);
    bool markAsRead(const std::string& message_id);
    bool markAsDelivered(const std::string& message_id);

    // ویرایش و حذف
    bool editMessage(const std::string& message_id,
                     const std::string& new_content);
    bool deleteMessage(const std::string& message_id);

    // جست‌وجو
    std::vector<Message> searchMessages(const std::string& user_id,
                                        const std::string& query,
                                        int limit = 50);
    Message getMessageById(const std::string& message_id);

private:
    std::shared_ptr<Database> database;
    std::unordered_map<std::string, Message> message_cache_;
};