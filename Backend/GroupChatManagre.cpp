#include "GroupChatManager.hpp"
#include <ctime>
#include <uuid/uuid.h>

GroupChatManager::GroupChatManager(std::shared_ptr<Database> db,
                                   std::shared_ptr<GroupManager> gm)
        : db_(db), group_manager_(gm) {}

bool GroupChatManager::sendGroupMessage(const Message& message) {
    if (!group_manager_->groupExists(message.group_id)) return false;
    if (!group_manager_->isMember(message.group_id, message.sender_id)) return false;

    std::string sql = R"(
        INSERT INTO group_messages
        (id, group_id, sender_id, content, timestamp, edited_timestamp, deleted, pinned)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0)
    )";

    bool success = db_->executeQueryWithParams(sql, {
        message.id,
        message.group_id,
        message.sender_id,
        message.content,
        std::to_string(message.timestamp),
        std::to_string(message.edited_timestamp)
    }).success;

    if (success) {
        logAction(message.id, message.group_id, message.sender_id, "send");
    }

    return success;
}

std::vector<Message> GroupChatManager::getGroupMessages(const std::string& group_id, int limit) {
    std::vector<Message> messages;
    if (!group_manager_->groupExists(group_id)) return messages;

    std::string sql = R"(
        SELECT id, group_id, sender_id, content, timestamp,
               edited_timestamp, deleted, pinned
        FROM group_messages
        WHERE group_id = ? AND deleted = 0
        ORDER BY timestamp DESC
        LIMIT ?
    )";

    auto result = db_->executeQueryWithParams(sql, {group_id, std::to_string(limit)});

    for (size_t i = 0; i + 8 <= result.data.size(); i += 8) {
        messages.emplace_back(Message{
            result.data[i],
            result.data[i+1],
            result.data[i+2],
            result.data[i+3],
            std::stol(result.data[i+4]),
            std::stol(result.data[i+5]),
            result.data[i+6] == "1",
            result.data[i+7] == "1",
            MessageType::GROUP
        });
    }

    return messages;
}

bool GroupChatManager::deleteGroupMessage(const std::string& message_id, const std::string& requester_id) {
    Message msg = getGroupMessageById(message_id);
    if (msg.id.empty() || msg.deleted) return false;

    if (msg.sender_id != requester_id &&
        group_manager_->getGroup(msg.group_id).creator_id != requester_id) {
        return false;
    }

    std::string sql = "UPDATE group_messages SET deleted = 1 WHERE id = ?";
    bool success = db_->executeQueryWithParams(sql, {message_id}).success;

    if (success) {
        logAction(message_id, msg.group_id, requester_id, "delete");
    }

    return success;
}

bool GroupChatManager::editGroupMessage(const std::string& message_id,
                                        const std::string& new_content,
                                        const std::string& requester_id) {
    Message msg = getGroupMessageById(message_id);
    if (msg.id.empty() || msg.deleted) return false;

    if (msg.sender_id != requester_id) return false;

    std::string sql = R"(
        UPDATE group_messages
        SET content = ?, edited_timestamp = ?
        WHERE id = ?
    )";

    bool success = db_->executeQueryWithParams(sql, {
        new_content,
        std::to_string(std::time(nullptr)),
        message_id
    }).success;

    if (success) {
        logAction(message_id, msg.group_id, requester_id, "edit");
    }

    return success;
}

Message GroupChatManager::getGroupMessageById(const std::string& message_id) {
    std::string sql = R"(
        SELECT id, group_id, sender_id, content, timestamp,
               edited_timestamp, deleted, pinned
        FROM group_messages WHERE id = ?
    )";

    auto result = db_->executeQueryWithParams(sql, {message_id});

    if (result.data.size() >= 8) {
        return Message{
            result.data[0],
            result.data[1],
            result.data[2],
            result.data[3],
            std::stol(result.data[4]),
            std::stol(result.data[5]),
            result.data[6] == "1",
            result.data[7] == "1",
            MessageType::GROUP
        };
    }

    return Message();
}

bool GroupChatManager::pinGroupMessage(const std::string& message_id, const std::string& requester_id, bool pin) {
    Message msg = getGroupMessageById(message_id);
    if (msg.id.empty() || msg.deleted) return false;

    if (group_manager_->getGroup(msg.group_id).creator_id != requester_id) {
        return false;
    }

    std::string sql = "UPDATE group_messages SET pinned = ? WHERE id = ?";
    bool success = db_->executeQueryWithParams(sql, {pin ? "1" : "0", message_id}).success;

    if (success) {
        logAction(message_id, msg.group_id, requester_id, pin ? "pin" : "unpin");
    }

    return success;
}

std::vector<Message> GroupChatManager::getPinnedMessages(const std::string& group_id) {
    std::vector<Message> pinned_messages;
    if (!group_manager_->groupExists(group_id)) return pinned_messages;

    std::string sql = R"(
        SELECT id, group_id, sender_id, content, timestamp, 
               edited_timestamp, deleted, pinned
        FROM group_messages
        WHERE group_id = ? AND pinned = 1 AND deleted = 0
        ORDER BY timestamp DESC
    )";

    auto result = db_->executeQueryWithParams(sql, {group_id});

    for (size_t i = 0; i + 8 <= result.data.size(); i += 8) {
        pinned_messages.emplace_back(Message{
            result.data[i],
            result.data[i+1],
            result.data[i+2],
            result.data[i+3],
            std::stol(result.data[i+4]),
            std::stol(result.data[i+5]),
            result.data[i+6] == "1",
            result.data[i+7] == "1",
            MessageType::GROUP
        });
    }

    return pinned_messages;
}

void GroupChatManager::logAction(const std::string& message_id,
                                 const std::string& group_id,
                                 const std::string& user_id,
                                 const std::string& action) {
    uuid_t uuid;
    uuid_generate(uuid);
    char uuid_str[37];
    uuid_unparse(uuid, uuid_str);

    std::string sql = R"(
        INSERT INTO group_message_logs
        (id, message_id, group_id, user_id, action, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    )";

    db_->executeQueryWithParams(sql, {
        uuid_str,
        message_id,
        group_id,
        user_id,
        action,
        std::to_string(std::time(nullptr))
    });
}
