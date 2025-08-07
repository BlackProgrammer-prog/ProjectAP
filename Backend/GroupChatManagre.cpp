#include "GroupChatManager.hpp"
#include <ctime>

GroupChatManager::GroupChatManager(std::shared_ptr<Database> db,
                                 std::shared_ptr<GroupManager> gm)
    : db_(db), group_manager_(gm) {}

bool GroupChatManager::sendGroupMessage(const Message& message) {
    
    if (!group_manager_->isMember(message.group_id, message.sender_id)) {
        return false;
    }
    
    std::string sql = R"(
        INSERT INTO group_messages 
        (id, group_id, sender_id, content, timestamp, edited_timestamp, deleted)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    )";
    
    return db_->executeQueryWithParams(sql, {
        message.id,
        message.group_id,
        message.sender_id,
        message.content,
        std::to_string(message.timestamp),
        std::to_string(message.edited_timestamp),
        message.deleted ? "1" : "0"
    }).success;
}

std::vector<Message> GroupChatManager::getGroupMessages(const std::string& group_id, int limit) {
    std::vector<Message> messages;
    std::string sql = R"(
        SELECT id, group_id, sender_id, content, timestamp, 
               edited_timestamp, deleted
        FROM group_messages
        WHERE group_id = ? AND deleted = 0
        ORDER BY timestamp DESC
        LIMIT ?
    )";
    
    auto result = db_->executeQueryWithParams(sql, {group_id, std::to_string(limit)});
    
    
    for (size_t i = 0; i < result.data.size(); i += 7) {
        Message msg;
        msg.id = result.data[i];
        msg.group_id = result.data[i+1];
        msg.sender_id = result.data[i+2];
        msg.content = result.data[i+3];
        msg.timestamp = std::stol(result.data[i+4]);
        msg.edited_timestamp = std::stol(result.data[i+5]);
        msg.deleted = (result.data[i+6] == "1");
        msg.type = MessageType::GROUP;
        
        messages.push_back(msg);
    }
    
    return messages;
}

bool GroupChatManager::deleteGroupMessage(const std::string& message_id, const std::string& requester_id) {
    Message msg = getGroupMessageById(message_id);
    if (msg.id.empty()) return false;

  
    if (msg.sender_id != requester_id && 
        group_manager_->getGroup(msg.group_id).creator_id != requester_id) {
        return false;
    }
    
    std::string sql = "UPDATE group_messages SET deleted = 1 WHERE id = ?";
    return db_->executeQueryWithParams(sql, {message_id}).success;
}

bool GroupChatManager::editGroupMessage(const std::string& message_id, 
                                      const std::string& new_content,
                                      const std::string& requester_id) {
    Message msg = getGroupMessageById(message_id);
    if (msg.id.empty()) return false;
    

    if (msg.sender_id != requester_id) {
        return false;
    }
    
    std::string sql = R"(
        UPDATE group_messages 
        SET content = ?, edited_timestamp = ?
        WHERE id = ?
    )";
    
    return db_->executeQueryWithParams(sql, {
        new_content,
        std::to_string(std::time(nullptr)),
        message_id
    }).success;
}

Message GroupChatManager::getGroupMessageById(const std::string& message_id) {
    std::string sql = "SELECT * FROM group_messages WHERE id = ?";
    auto result = db_->executeQueryWithParams(sql, {message_id});
    
    if (result.data.size() >= 7) {
        Message msg;
        msg.id = result.data[0];
        msg.group_id = result.data[1];
        msg.sender_id = result.data[2];
        msg.content = result.data[3];
        msg.timestamp = std::stol(result.data[4]);
        msg.edited_timestamp = std::stol(result.data[5]);
        msg.deleted = (result.data[6] == "1");
        msg.type = MessageType::GROUP;
        
        return msg;
    }
    return Message();
}
