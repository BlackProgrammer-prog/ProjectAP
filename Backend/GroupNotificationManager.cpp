#include "GroupNotificationManager.hpp"

GroupNotificationManager::GroupNotificationManager(
        std::shared_ptr<WebSocketServer> ws,
        std::shared_ptr<SessionManager> sm,
        std::shared_ptr<GroupChatManager> gcm)
        : ws_server_(ws), session_manager_(sm), group_chat_manager_(gcm) {}

void GroupNotificationManager::notifyGroupNewMessage(const std::string& group_id, const Message& message) {
    json payload = {
            {"type", "group_message"},
            {"group_id", group_id},
            {"message", message.toJson()}
    };

    auto members = group_chat_manager_->getGroup(group_id).members;
    for (const auto& user_id : members) {
        for (const auto& client_id : session_manager_->getClientIds(user_id)) {
            ws_server_->sendToClient(client_id, payload);
        }
    }
}

void GroupNotificationManager::notifyGroupMessageDeleted(const std::string& group_id, const std::string& message_id) {
    json payload = {
            {"type", "group_message_deleted"},
            {"group_id", group_id},
            {"message_id", message_id}
    };

    auto members = group_chat_manager_->getGroup(group_id).members;
    for (const auto& user_id : members) {
        for (const auto& client_id : session_manager_->getClientIds(user_id)) {
            ws_server_->sendToClient(client_id, payload);
        }
    }
}

void GroupNotificationManager::notifyGroupMessageEdited(const std::string& group_id,
                                                        const std::string& message_id,
                                                        const std::string& new_content) {
    json payload = {
            {"type", "group_message_edited"},
            {"group_id", group_id},
            {"message_id", message_id},
            {"new_content", new_content}
    };

    auto members = group_chat_manager_->getGroup(group_id).members;
    for (const auto& user_id : members) {
        for (const auto& client_id : session_manager_->getClientIds(user_id)) {
            ws_server_->sendToClient(client_id, payload);
        }
    }
}

void GroupNotificationManager::notifyGroupMemberAdded(const std::string& group_id, const std::string& user_id) {
    json payload = {
            {"type", "group_member_added"},
            {"group_id", group_id},
            {"user_id", user_id}
    };

    auto members = group_chat_manager_->getGroup(group_id).members;
    for (const auto& member_id : members) {
        for (const auto& client_id : session_manager_->getClientIds(member_id)) {
            ws_server_->sendToClient(client_id, payload);
        }
    }
}

void GroupNotificationManager::notifyGroupMemberRemoved(const std::string& group_id, const std::string& user_id) {
    json payload = {
            {"type", "group_member_removed"},
            {"group_id", group_id},
            {"user_id", user_id}
    };

    auto members = group_chat_manager_->getGroup(group_id).members;
    for (const auto& member_id : members) {
        for (const auto& client_id : session_manager_->getClientIds(member_id)) {
            ws_server_->sendToClient(client_id, payload);
        }
    }


    for (const auto& client_id : session_manager_->getClientIds(user_id)) {
        ws_server_->sendToClient(client_id, payload);
    }
}
