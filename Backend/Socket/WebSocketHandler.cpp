// Ensure required includes are available before handler definitions
#include "WebSocketHandler.h"
#include "GroupManager.hpp"
#include "GroupChatManagre.hpp"
#include <vector>
#include <ctime>
#include <iostream>
#include <deque>
#include <unordered_set>
// Boost UUID for generating connection ids
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
// Group handlers
json WebSocketServer::handleCreateGroup(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("name"))
        return {{"status","error"},{"message","Missing group name"}};
    std::string creator_id = jwt_auth_->getUserId(data["token"]);
    std::vector<std::string> members;
    if (data.contains("members") && data["members"].is_array()) {
        for (const auto& m : data["members"]) {
            if (m.is_string()) {
                std::string email = static_cast<std::string>(m);
                std::string uid = contact_manager_->findUserByEmail(email);
                if (!uid.empty()) members.push_back(uid);
            }
        }
    }
    auto group = group_manager_->createGroup(data["name"], creator_id, members);
    return {{"status","success"},{"group_id", group.id},{"custom_url", group.id}};
}

json WebSocketServer::handleInviteToGroup(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("group_id") || !data.contains("email"))
        return {{"status","error"},{"message","Missing group_id or email"}};
    std::string inviter = jwt_auth_->getUserId(data["token"]);
    std::string gid = data["group_id"];
    if (!group_manager_->isMember(gid, inviter))
        return {{"status","error"},{"message","Not a group member"}};
    std::string uid = contact_manager_->findUserByEmail(data["email"]);
    if (uid.empty()) return {{"status","error"},{"message","User not found"}};
    bool ok = group_manager_->addMember(gid, uid);
    if (ok) {
        // Append invitation (group_id) to user's invitation JSON (as array)
        auto db = contact_manager_->getDatabase();
        auto cur = db->executeQueryWithParams("SELECT invitation FROM users WHERE id = ?", {uid});
        std::string inv = cur.data.empty() ? "[]" : cur.data[0];
        json arr;
        try { arr = json::parse(inv); } catch(...) { arr = json::array(); }
        arr.push_back(gid);
        db->executeQueryWithParams("UPDATE users SET invitation = ? WHERE id = ?", {arr.dump(), uid});
    }
    return ok ? json{{"status","success"}} : json{{"status","error"},{"message","Failed to invite"}};
}

json WebSocketServer::handleJoinGroup(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("group_id"))
        return {{"status","error"},{"message","Missing group_id"}};
    std::string uid = jwt_auth_->getUserId(data["token"]);
    bool ok = group_manager_->addMember(static_cast<std::string>(data["group_id"]), uid);
    return ok ? json{{"status","success"}} : json{{"status","error"},{"message","Failed to join"}};
}

json WebSocketServer::handleLeaveGroup(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("group_id"))
        return {{"status","error"},{"message","Missing group_id"}};
    std::string uid = jwt_auth_->getUserId(data["token"]);
    bool ok = group_manager_->removeMember(static_cast<std::string>(data["group_id"]), uid);
    return ok ? json{{"status","success"}} : json{{"status","error"},{"message","Failed to leave"}};
}

json WebSocketServer::handleSendGroupMessage(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("group_id") || !data.contains("message"))
        return {{"status","error"},{"message","Missing group_id or message"}};
    std::string uid = jwt_auth_->getUserId(data["token"]);
    std::string gid = data["group_id"];
    if (!group_manager_->isMember(gid, uid)) return {{"status","error"},{"message","Not a group member"}};
    Message msg;
    msg.id = Message::generateUUID();
    msg.sender_id = uid;
    msg.receiver_id = "";
    msg.content = data["message"];
    msg.timestamp = std::time(nullptr);
    msg.edited_timestamp = msg.timestamp;
    msg.type = MessageType::GROUP;
    msg.status = MessageStatus::SENT;
    msg.deleted = false;
    msg.delivered = false;
    msg.read = false;
    // Detect command prefixes
    std::string content_str = msg.content;
    bool is_echo = false;
    bool is_all = false;
    if (content_str.rfind("@echo", 0) == 0) {
        is_echo = true;
    } else if (content_str.rfind("@all", 0) == 0) {
        is_all = true;
    }

    bool ok = group_chat_manager_->sendGroupMessage(gid, msg);
    if (!ok) return {{"status","error"},{"message","Failed to send"}};

    // If @echo: send the same message again to the group (duplicate)
    if (is_echo) {
        Message dup = msg;
        dup.id = Message::generateUUID();
        group_chat_manager_->sendGroupMessage(gid, dup);
    }

    // If @all: DM the message to each group member who is in sender's contacts
    if (is_all) {
        // Strip command for DM body if present as '@all ' prefix
        std::string dm_body = content_str;
        if (dm_body.size() > 5 && dm_body.substr(0, 5) == "@all ") {
            dm_body = dm_body.substr(5);
        }
        // Build contact email set
        std::unordered_set<std::string> contact_emails;
        for (const auto& e : contact_manager_->getContacts(uid)) contact_emails.insert(e);
        auto group = group_manager_->getGroup(gid);
        for (const auto& member_id : group.members) {
            if (member_id == uid) continue;
            std::string member_email = contact_manager_->getEmailByUserId(member_id);
            if (member_email.empty()) continue;
            if (contact_emails.find(member_email) == contact_emails.end()) continue; // only if in contacts

            Message dm;
            dm.id = Message::generateUUID();
            dm.sender_id = uid;
            dm.receiver_id = member_id;
            dm.content = dm_body;
            dm.timestamp = std::time(nullptr);
            dm.edited_timestamp = dm.timestamp;
            dm.type = MessageType::PRIVATE;
            dm.status = MessageStatus::SENT;
            dm.deleted = false;
            dm.delivered = false;
            dm.read = false;
            if (chat_manager_ && chat_manager_->sendMessage(dm)) {
                // Reuse existing new_message notification pattern
                json payload = {
                        {"type", "new_message"},
                        {"message", dm.toJson()}
                };
                auto client_ids = session_manager_->getClientIds(member_id);
                for (const auto& cid : client_ids) {
                    sendToClient(cid, payload);
                }
            }
        }
    }

    return {{"status","success"},{"message_id", msg.id}};
}

