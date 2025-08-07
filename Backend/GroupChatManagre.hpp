#pragma once
#include "Message.hpp"
#include "Database.h"
#include "GroupManager.hpp"
#include <memory>
#include <vector>

class GroupChatManager {
public:
    GroupChatManager(std::shared_ptr<Database> db,
                   std::shared_ptr<GroupManager> gm);
    
    bool sendGroupMessage(const Message& message);
    std::vector<Message> getGroupMessages(const std::string& group_id, int limit = 100);
    bool deleteGroupMessage(const std::string& message_id, const std::string& requester_id);
    bool editGroupMessage(const std::string& message_id, 
                         const std::string& new_content,
                         const std::string& requester_id);
    Message getGroupMessageById(const std::string& message_id);

private:
    std::shared_ptr<Database> db_;
    std::shared_ptr<GroupManager> group_manager_;
};
