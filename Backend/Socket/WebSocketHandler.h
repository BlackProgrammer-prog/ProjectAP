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
    void setUserOnlineStatus(const std::string& user_id, bool online);
    void forceAllOfflineTick();

private:
    struct Impl;
    std::unique_ptr<Impl> impl_;

    // Handlers
    json handleSendMessage(const json& data, const std::string& client_id);
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

    // Dependencies
    std::shared_ptr<JwtAuth> jwt_auth_;
    std::shared_ptr<ContactManager> contact_manager_;
    std::shared_ptr<UserStatusManager> status_manager_;
    std::shared_ptr<SessionManager> session_manager_;
    std::shared_ptr<PrivateChatManager> chat_manager_;
    std::shared_ptr<ProfileManager> profile_manager_;
};
