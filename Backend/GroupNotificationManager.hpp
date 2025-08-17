#pragma once

#include <memory>
#include <string>
#include "WebSocketServer.hpp"
#include "SessionManager.hpp"
#include "GroupChatManager.hpp"
#include "Message.hpp"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class GroupNotificationManager {
public:
    GroupNotificationManager(std::shared_ptr<WebSocketServer> ws,
                             std::shared_ptr<SessionManager> sm,
                             std::shared_ptr<GroupChatManager> gcm);

    void notifyGroupNewMessage(const std::string& group_id, const Message& message);
    void notifyGroupMessageDeleted(const std::string& group_id, const std::string& message_id);
    void notifyGroupMessageEdited(const std::string& group_id,
                                  const std::string& message_id,
                                  const std::string& new_content);
    void notifyGroupMemberAdded(const std::string& group_id, const std::string& user_id);
    void notifyGroupMemberRemoved(const std::string& group_id, const std::string& user_id);

private:
    std::shared_ptr<WebSocketServer> ws_server_;
    std::shared_ptr<SessionManager> session_manager_;
    std::shared_ptr<GroupChatManager> group_chat_manager_;
};
