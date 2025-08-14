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
            std::to_string(message.edited_timestamp),
            std::to_string(static_cast<int>(message.status)),
            message.deleted ? "1" : "0"
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
    std::string sql = R"(
        SELECT id, sender_id, receiver_id, content, timestamp, 
               edited_timestamp, status, deleted, delivered, read
        FROM private_messages
        WHERE ((sender_id = ? AND receiver_id = ?)
        OR (sender_id = ? AND receiver_id = ?))
        AND deleted = 0
        ORDER BY timestamp DESC
        LIMIT ?
    )";

    auto result = database->executeQueryWithParams(sql, {
            user1, user2, user2, user1, std::to_string(limit)
    });

    for (size_t i = 0; i < result.data.size(); i += 10) {
        Message msg;
        msg.id = result.data[i];
        msg.sender_id = result.data[i+1];
        msg.receiver_id = result.data[i+2];
        msg.content = result.data[i+3];
        msg.timestamp = std::stol(result.data[i+4]);
        msg.edited_timestamp = std::stol(result.data[i+5]);
        msg.status = static_cast<MessageStatus>(std::stoi(result.data[i+6]));
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
               pm.timestamp, pm.edited_timestamp, pm.status, pm.deleted,
               pm.delivered, pm.read
        FROM private_messages pm
        JOIN messages_fts mf ON pm.rowid = mf.rowid
        WHERE (pm.sender_id = ? OR pm.receiver_id = ?)
        AND mf.content MATCH ?
        AND pm.deleted = 0
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
        msg.timestamp = std::stol(result.data[i+4]);
        msg.edited_timestamp = std::stol(result.data[i+5]);
        msg.status = static_cast<MessageStatus>(std::stoi(result.data[i+6]));
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
        SELECT id, sender_id, receiver_id, content, timestamp,
               edited_timestamp, status, deleted, delivered, read
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
        msg.timestamp = std::stol(result.data[4]);
        msg.edited_timestamp = std::stol(result.data[5]);
        msg.status = static_cast<MessageStatus>(std::stoi(result.data[6]));
        msg.deleted = (result.data[7] == "1");
        msg.delivered = (result.data[8] == "1");
        msg.read = (result.data[9] == "1");
        msg.type = MessageType::PRIVATE;

        message_cache_[message_id] = msg;
        return msg;
    }

    return Message();
}