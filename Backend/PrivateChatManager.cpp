#include "PrivateChatManager.h"
#include <boost/algorithm/string.hpp>
using namespace std;
PrivateChatManager::PrivateChatManager(std::shared_ptr<Database> db)
        : database(db) {}

bool PrivateChatManager::sendMessage(const Message& message) {
    std::string sql = R"(
        INSERT INTO private_messages 
        (id, sender_id, receiver_id, content, timestamp, edited_timestamp, status, deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    )";

    std::vector<std::string> params = {
            message.id,
            message.sender_id,
            message.receiver_id,
            message.content,
            std::to_string(message.timestamp),
            std::to_string(message.edited_timestamp > 0 ? message.edited_timestamp : message.timestamp),
            std::to_string(static_cast<int>(message.status)),
            // Always store new messages as not deleted
            "0"
    };

    bool success = database->executeQueryWithParams(sql, params).success;
    if (success) {
        message_cache_[message.id] = message;
    }
    return success;
}

std::vector<Message> PrivateChatManager::getMessages(const std::string& user1,
                                                     const std::string& user2,
                                                     int limit) {
    std::vector<Message> messages;
    if (limit <= 0) limit = 1;
    if (limit > 1000) limit = 1000;
    std::string sql = std::string(
            "SELECT id, sender_id, receiver_id, content, "
            "       COALESCE(timestamp, 0), COALESCE(edited_timestamp, 0), "
            "       COALESCE(status, 0), COALESCE(deleted, 0), "
            "       COALESCE(delivered, 0), COALESCE(read, 0)\n"
            "FROM private_messages\n"
            "WHERE ((sender_id = ? AND receiver_id = ?)\n"
            "OR (sender_id = ? AND receiver_id = ?))\n"
            "AND COALESCE(deleted, 0) = 0\n"
            "ORDER BY timestamp DESC\n"
            "LIMIT ") + std::to_string(limit);

    auto result = database->executeQueryWithParams(sql, { user1, user2, user2, user1 });

    for (size_t i = 0; i < result.data.size(); i += 10) {
        Message msg;
        msg.id = result.data[i];
        msg.sender_id = result.data[i+1];
        msg.receiver_id = result.data[i+2];
        msg.content = result.data[i+3];
        try { msg.timestamp = std::stol(result.data[i+4]); } catch(...) { msg.timestamp = 0; }
        try { msg.edited_timestamp = std::stol(result.data[i+5]); } catch(...) { msg.edited_timestamp = msg.timestamp; }
        try { msg.status = static_cast<MessageStatus>(std::stoi(result.data[i+6])); } catch(...) { msg.status = MessageStatus::SENT; }
        msg.deleted = (result.data[i+7] == "1");
        msg.delivered = (result.data[i+8] == "1");
        msg.read = (result.data[i+9] == "1");
        msg.type = MessageType::PRIVATE;
        messages.push_back(msg);
    }

    return messages;
}

bool PrivateChatManager::markAsRead(const std::string& message_id) {
    std::string sql = R"(
        UPDATE private_messages 
        SET read = 1 
        WHERE id = ? AND deleted = 0
    )";

    bool success = database->executeQueryWithParams(sql, {message_id}).success;

    if (success && message_cache_.count(message_id)) {
        // Update cache if message exists there
        message_cache_[message_id].read = true;
    }

    return success;
}

bool PrivateChatManager::markAsDelivered(const std::string& message_id) {
    std::string sql = R"(
        UPDATE private_messages 
        SET delivered = 1 
        WHERE id = ? AND deleted = 0
    )";

    bool success = database->executeQueryWithParams(sql, {message_id}).success;

    if (success && message_cache_.count(message_id)) {
        // Update cache if message exists there
        message_cache_[message_id].delivered = true;
    }

    return success;
}