json WebSocketServer::handleGetGroupMessages(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("group_id"))
        return {{"status","error"},{"message","Missing group_id"}};
    std::string uid = jwt_auth_->getUserId(data["token"]);
    std::string gid = data["group_id"];
    if (!group_manager_->isMember(gid, uid)) return {{"status","error"},{"message","Not a group member"}};
    int limit = 100;
    if (data.contains("limit")) {
        try { limit = data["limit"].get<int>(); } catch(...) {}
        if (limit <= 0) limit = 1; if (limit > 1000) limit = 1000;
    }
    std::string order = data.contains("order") && data["order"].is_string() ? static_cast<std::string>(data["order"]) : "asc";
    auto messages = group_chat_manager_->getGroupMessages(gid, limit);
    if (order != "desc") std::reverse(messages.begin(), messages.end());
    json arr = json::array();
    for (const auto& m : messages) arr.push_back(m.toJson());
    return {{"status","success"},{"messages", arr}};
}

json WebSocketServer::handleSearchGroupMessages(const json& data, const std::string& client_id) {
    // Simple LIKE-based search (no FTS yet)
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("group_id") || !data.contains("query"))
        return {{"status","error"},{"message","Missing group_id or query"}};
    std::string uid = jwt_auth_->getUserId(data["token"]);
    std::string gid = data["group_id"];
    if (!group_manager_->isMember(gid, uid)) return {{"status","error"},{"message","Not a group member"}};
    int limit = 50;
    if (data.contains("limit")) { try { limit = data["limit"].get<int>(); } catch(...) {} }
    std::string sql = R"(
        SELECT id, sender_id, content, timestamp, edited_timestamp, deleted, pinned
        FROM group_messages
        WHERE group_id = ? AND deleted = 0 AND content LIKE ?
        ORDER BY timestamp DESC
        LIMIT ?
    )";
    auto like = std::string("%") + static_cast<std::string>(data["query"]) + "%";
    auto res = contact_manager_->getDatabase()->executeQueryWithParams(sql, {gid, like, std::to_string(limit)});
    json arr = json::array();
    for (size_t i = 0; i + 7 <= res.data.size(); i += 7) {
        json m = {
            {"id", res.data[i]},
            {"sender_id", res.data[i+1]},
            {"content", res.data[i+2]},
            {"timestamp", std::stoll(res.data[i+3])},
            {"edited_timestamp", std::stoll(res.data[i+4])},
            {"deleted", res.data[i+5] == "1"},
            {"pinned", res.data[i+6] == "1"},
            {"type", "GROUP"}
        };
        arr.push_back(m);
    }
    return {{"status","success"},{"results", arr}};
}

json WebSocketServer::handleGetGroupInfo(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("group_id"))
        return {{"status","error"},{"message","Missing group_id"}};
    std::string gid = data["group_id"];
    auto g = group_manager_->getGroup(gid);
    if (g.id.empty()) return {{"status","error"},{"message","Group not found"}};
    json info = {
        {"id", g.id},
        {"name", g.name},
        {"creator_id", g.creator_id},
        {"created_at", g.created_at},
        {"custom_url", g.id}
    };
    // fetch profile_image if exists
    auto res = contact_manager_->getDatabase()->executeQueryWithParams(
        "SELECT profile_image FROM groups WHERE id = ?", {gid}
    );
    if (!res.data.empty()) info["profile_image"] = res.data[0];
    return {{"status","success"},{"group", info}};
}

json WebSocketServer::handleGetUserGroupsByEmail(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("email"))
        return {{"status","error"},{"message","Missing email"}};
    std::string uid = contact_manager_->findUserByEmail(data["email"]);
    if (uid.empty()) return {{"status","error"},{"message","User not found"}};
    auto groups = group_manager_->getUserGroups(uid);
    json ids = json::array();
    for (const auto& g : groups) ids.push_back(g.id);
    return {{"status","success"},{"group_ids", ids}};
}

json WebSocketServer::handleGetGroupMembers(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    if (!data.contains("group_id"))
        return {{"status","error"},{"message","Missing group_id"}};
    std::string gid = data["group_id"];
    auto g = group_manager_->getGroup(gid);
    if (g.id.empty()) return {{"status","error"},{"message","Group not found"}};
    json emails = json::array();
    for (const auto& uid : g.members) {
        emails.push_back(contact_manager_->getEmailByUserId(uid));
    }
    return {{"status","success"},{"members", emails}};
}

json WebSocketServer::handleGetAndClearInvitations(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"]))
        return {{"status","error"},{"message","Invalid token"}};
    std::string uid = jwt_auth_->getUserId(data["token"]);
    auto db = contact_manager_->getDatabase();
    auto cur = db->executeQueryWithParams("SELECT invitation FROM users WHERE id = ?", {uid});
    std::string inv = cur.data.empty() ? "[]" : cur.data[0];
    // Clear after reading
    db->executeQueryWithParams("UPDATE users SET invitation = '[]' WHERE id = ?", {uid});
    json arr;
    try { arr = json::parse(inv); } catch(...) { arr = json::array(); }
    return {{"status","success"},{"invitations", arr}};
}
#include "PrivateChatManager.h"

namespace beast = boost::beast;
namespace websocket = beast::websocket;
using tcp = boost::asio::ip::tcp;

// ====== Helper Functions for Logging ======
std::string getCurrentTime() {
    auto now = std::time(nullptr);
    auto tm = *std::localtime(&now);
    std::ostringstream oss;
    oss << std::put_time(&tm, "%Y-%m-%d %H:%M:%S");
    return oss.str();
}

void logInfo(const std::string& message) {
    std::cout << "[" << getCurrentTime() << "] [INFO] " << message << std::endl;
}

void logWarning(const std::string& message) {
    std::cout << "[" << getCurrentTime() << "] [WARNING] " << message << std::endl;
}

void logError(const std::string& message) {
    std::cout << "[" << getCurrentTime() << "] [ERROR] " << message << std::endl;
}

void logClientAction(const std::string& client_id, const std::string& action, const std::string& details = "") {
    std::string msg = "Client [" + client_id + "] " + action;
    if (!details.empty()) {
        msg += " - " + details;
    }
    logInfo(msg);
}

