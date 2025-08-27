#include "GroupChatManagre.hpp"
#include <ctime>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>

GroupChatManager::GroupChatManager(std::shared_ptr<Database> db,
                                   std::shared_ptr<GroupManager> gm)
        : db_(db), group_manager_(gm) {}

bool GroupChatManager::sendGroupMessage(const std::string& group_id, const Message& message) {
    if (!group_manager_->groupExists(group_id)) return false;
    if (!group_manager_->isMember(group_id, message.sender_id)) return false;

    std::string sql = R"(
        INSERT INTO group_messages
        (id, group_id, sender_id, content, timestamp, edited_timestamp, deleted, pinned)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0)
    )";

    bool success = db_->executeQueryWithParams(sql, {
        message.id,
        group_id,
        message.sender_id,
        message.content,
        std::to_string(message.timestamp),
        std::to_string(message.edited_timestamp)
    }).success;

    if (success) {
        logAction(message.id, group_id, message.sender_id, "send");
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
        Message m;
        m.id = result.data[i];
        // result.data[i+1] is group_id (not stored in Message)
        m.sender_id = result.data[i+2];
        m.content = result.data[i+3];
        try { m.timestamp = std::stol(result.data[i+4]); } catch(...) { m.timestamp = 0; }
        try { m.edited_timestamp = std::stol(result.data[i+5]); } catch(...) { m.edited_timestamp = m.timestamp; }
        m.status = MessageStatus::SENT;
        m.deleted = (result.data[i+6] == "1");
        m.delivered = false;
        m.read = false;
        m.type = MessageType::GROUP;
        messages.push_back(m);
    }

    return messages;
}

bool GroupChatManager::deleteGroupMessage(const std::string& message_id, const std::string& requester_id) {
    Message msg = getGroupMessageById(message_id);
    if (msg.id.empty() || msg.deleted) return false;

    std::string group_id;
    auto gidRes = db_->executeQueryWithParams("SELECT group_id FROM group_messages WHERE id = ?", {message_id});
    if (!gidRes.data.empty()) group_id = gidRes.data[0];
    if (msg.sender_id != requester_id) {
        if (group_id.empty() || group_manager_->getGroup(group_id).creator_id != requester_id) {
            return false;
        }
    }

    std::string sql = "UPDATE group_messages SET deleted = 1 WHERE id = ?";
    bool success = db_->executeQueryWithParams(sql, {message_id}).success;

    if (success) {
        logAction(message_id, group_id, requester_id, "delete");
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
        std::string group_id;
        auto gidRes = db_->executeQueryWithParams("SELECT group_id FROM group_messages WHERE id = ?", {message_id});
        if (!gidRes.data.empty()) group_id = gidRes.data[0];
        logAction(message_id, group_id, requester_id, "edit");
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
        Message m;
        m.id = result.data[0];
        m.sender_id = result.data[2];
        m.content = result.data[3];
        try { m.timestamp = std::stol(result.data[4]); } catch(...) { m.timestamp = 0; }
        try { m.edited_timestamp = std::stol(result.data[5]); } catch(...) { m.edited_timestamp = m.timestamp; }
        m.deleted = (result.data[6] == "1");
        m.delivered = false;
        m.read = false;
        m.type = MessageType::GROUP;
        return m;
    }

    return Message();
}

bool GroupChatManager::pinGroupMessage(const std::string& message_id, const std::string& requester_id, bool pin) {
    Message msg = getGroupMessageById(message_id);
    if (msg.id.empty() || msg.deleted) return false;

    std::string group_id;
    {
        auto res = db_->executeQueryWithParams("SELECT group_id FROM group_messages WHERE id = ?", {message_id});
        if (!res.data.empty()) group_id = res.data[0];
    }
    if (group_id.empty() || group_manager_->getGroup(group_id).creator_id != requester_id) {
        return false;
    }

    std::string sql = "UPDATE group_messages SET pinned = ? WHERE id = ?";
    bool success = db_->executeQueryWithParams(sql, {pin ? "1" : "0", message_id}).success;

    if (success) {
        logAction(message_id, group_id, requester_id, pin ? "pin" : "unpin");
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
        Message m;
        m.id = result.data[i];
        m.sender_id = result.data[i+2];
        m.content = result.data[i+3];
        try { m.timestamp = std::stol(result.data[i+4]); } catch(...) { m.timestamp = 0; }
        try { m.edited_timestamp = std::stol(result.data[i+5]); } catch(...) { m.edited_timestamp = m.timestamp; }
        m.deleted = (result.data[i+6] == "1");
        m.delivered = false;
        m.read = false;
        m.type = MessageType::GROUP;
        pinned_messages.push_back(m);
    }

    return pinned_messages;
}

void GroupChatManager::logAction(const std::string& message_id,
                                 const std::string& group_id,
                                 const std::string& user_id,
                                 const std::string& action) {
    std::string uuid_str = boost::uuids::to_string(boost::uuids::random_generator()());

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