bool PrivateChatManager::editMessage(const std::string& message_id,
                                     const std::string& new_content) {
    std::string sql = R"(
        UPDATE private_messages 
        SET content = ?, edited_timestamp = ?, status = ?
        WHERE id = ? AND deleted = 0
    )";

    bool success = database->executeQueryWithParams(sql, {
            new_content,
            std::to_string(std::time(nullptr)),
            std::to_string(static_cast<int>(MessageStatus::EDITED)),
            message_id
    }).success;

    if (success && message_cache_.count(message_id)) {
        message_cache_[message_id].content = new_content;
        message_cache_[message_id].edited_timestamp = std::time(nullptr);
        message_cache_[message_id].status = MessageStatus::EDITED;
    }

    return success;
}

bool PrivateChatManager::deleteMessage(const std::string& message_id) {
    std::string sql = R"(
        UPDATE private_messages 
        SET deleted = 1 
        WHERE id = ?
    )";

    bool success = database->executeQueryWithParams(sql, {message_id}).success;

    if (success && message_cache_.count(message_id)) {
        message_cache_[message_id].deleted = true;
    }

    return success;
}

std::vector<Message> PrivateChatManager::searchMessages(
        const std::string& user_id,
        const std::string& query,
        int limit
) {
    std::vector<Message> messages;
    std::string sql = R"(
        SELECT pm.id, pm.sender_id, pm.receiver_id, pm.content, 
               COALESCE(pm.timestamp, 0), COALESCE(pm.edited_timestamp, 0),
               COALESCE(pm.status, 0), COALESCE(pm.deleted, 0),
               COALESCE(pm.delivered, 0), COALESCE(pm.read, 0)
        FROM private_messages pm
        JOIN messages_fts mf ON pm.rowid = mf.rowid
        WHERE (pm.sender_id = ? OR pm.receiver_id = ?)
        AND mf.content MATCH ?
        AND COALESCE(pm.deleted, 0) = 0
        ORDER BY pm.timestamp DESC
        LIMIT ?
    )";

    auto result = database->executeQueryWithParams(sql, {
            user_id, user_id, query, std::to_string(limit)
    });

    for (size_t i = 0; i < result.data.size(); i += 10) {
        Message msg;
        msg.id = result.data[i];
        msg.sender_id = result.data[i+1];
        msg.receiver_id = result.data[i+2];
        msg.content = result.data[i+3];
        try { msg.timestamp = std::stol(result.data[i+4]); } catch(...) { msg.timestamp = 0; }
        try { msg.edited_timestamp = std::stol(result.data[i+5]); } catch(...) { msg.edited_timestamp = msg.timestamp; }
        try { msg.status = static_cast<MessageStatus>(std::stoi(result.data[i+6])); } catch(...) { msg.status = MessageStatus::SENT; }
        msg.deleted = (result.data[i+7] == "1");
        msg.delivered = (result.data[i+8] == "1");
        msg.read = (result.data[i+9] == "1");
        msg.type = MessageType::PRIVATE;
        messages.push_back(msg);
    }

    return messages;
}

Message PrivateChatManager::getMessageById(const std::string& message_id) {
    if (message_cache_.count(message_id)) {
        return message_cache_[message_id];
    }

    std::string sql = R"(
        SELECT id, sender_id, receiver_id, content,
               COALESCE(timestamp, 0), COALESCE(edited_timestamp, 0),
               COALESCE(status, 0), COALESCE(deleted, 0),
               COALESCE(delivered, 0), COALESCE(read, 0)
        FROM private_messages
        WHERE id = ?
    )";

    auto result = database->executeQueryWithParams(sql, {message_id});

    if (result.data.size() >= 10) {
        Message msg;
        msg.id = result.data[0];
        msg.sender_id = result.data[1];
        msg.receiver_id = result.data[2];
        msg.content = result.data[3];
        try { msg.timestamp = std::stol(result.data[4]); } catch(...) { msg.timestamp = 0; }
        try { msg.edited_timestamp = std::stol(result.data[5]); } catch(...) { msg.edited_timestamp = msg.timestamp; }
        try { msg.status = static_cast<MessageStatus>(std::stoi(result.data[6])); } catch(...) { msg.status = MessageStatus::SENT; }
        msg.deleted = (result.data[7] == "1");
        msg.delivered = (result.data[8] == "1");
        msg.read = (result.data[9] == "1");
        msg.type = MessageType::PRIVATE;

        message_cache_[message_id] = msg;
        return msg;
    }

    return Message();
}