class WebSocketServer::Impl {
    friend class WebSocketServer;
public:
    Impl(int port,
         const std::string& jwt_secret,
         std::shared_ptr<ContactManager> contact_manager,
         std::shared_ptr<UserStatusManager> status_manager,
         std::shared_ptr<SessionManager> session_manager)
            : port_(port),
              jwt_auth_(JwtAuth::create(jwt_secret)),
              contact_manager_(contact_manager),
              status_manager_(status_manager),
              session_manager_(session_manager),
              acceptor_(ioc_, tcp::endpoint(tcp::v4(), port_)) {
        logInfo("WebSocket Server initialized on port " + std::to_string(port_));
    }

    void start() {
        logInfo("Starting WebSocket Server...");
        doAccept();
        // Start periodic heartbeat timeout checker (every 5 seconds)
        heartbeat_timer_ = std::make_unique<boost::asio::steady_timer>(ioc_);
        scheduleHeartbeatCheck();
        thread_ = std::thread([this]() { ioc_.run(); });
        logInfo("WebSocket Server started successfully");
    }

    void stop() {
        logInfo("Stopping WebSocket Server...");
        if (heartbeat_timer_) {
            heartbeat_timer_->cancel();
        }
        ioc_.stop();
        if (thread_.joinable())
            thread_.join();
        logInfo("WebSocket Server stopped");
    }

    void on(const std::string& message_type,
            std::function<json(const json&, const std::string&)> handler) {
        std::lock_guard<std::mutex> lock(handlers_mutex_);
        handlers_[message_type] = std::move(handler);
        logInfo("Handler registered for message type: " + message_type);
    }

    void sendToClient(const std::string& client_id, const json& message) {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        auto it = active_sessions_.find(client_id);
        if (it != active_sessions_.end() && it->second) {
            try {
                it->second->sendMessage(message);
                logClientAction(client_id, "Message sent", "Type: " + message.value("type", "unknown"));
            } catch (const std::exception& e) {
                logError("Send error to client [" + client_id + "]: " + e.what());
                // Remove invalid session
                active_sessions_.erase(it);
            }
        } else {
            logWarning("Attempted to send message to disconnected client: " + client_id);
        }
    }

    std::string getClientUserId(const std::string& client_id) {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        if (client_sessions_.count(client_id)) {
            return client_sessions_[client_id].user_id;
        }
        return "";
    }

    void updateUserStatus(const std::string& client_id, int status) {
        std::string user_id = getClientUserId(client_id);
        if(!user_id.empty()) {
            status_manager_->setStatus(user_id, static_cast<UserStatusManager::Status>(status));
            notifyContactStatusChange(user_id, status);
            
            std::string status_name = (status == 0) ? "ONLINE" : 
                                    (status == 1) ? "AWAY" : 
                                    (status == 2) ? "BUSY" : "OFFLINE";
            logClientAction(client_id, "Status updated", "User: " + user_id + ", Status: " + status_name);
        }
    }

    void notifyContactStatusChange(const std::string& user_id, int status) {
        json payload = {
                {"type", "contact_status_change"},
                {"user_id", user_id},
                {"status", status}
        };

        auto contacts = contact_manager_->getContacts(user_id);
        int notified_count = 0;
        for(const auto& email : contacts) {
            std::string contact_id = contact_manager_->findUserByEmail(email);
            auto client_ids = session_manager_->getClientIds(contact_id);
            for(const auto& cid : client_ids) {
                sendToClient(cid, payload);
                notified_count++;
            }
        }
        
        if (notified_count > 0) {
            logInfo("Status change notification sent to " + std::to_string(notified_count) + " contacts for user: " + user_id);
        }
    }

    void removeSession(const std::string& client_id, const std::string& user_id) {
        // Remove this specific session and associated mappings first
        active_sessions_.erase(client_id);
        if (session_manager_) {
            session_manager_->removeSession(client_id);
        }
        client_sessions_.erase(client_id);

        // Check if this user has any other active sessions
        bool has_other_sessions = false;
        for (const auto& [cid, sess] : client_sessions_) {
            if (sess.user_id == user_id) {
                if (cid != client_id && active_sessions_.count(cid) > 0) {
                    has_other_sessions = true;
                    break;
                }
            }
        }

        // Only set offline if no other sessions exist for this user
        if (!has_other_sessions) {
            status_manager_->setStatus(user_id, UserStatusManager::Status::OFFLINE);
            if (contact_manager_) {
                contact_manager_->setUserOnlineStatus(user_id, false);
            }
            logClientAction(user_id, "Set offline - no active sessions remaining");
        }
    }

private:
    struct ClientSession {
        std::string user_id;
        std::string role;
        std::string token;
    };

    class Session; // Forward declaration
    // Heartbeat tracking: client_id -> last_heartbeat (steady_clock)
    std::unordered_map<std::string, std::chrono::steady_clock::time_point> last_heartbeat_;
    std::unique_ptr<boost::asio::steady_timer> heartbeat_timer_;
    std::chrono::seconds heartbeat_interval_{3};
    std::chrono::seconds heartbeat_timeout_{15};

    // Update the timer interval to 15 seconds
    void scheduleHeartbeatCheck() {
        if (!heartbeat_timer_) return;
        heartbeat_timer_->expires_after(std::chrono::seconds(15));
        heartbeat_timer_->async_wait([this](const boost::system::error_code& ec){
            if (!ec) {
                checkHeartbeatTimeouts();
                scheduleHeartbeatCheck();
            }
        });
    }

    void checkHeartbeatTimeouts() {
        const auto now = std::chrono::steady_clock::now();
        
        // Aggressively set all users offline every 15 seconds
        if (contact_manager_) {
            contact_manager_->setAllUsersOffline();
        }
        
        // Then re-mark online only those who sent heartbeat in last 15 seconds
        for (const auto& [client_id, tp] : last_heartbeat_) {
            if (now - tp <= std::chrono::seconds(15)) {
                std::string user_id = getClientUserId(client_id);
                if (!user_id.empty()) {
                    status_manager_->setStatus(user_id, UserStatusManager::Status::ONLINE);
                    if (contact_manager_) {
                        contact_manager_->setUserOnlineStatus(user_id, true);
                    }
                }
            }
        }
    }

