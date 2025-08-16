#pragma once
#include <boost/asio.hpp>
#include <boost/beast.hpp>
#include <boost/beast/websocket.hpp>
#include <memory>
#include <string>
#include <functional>
#include <json.hpp>
#include "JwtAuth.h"
#include "SessionManager.h"
#include "ContactManager.h"
#include "UserStatusManager.h"
#include "PrivateChatManager.h"
#include "ProfileManager.h"
// Forward declarations for group types to avoid heavy includes in header
class GroupManager;
class GroupChatManager;

using json = nlohmann::json;

class WebSocketServer {
public:
    WebSocketServer(int port,
                    const std::string& jwt_secret,
                    std::shared_ptr<ContactManager> contact_manager,
                    std::shared_ptr<UserStatusManager> status_manager,
                    std::shared_ptr<SessionManager> session_manager);
    ~WebSocketServer();

    void start();
    void stop();

    void on(const std::string& message_type,
            std::function<json(const json&, const std::string&)> handler);

    void sendToClient(const std::string& client_id, const json& message);
    std::string getClientUserId(const std::string& client_id);
    std::string getClientRole(const std::string& client_id);

    void setupHandlers();
    void setChatManager(std::shared_ptr<PrivateChatManager> chat_manager);
    void setProfileManager(std::shared_ptr<ProfileManager> profile_manager);
    void setGroupManagers(std::shared_ptr<GroupManager> gm,
                          std::shared_ptr<GroupChatManager> gcm) {
        group_manager_ = std::move(gm);
        group_chat_manager_ = std::move(gcm);
    }
    void setUserOnlineStatus(const std::string& user_id, bool online);
    void forceAllOfflineTick();

private:
    struct Impl;
    std::unique_ptr<Impl> impl_;

    // Handlers
    json handleSendMessage(const json& data, const std::string& client_id);
    json handleGetMessages(const json& data, const std::string& client_id);
    json handleExportMessages(const json& data, const std::string& client_id);
    json handleAddContact(const json& data, const std::string& client_id);
    json handleRemoveContact(const json& data, const std::string& client_id);
    json handleGetContacts(const json& data, const std::string& client_id);
    json handleStatusUpdate(const json& data, const std::string& client_id);
    json handleMarkAsRead(const json& data, const std::string& client_id);
    json handleEditMessage(const json& data, const std::string& client_id);
    json handleDeleteMessage(const json& data, const std::string& client_id);
    json handleSearchMessages(const json& data, const std::string& client_id);
    json handleSearchUser(const json& data, const std::string& client_id);
    json handleHeartbeat(const json& data, const std::string& client_id);
    json handleLogout(const json& data, const std::string& client_id);

    // New handlers
    json handleCheckOnlineByEmails(const json& data, const std::string& client_id);
    json handleDeleteAccount(const json& data, const std::string& client_id);
    json handleBlockUser(const json& data, const std::string& client_id);
    json handleGetUnreadCount(const json& data, const std::string& client_id);
    json handleGetOpenChats(const json& data, const std::string& client_id);
    json handleUpdateOpenChats(const json& data, const std::string& client_id);

    // Group chat handlers
    json handleCreateGroup(const json& data, const std::string& client_id);
    json handleInviteToGroup(const json& data, const std::string& client_id);
    json handleJoinGroup(const json& data, const std::string& client_id);
    json handleLeaveGroup(const json& data, const std::string& client_id);
    json handleSendGroupMessage(const json& data, const std::string& client_id);
    json handleGetGroupMessages(const json& data, const std::string& client_id);
    json handleSearchGroupMessages(const json& data, const std::string& client_id);
    json handleGetGroupInfo(const json& data, const std::string& client_id);
    json handleGetUserGroupsByEmail(const json& data, const std::string& client_id);

    // Dependencies
    std::shared_ptr<JwtAuth> jwt_auth_;
    std::shared_ptr<ContactManager> contact_manager_;
    std::shared_ptr<UserStatusManager> status_manager_;
    std::shared_ptr<SessionManager> session_manager_;
    std::shared_ptr<PrivateChatManager> chat_manager_;
    std::shared_ptr<ProfileManager> profile_manager_;
    std::shared_ptr<GroupManager> group_manager_;
    std::shared_ptr<GroupChatManager> group_chat_manager_;
};
