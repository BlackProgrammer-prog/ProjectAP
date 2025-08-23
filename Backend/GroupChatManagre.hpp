#pragma once
#include "Message.h"
#include "Database.h"
#include "GroupManager.hpp"
#include <memory>
#include <vector>

class GroupChatManager {
public:
    GroupChatManager(std::shared_ptr<Database> db,
                     std::shared_ptr<GroupManager> gm);

    bool sendGroupMessage(const std::string& group_id, const Message& message);
    std::vector<Message> getGroupMessages(const std::string& group_id, int limit = 100);
    bool deleteGroupMessage(const std::string& message_id, const std::string& requester_id);
    bool editGroupMessage(const std::string& message_id,
                          const std::string& new_content,
                          const std::string& requester_id);
    Message getGroupMessageById(const std::string& message_id);

    bool pinGroupMessage(const std::string& message_id, const std::string& requester_id, bool pin = true);

    std::vector<Message> getPinnedMessages(const std::string& group_id);

private:
    std::shared_ptr<Database> db_;
    std::shared_ptr<GroupManager> group_manager_;

    void logAction(const std::string& message_id,
                   const std::string& group_id,
                   const std::string& user_id,
                   const std::string& action);
};