    void doAccept() {
        acceptor_.async_accept([this](boost::system::error_code ec, tcp::socket socket) {
            if (!ec) {
                try {
                    // Generate a unique id per connection independent of IP/port
                    std::string client_id = to_string(boost::uuids::random_generator()());
                    logClientAction(client_id, "New TCP connection established");

                    auto session = std::make_shared<Session>(std::move(socket), *this, client_id);

                    // Store session in active sessions
                    {
                        std::lock_guard<std::mutex> lock(clients_mutex_);
                        active_sessions_[client_id] = session;
                    }

                    session->start();
                } catch (const std::exception& e) {
                    logError("Error creating session: " + std::string(e.what()));
                }
            } else {
                logError("Accept error: " + ec.message());
            }
            doAccept();
        });
    }

    class Session : public std::enable_shared_from_this<Session> {
    public:
        Session(tcp::socket socket, Impl& server, const std::string& client_id)
            : ws_(std::move(socket))
            , server_(server)
            , client_id_(client_id)
            , user_id_("") {}

        void start() {
            // Set WebSocket options
            ws_.set_option(websocket::stream_base::timeout::suggested(
                beast::role_type::server));
            
            ws_.set_option(websocket::stream_base::decorator(
                [](websocket::response_type& res) {
                    res.set(beast::http::field::server, "WebSocket-Chat-Server");
                }));

            // Accept WebSocket handshake
            ws_.async_accept([self = shared_from_this()](boost::system::error_code ec) {
                if (!ec) {
                    logClientAction(self->client_id_, "WebSocket handshake successful");
                    self->read();
                } else {
                    logError("WebSocket handshake failed for client [" + self->client_id_ + "]: " + ec.message());
                    self->cleanup();
                }
            });
        }

        void sendMessage(const json& message) {
            auto self = shared_from_this();
            boost::asio::post(ws_.get_executor(), [self, message]() {
                bool write_in_progress = !self->write_queue_.empty();
                self->write_queue_.push_back(message.dump());
                if (!write_in_progress) {
                    self->doWrite();
                }
            });
        }

    private:
        void read() {
            ws_.async_read(buffer_, [self = shared_from_this()](boost::system::error_code ec, std::size_t bytes) {
                if (!ec) {
                    logClientAction(self->client_id_, "Message received", "Size: " + std::to_string(bytes) + " bytes");
                    self->handleMessage();
                    self->buffer_.clear();
                    self->read(); // Continue reading
                } else {
                    if (ec != websocket::error::closed) {
                        logClientAction(self->client_id_, "Read error", "Reason: " + ec.message());
                    } else {
                        logClientAction(self->client_id_, "Connection closed normally");
                    }
                    self->cleanup();
                }
            });
        }

        void doWrite() {
            ws_.text(true); // Set text mode
            ws_.async_write(
                boost::asio::buffer(write_queue_.front()),
                [self = shared_from_this()](boost::system::error_code ec, std::size_t) {
                    if (!ec) {
                        self->write_queue_.pop_front();
                        if (!self->write_queue_.empty()) {
                            self->doWrite();
                        }
                    } else {
                        logError("Write error for client [" + self->client_id_ + "]: " + ec.message());
                        self->cleanup();
                    }
                });
        }

        void handleMessage() {
            try {
                std::string msg = beast::buffers_to_string(buffer_.data());
                json jsondata = json::parse(msg);
                json data = jsondata;
                std::string client_id = client_id_;

                // Log the message type and basic info
                std::string message_type = data.value("type", "unknown");
                    logClientAction(client_id, "Processing message", "Type: " + message_type);

                server_.updateUserStatus(client_id, 0); // 0 = ONLINE

                if (data["type"] != "login" && data["type"] != "register") {
                    if (!server_.authenticate(client_id, data)) {
                        logClientAction(client_id, "Authentication failed", "Message type: " + message_type);
                        sendResponse(json{{"status", "error"}, {"message", "Unauthorized"}});
                        return;
                    } else {
                        auto uid = server_.getClientUserId(client_id);
                        logClientAction(client_id, "Authentication successful", "User: " + uid);
                        // Mark user online on any authenticated message
                        try {
                            if (!uid.empty()) {
                                user_id_ = uid;
                                server_.status_manager_->setStatus(uid, UserStatusManager::Status::ONLINE);
                                if (server_.contact_manager_) {
                                    server_.contact_manager_->setUserOnlineStatus(uid, true);
                                }
                                // Seed heartbeat so timeout works even if client hasn't sent heartbeat yet
                                server_.last_heartbeat_[client_id_] = std::chrono::steady_clock::now();
                            }
                        } catch(...) {}
                    }
                }

                std::lock_guard<std::mutex> lock(server_.handlers_mutex_);
                auto it = server_.handlers_.find(data["type"]);
                if (it != server_.handlers_.end()) {
                    json response = it->second(data, client_id);
                    sendResponse(response);
                    
                    std::string status = response.value("status", "unknown");
                    logClientAction(client_id, "Message processed", "Type: " + message_type + ", Status: " + status);
                } else {
                    logClientAction(client_id, "Unknown message type", "Type: " + message_type);
                    sendResponse(json{{"status", "error"}, {"message", "Unknown message type"}});
                }
            } catch (const std::exception& e) {
                logError("Message handling error for client [" + client_id_ + "]: " + e.what());
                sendResponse(json{
                        {"status", "error"},
                        {"message", std::string("Exception: ") + e.what()}
                });
            }
        }

        void sendResponse(const json& response) {
            sendMessage(response);
        }

        void cleanup() {
            if (user_id_.empty()) return; // No user associated
            
            // Remove this session from server's active sessions
            server_.removeSession(client_id_, user_id_);
        }

        websocket::stream<tcp::socket> ws_;
        beast::flat_buffer buffer_;
        Impl& server_;
        std::string client_id_;
        std::string user_id_; // Added for user_id tracking
        std::deque<std::string> write_queue_;
    };

    bool authenticate(const std::string& client_id, const json& data) {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        if (!data.contains("token")) return false;

        std::string token = data["token"];
        if (!jwt_auth_->isValidToken(token)) return false;

        if (!client_sessions_.count(client_id)) {
            ClientSession session;
            session.user_id = jwt_auth_->getUserId(token);
            session.role = jwt_auth_->getUserRole(token);
            session.token = token;
            client_sessions_[client_id] = session;

            // Add to session manager
            session_manager_->addSession(client_id, session.user_id);
            
            logClientAction(client_id, "New session created", "User: " + session.user_id + ", Role: " + session.role);
        }

        return true;
    }

    int port_;
    boost::asio::io_context ioc_;
    tcp::acceptor acceptor_;
    std::thread thread_;

    std::shared_ptr<JwtAuth> jwt_auth_;
    std::shared_ptr<ContactManager> contact_manager_;
    std::shared_ptr<UserStatusManager> status_manager_;
    std::shared_ptr<SessionManager> session_manager_;

    std::unordered_map<std::string, std::function<json(const json&, const std::string&)>> handlers_;
    std::mutex handlers_mutex_;

    // Fixed: Use Session pointers instead of websocket streams
    std::unordered_map<std::string, std::shared_ptr<Session>> active_sessions_;
    std::unordered_map<std::string, ClientSession> client_sessions_;
    std::mutex clients_mutex_;
};

// Public interface implementation
WebSocketServer::WebSocketServer(int port,
                                 const std::string& jwt_secret,
                                 std::shared_ptr<ContactManager> contact_manager,
                                 std::shared_ptr<UserStatusManager> status_manager,
                                 std::shared_ptr<SessionManager> session_manager)
        : impl_(std::make_unique<Impl>(port, jwt_secret, contact_manager, status_manager, session_manager)),
          contact_manager_(contact_manager),
          status_manager_(status_manager),
          session_manager_(session_manager)
{
    jwt_auth_ = JwtAuth::create(jwt_secret);
    // Initialize chat_manager_ - this will be set later via a setter or passed in constructor
    chat_manager_ = nullptr;
    profile_manager_ = nullptr;
    // Initialize group managers lazily in main and provide setters if needed
}

void WebSocketServer::setProfileManager(std::shared_ptr<ProfileManager> profile_manager) {
    profile_manager_ = profile_manager;
}

WebSocketServer::~WebSocketServer() {
    stop();
}

void WebSocketServer::start() {
    setupHandlers();
    impl_->start();
}

void WebSocketServer::stop() {
    impl_->stop();
}

void WebSocketServer::on(const std::string& message_type,
                         std::function<json(const json&, const std::string&)> handler) {
    impl_->on(message_type, handler);
}

void WebSocketServer::sendToClient(const std::string& client_id, const json& message) {
    impl_->sendToClient(client_id, message);
}

std::string WebSocketServer::getClientUserId(const std::string& client_id) {
    return impl_->getClientUserId(client_id);
}

std::string WebSocketServer::getClientRole(const std::string& client_id) {
    std::lock_guard<std::mutex> lock(impl_->clients_mutex_);
    if (impl_->client_sessions_.count(client_id)) {
        return impl_->client_sessions_[client_id].role;
    }
    return "";
}

void WebSocketServer::setChatManager(std::shared_ptr<PrivateChatManager> chat_manager) {
    chat_manager_ = chat_manager;
}

void WebSocketServer::setUserOnlineStatus(const std::string& user_id, bool online) {
    if (!user_id.empty()) {
        status_manager_->setStatus(user_id, online ? UserStatusManager::Status::ONLINE : UserStatusManager::Status::OFFLINE);
        if (contact_manager_) {
            contact_manager_->setUserOnlineStatus(user_id, online);
        }
    }
}

void WebSocketServer::forceAllOfflineTick() {
    impl_->checkHeartbeatTimeouts();
}

// Handler implementations
void WebSocketServer::setupHandlers() {
    impl_->on("send_message", [this](const json& data, const std::string& clientId) {
        return handleSendMessage(data, clientId);
    });

    impl_->on("add_contact", [this](const json& data, const std::string& clientId) {
        return handleAddContact(data, clientId);
    });

    impl_->on("remove_contact", [this](const json& data, const std::string& clientId) {
        return handleRemoveContact(data, clientId);
    });

    impl_->on("get_contacts", [this](const json& data, const std::string& clientId) {
        return handleGetContacts(data, clientId);
    });

    impl_->on("update_status", [this](const json& data, const std::string& clientId) {
        return handleStatusUpdate(data, clientId);
    });

    impl_->on("mark_as_read", [this](const json& data, const std::string& clientId) {
        return handleMarkAsRead(data, clientId);
    });

    impl_->on("edit_message", [this](const json& data, const std::string& clientId) {
        return handleEditMessage(data, clientId);
    });

    impl_->on("delete_message", [this](const json& data, const std::string& clientId) {
        return handleDeleteMessage(data, clientId);
    });

    impl_->on("search_messages", [this](const json& data, const std::string& clientId) {
        return handleSearchMessages(data, clientId);
    });
    
    impl_->on("get_messages", [this](const json& data, const std::string& clientId) {
        return handleGetMessages(data, clientId);
    });

    impl_->on("search_user", [this](const json& data, const std::string& clientId) {
        return handleSearchUser(data, clientId);
    });

    // Heartbeat every 5s from client; we update last_active and keep ONLINE
    impl_->on("heartbeat", [this](const json& data, const std::string& clientId) {
        return handleHeartbeat(data, clientId);
    });

    // Explicit logout from client
    impl_->on("logout", [this](const json& data, const std::string& clientId) {
        return handleLogout(data, clientId);
    });

    // New features
    impl_->on("check_online_by_emails", [this](const json& data, const std::string& clientId) {
        return handleCheckOnlineByEmails(data, clientId);
    });
    impl_->on("delete_account", [this](const json& data, const std::string& clientId) {
        return handleDeleteAccount(data, clientId);
    });
    impl_->on("block_user", [this](const json& data, const std::string& clientId) {
        return handleBlockUser(data, clientId);
    });
    impl_->on("get_unread_count", [this](const json& data, const std::string& clientId) {
        return handleGetUnreadCount(data, clientId);
    });
    impl_->on("get_open_chats", [this](const json& data, const std::string& clientId) {
        return handleGetOpenChats(data, clientId);
    });
    impl_->on("update_open_chats", [this](const json& data, const std::string& clientId) {
        return handleUpdateOpenChats(data, clientId);
    });
    // Group events
    impl_->on("create_group", [this](const json& d, const std::string& c){ return handleCreateGroup(d,c); });
    impl_->on("invite_to_group", [this](const json& d, const std::string& c){ return handleInviteToGroup(d,c); });
    impl_->on("join_group", [this](const json& d, const std::string& c){ return handleJoinGroup(d,c); });
    impl_->on("leave_group", [this](const json& d, const std::string& c){ return handleLeaveGroup(d,c); });
    impl_->on("send_group_message", [this](const json& d, const std::string& c){ return handleSendGroupMessage(d,c); });
    impl_->on("get_group_messages", [this](const json& d, const std::string& c){ return handleGetGroupMessages(d,c); });
    impl_->on("search_group_messages", [this](const json& d, const std::string& c){ return handleSearchGroupMessages(d,c); });
    impl_->on("get_group_info", [this](const json& d, const std::string& c){ return handleGetGroupInfo(d,c); });
    impl_->on("get_user_groups_by_email", [this](const json& d, const std::string& c){ return handleGetUserGroupsByEmail(d,c); });
    impl_->on("get_group_members", [this](const json& d, const std::string& c){ return handleGetGroupMembers(d,c); });
    impl_->on("get_and_clear_invitations", [this](const json& d, const std::string& c){ return handleGetAndClearInvitations(d,c); });
}

json WebSocketServer::handleSearchUser(const json& data, const std::string& client_id) {
    if (!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    if (!data.contains("query")) {
        return {{"status", "error"}, {"message", "Missing search query"}};
    }

    std::string query = data["query"];
    json results = contact_manager_->searchUsers(query);

    if (results.empty()) {
        return {
            {"status", "error"},
            {"code", "NO_RESULTS"},
            {"message", "نتیجه‌ای یافت نشد"}
        };
    }

    return {
        {"status", "success"},
        {"results", results}
    };
}

json WebSocketServer::handleHeartbeat(const json& data, const std::string& client_id) {
    if (!data.contains("token")) {
        return {{"status", "error"}, {"message", "Missing token"}};
    }
    if (!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }
    const std::string user_id = jwt_auth_->getUserId(data["token"]);
    if (user_id.empty()) {
        return {{"status", "error"}, {"message", "User not found"}};
    }
    // Ensure this client_id is mapped to this user (so timeout removal can find it)
    {
        std::lock_guard<std::mutex> lock(impl_->clients_mutex_);
        if (impl_->client_sessions_.count(client_id) == 0) {
            WebSocketServer::Impl::ClientSession sess;
            sess.user_id = user_id;
            sess.role = jwt_auth_->getUserRole(data["token"]);
            sess.token = data["token"];
            impl_->client_sessions_[client_id] = std::move(sess);
            if (session_manager_) {
                session_manager_->addSession(client_id, user_id);
            }
        }
    }
    impl_->last_heartbeat_[client_id] = std::chrono::steady_clock::now();
    status_manager_->updateLastActive(user_id);
    status_manager_->setStatus(user_id, UserStatusManager::Status::ONLINE);
    if (contact_manager_) {
        // Re-mark this user online in DB on each heartbeat
        contact_manager_->setUserOnlineStatus(user_id, true);
    }
    return {{"status", "success"}, {"type", "heartbeat_ack"}, {"timestamp", std::time(nullptr)}};
}

json WebSocketServer::handleLogout(const json& data, const std::string& client_id) {
    if (!data.contains("token")) {
        return {{"status", "error"}, {"message", "Missing token"}};
    }
    if (!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }
    const std::string token = data["token"];
    const std::string user_id = jwt_auth_->getUserId(token);
    if (user_id.empty()) {
        return {{"status", "error"}, {"message", "User not found"}};
    }
    jwt_auth_->invalidateToken(token);
    impl_->removeSession(client_id, user_id);
    impl_->last_heartbeat_.erase(client_id);
    return {{"status", "success"}};
}

json WebSocketServer::handleSendMessage(const json& data, const std::string& client_id) {
    if(!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    std::string sender_id = jwt_auth_->getUserId(data["token"]);
    std::string receiver_email = data["to"];

    // Check if receiver is in contacts
    if(!contact_manager_->isContact(sender_id, receiver_email)) {
        return {{"status", "error"}, {"message", "User not in contacts"}};
    }

    std::string receiver_id = contact_manager_->findUserByEmail(receiver_email);
    if(receiver_id.empty()) {
        return {{"status", "error"}, {"message", "User not found"}};
    }

    Message msg;
    msg.id = Message::generateUUID();
    msg.sender_id = sender_id;
    msg.receiver_id = receiver_id;
    msg.content = data["message"];
    msg.timestamp = std::time(nullptr);
    msg.type = MessageType::PRIVATE;
    msg.status = MessageStatus::SENT;
    // Ensure default flags are set so messages are retrievable
    msg.deleted = false;
    msg.delivered = false;
    msg.read = false;
    msg.edited_timestamp = msg.timestamp;

    if(chat_manager_->sendMessage(msg)) {
        // Notify receiver
        json payload = {
                {"type", "new_message"},
                {"message", msg.toJson()}
        };

        auto client_ids = session_manager_->getClientIds(receiver_id);
        for (const auto& cid : client_ids) {
            sendToClient(cid, payload);
        }

        return {{"status", "success"}, {"message_id", msg.id}};
    }

    return {{"status", "error"}, {"message", "Failed to send message"}};
}

json WebSocketServer::handleGetMessages(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"])) {
        return {{"status","error"},{"message","Invalid token"}};
    }
    if (!data.contains("with")) {
        return {{"status","error"},{"message","Missing 'with' (peer email)"}};
    }
    std::string user_id = jwt_auth_->getUserId(data["token"]);
    std::string peer_email = data["with"];
    int limit = 100;
    try {
        if (data.contains("limit")) {
            if (data["limit"].is_number_integer()) {
                limit = data["limit"].get<int>();
            } else if (data["limit"].is_string()) {
                limit = std::stoi(static_cast<std::string>(data["limit"]));
            }
        }
    } catch(...) {}
    if (limit <= 0) limit = 1;
    if (limit > 1000) limit = 1000;
    
    std::string order = "asc";
    if (data.contains("order") && data["order"].is_string()) {
        order = static_cast<std::string>(data["order"]);
    }
    if (user_id.empty()) {
        return {{"status","error"},{"message","User not found"}};
    }
    if (!chat_manager_) {
        return {{"status","error"},{"message","Chat manager not initialized"}};
    }
    std::string peer_id = contact_manager_ ? contact_manager_->findUserByEmail(peer_email) : "";
    if (peer_id.empty()) {
        return {{"status","error"},{"message","Peer not found"}};
    }
    auto messages = chat_manager_->getMessages(user_id, peer_id, limit);
    // DB returns latest first; convert to ascending if requested (default asc)
    if (order != "desc") {
        std::reverse(messages.begin(), messages.end());
    }
    json arr = json::array();
    for (const auto& m : messages) arr.push_back(m.toJson());
    return {{"status","success"},{"messages", arr}};
}

json WebSocketServer::handleAddContact(const json& data, const std::string& client_id) {
    if(!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    std::string user_id = jwt_auth_->getUserId(data["token"]);
    std::string contact_email = data["email"];

    if(contact_manager_->addContact(user_id, contact_email)) {
        // Notify contact about status
        auto status = status_manager_->getStatus(user_id);
        std::string contact_id = contact_manager_->findUserByEmail(contact_email);
        auto contact_clients = session_manager_->getClientIds(contact_id);

        json payload = {
                {"type", "contact_status_change"},
                {"user_id", user_id},
                {"status", static_cast<int>(status)}
        };

        for(const auto& cid : contact_clients) {
            sendToClient(cid, payload);
        }

        return {{"status", "success"}};
    }

    return {{"status", "error"}, {"message", "Failed to add contact"}};
}

json WebSocketServer::handleRemoveContact(const json& data, const std::string& client_id) {
    if(!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    std::string user_id = jwt_auth_->getUserId(data["token"]);
    std::string contact_email = data["email"];

    if(contact_manager_->removeContact(user_id, contact_email)) {
        return {{"status", "success"}};
    }

    return {{"status", "error"}, {"message", "Failed to remove contact"}};
}

json WebSocketServer::handleGetContacts(const json& data, const std::string& client_id) {
    if(!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    std::string user_id = jwt_auth_->getUserId(data["token"]);
    auto contacts = contact_manager_->getContacts(user_id);

    json contacts_with_status = json::array();
    for(const auto& email : contacts) {
        std::string contact_id = contact_manager_->findUserByEmail(email);
        auto status_enum = status_manager_->getStatus(contact_id);
        int status_value = (status_enum == UserStatusManager::Status::ONLINE) ? 1 : 0; // 1=online, 0=offline
        auto last_active_ts = status_manager_->getLastActive(contact_id);

        contacts_with_status.push_back({
            {"email", email},
            {"status", status_value},
            {"last_active", last_active_ts}
        });
    }

    return {{"status", "success"}, {"contacts", contacts_with_status}};
}

json WebSocketServer::handleStatusUpdate(const json& data, const std::string& client_id) {
    if(!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    std::string user_id = jwt_auth_->getUserId(data["token"]);
    int status_value = data["status"];

    if(status_value >= 0 && status_value <= 3) {
        status_manager_->setStatus(user_id, static_cast<UserStatusManager::Status>(status_value));
        impl_->notifyContactStatusChange(user_id, status_value);
        return {{"status", "success"}};
    }

    return {{"status", "error"}, {"message", "Invalid status value"}};
}

json WebSocketServer::handleMarkAsRead(const json& data, const std::string& client_id) {
    if(!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    if (!data.contains("message_id")) {
        return {{"status", "error"}, {"message", "Missing message_id"}};
    }

    std::string user_id = jwt_auth_->getUserId(data["token"]);
    std::string message_id = data["message_id"];

    if (!chat_manager_) {
        return {{"status", "error"}, {"message", "Chat manager not initialized"}};
    }

    // Get message to verify user is the receiver
    Message msg = chat_manager_->getMessageById(message_id);
    if (msg.id.empty()) {
        return {{"status", "error"}, {"message", "Message not found"}};
    }

    if (msg.receiver_id != user_id) {
        return {{"status", "error"}, {"message", "Not authorized to mark this message as read"}};
    }

    if (chat_manager_->markAsRead(message_id)) {
        // Notify sender about read status
        json payload = {
            {"type", "message_read"},
            {"message_id", message_id},
            {"read_by", user_id}
        };

        auto sender_clients = session_manager_->getClientIds(msg.sender_id);
        for (const auto& cid : sender_clients) {
            sendToClient(cid, payload);
        }

        return {{"status", "success"}};
    }

    return {{"status", "error"}, {"message", "Failed to mark message as read"}};
}

json WebSocketServer::handleEditMessage(const json& data, const std::string& client_id) {
    if(!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    if (!data.contains("message_id") || !data.contains("new_content")) {
        return {{"status", "error"}, {"message", "Missing message_id or new_content"}};
    }

    std::string user_id = jwt_auth_->getUserId(data["token"]);
    std::string message_id = data["message_id"];
    std::string new_content = data["new_content"];

    if (!chat_manager_) {
        return {{"status", "error"}, {"message", "Chat manager not initialized"}};
    }

    // Get message to verify user is the sender
    Message msg = chat_manager_->getMessageById(message_id);
    if (msg.id.empty()) {
        return {{"status", "error"}, {"message", "Message not found"}};
    }

    if (msg.sender_id != user_id) {
        return {{"status", "error"}, {"message", "Not authorized to edit this message"}};
    }

    if (chat_manager_->editMessage(message_id, new_content)) {
        // Notify receiver about message edit
        json payload = {
            {"type", "message_edited"},
            {"message_id", message_id},
            {"new_content", new_content},
            {"edited_by", user_id}
        };

        auto receiver_clients = session_manager_->getClientIds(msg.receiver_id);
        for (const auto& cid : receiver_clients) {
            sendToClient(cid, payload);
        }

        return {{"status", "success"}};
    }

    return {{"status", "error"}, {"message", "Failed to edit message"}};
}

json WebSocketServer::handleDeleteMessage(const json& data, const std::string& client_id) {
    if(!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    if (!data.contains("message_id")) {
        return {{"status", "error"}, {"message", "Missing message_id"}};
    }

    std::string user_id = jwt_auth_->getUserId(data["token"]);
    std::string message_id = data["message_id"];

    if (!chat_manager_) {
        return {{"status", "error"}, {"message", "Chat manager not initialized"}};
    }

    // Get message to verify user is the sender
    Message msg = chat_manager_->getMessageById(message_id);
    if (msg.id.empty()) {
        return {{"status", "error"}, {"message", "Message not found"}};
    }

    if (msg.sender_id != user_id) {
        return {{"status", "error"}, {"message", "Not authorized to delete this message"}};
    }

    if (chat_manager_->deleteMessage(message_id)) {
        // Notify receiver about message deletion
        json payload = {
            {"type", "message_deleted"},
            {"message_id", message_id},
            {"deleted_by", user_id}
        };

        auto receiver_clients = session_manager_->getClientIds(msg.receiver_id);
        for (const auto& cid : receiver_clients) {
            sendToClient(cid, payload);
        }

        return {{"status", "success"}};
    }

    return {{"status", "error"}, {"message", "Failed to delete message"}};
}

json WebSocketServer::handleSearchMessages(const json& data, const std::string& client_id) {
    if(!jwt_auth_->isValidToken(data["token"])) {
        return {{"status", "error"}, {"message", "Invalid token"}};
    }

    if (!data.contains("query")) {
        return {{"status", "error"}, {"message", "Missing search query"}};
    }

    std::string user_id = jwt_auth_->getUserId(data["token"]);
    std::string query = data["query"];
    int limit = data.contains("limit") ? data["limit"].get<int>() : 50;

    if (!chat_manager_) {
        return {{"status", "error"}, {"message", "Chat manager not initialized"}};
    }

    auto messages = chat_manager_->searchMessages(user_id, query, limit);
    
    json results = json::array();
    for (const auto& msg : messages) {
        results.push_back(msg.toJson());
    }

    return {
        {"status", "success"},
        {"messages", results},
        {"count", messages.size()}
    };
}
// Other handlers (mark_as_read, edit_message, etc.) would be implemented similarly

json WebSocketServer::handleCheckOnlineByEmails(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"])) {
        return {{"status","error"},{"message","Invalid token"}};
    }
    if (!data.contains("emails") || !data["emails"].is_array()) {
        return {{"status","error"},{"message","Missing emails array"}};
    }
    json results = json::array();
    for (const auto& e : data["emails"]) {
        std::string email = e.get<std::string>();
        int online = contact_manager_ ? contact_manager_->getOnlineStatusByEmail(email) : 0;
        results.push_back({{"email", email}, {"online", online}});
    }
    return {{"status","success"},{"results",results}};
}

json WebSocketServer::handleDeleteAccount(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"])) {
        return {{"status","error"},{"message","Invalid token"}};
    }
    std::string user_id = jwt_auth_->getUserId(data["token"]);
    if (user_id.empty()) return {{"status","error"},{"message","User not found"}};
    // Delete user and cleanup sessions
    bool ok = contact_manager_ && contact_manager_->deleteUserById(user_id);
    if (ok) {
        impl_->removeSession(client_id, user_id);
        return {{"status","success"}};
    }
    return {{"status","error"},{"message","Failed to delete user"}};
}

json WebSocketServer::handleBlockUser(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"])) {
        return {{"status","error"},{"message","Invalid token"}};
    }
    if (!data.contains("email")) {
        return {{"status","error"},{"message","Missing email"}};
    }
    std::string user_id = jwt_auth_->getUserId(data["token"]);
    std::string target_email = data["email"];
    if (user_id.empty()) return {{"status","error"},{"message","User not found"}};
    bool ok = contact_manager_ && contact_manager_->blockUserByEmail(user_id, target_email);
    return ok ? json{{"status","success"}} : json{{"status","error"},{"message","Failed to block"}};
}

json WebSocketServer::handleGetUnreadCount(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"])) {
        return {{"status","error"},{"message","Invalid token"}};
    }
    std::string user_id = jwt_auth_->getUserId(data["token"]);
    if (user_id.empty()) return {{"status","error"},{"message","User not found"}};
    int count = contact_manager_ ? contact_manager_->getUnreadCountForUser(user_id) : 0;
    return {{"status","success"},{"unread",count}};
}

json WebSocketServer::handleGetOpenChats(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"])) {
        return {{"status","error"},{"message","Invalid token"}};
    }
    std::string user_id = jwt_auth_->getUserId(data["token"]);
    if (user_id.empty()) return {{"status","error"},{"message","User not found"}};
    json open_chats = contact_manager_ ? contact_manager_->getOpenChats(user_id) : json::array();
    return {{"status","success"},{"open_chats", open_chats}};
}

json WebSocketServer::handleUpdateOpenChats(const json& data, const std::string& client_id) {
    if (!data.contains("token") || !jwt_auth_->isValidToken(data["token"])) {
        return {{"status","error"},{"message","Invalid token"}};
    }
    if (!data.contains("open_chats") || !data["open_chats"].is_array()) {
        return {{"status","error"},{"message","Missing open_chats array"}};
    }
    std::string user_id = jwt_auth_->getUserId(data["token"]);
    if (user_id.empty()) return {{"status","error"},{"message","User not found"}};
    json open_chats = data["open_chats"];
    bool ok = contact_manager_ && contact_manager_->setOpenChats(user_id, open_chats);
    if (!ok) {
        return {{"status","error"},{"message","Failed to update open_chats"}};
    }

    // Sync reciprocal open chats: for each email in user's list, ensure the other user also
    // has this user's email in their open_chats_json.
    try {
        if (contact_manager_) {
            // Get this user's email
            std::string my_email = contact_manager_->getEmailByUserId(user_id);
            if (!my_email.empty()) {
                for (const auto& item : open_chats) {
                    if (!item.is_string()) continue;
                    std::string peer_email = static_cast<std::string>(item);
                    // Resolve peer id
                    std::string peer_id = contact_manager_->findUserByEmail(peer_email);
                    if (peer_id.empty()) continue;
                    // Read peer's current open chats
                    json peer_open = contact_manager_->getOpenChats(peer_id);
                    bool exists = false;
                    for (const auto& p : peer_open) {
                        if (p.is_string() && static_cast<std::string>(p) == my_email) { exists = true; break; }
                    }
                    if (!exists) {
                        peer_open.push_back(my_email);
                        contact_manager_->setOpenChats(peer_id, peer_open);
                    }
                }
            }
        }
    } catch(...) { /* best-effort sync, ignore errors */ }

    return {{"status","success"}};
}