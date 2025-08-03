#include "WebSocketHandler.h"
#include "PrivateChatManager.h"
#include <boost/asio/strand.hpp>
#include <thread>
#include <mutex>
#include <iostream>
#include <iomanip>
#include <ctime>
#include <sstream>
#include <deque>
#include "json.hpp"

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
        thread_ = std::thread([this]() { ioc_.run(); });
        logInfo("WebSocket Server started successfully");
    }

    void stop() {
        logInfo("Stopping WebSocket Server...");
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

    void removeSession(const std::string& client_id) {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        
        // Update user status to offline if authenticated
        if (client_sessions_.count(client_id)) {
            std::string user_id = client_sessions_[client_id].user_id;
            status_manager_->setStatus(user_id, UserStatusManager::Status::OFFLINE);
            session_manager_->removeSession(client_id);
            client_sessions_.erase(client_id);
            
            logClientAction(client_id, "Session cleaned up", "User: " + user_id + " set to OFFLINE");
        }
        
        // Remove from active sessions
        active_sessions_.erase(client_id);
    }

private:
    struct ClientSession {
        std::string user_id;
        std::string role;
        std::string token;
    };

    class Session; // Forward declaration

    void doAccept() {
        acceptor_.async_accept([this](boost::system::error_code ec, tcp::socket socket) {
            if (!ec) {
                try {
                    std::string client_ip = socket.remote_endpoint().address().to_string();
                    logClientAction(client_ip, "New TCP connection established");
                    
                    auto session = std::make_shared<Session>(std::move(socket), *this);
                    
                    // Store session in active sessions
                    {
                        std::lock_guard<std::mutex> lock(clients_mutex_);
                        active_sessions_[client_ip] = session;
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
        Session(tcp::socket socket, Impl& server)
                : ws_(std::move(socket)), server_(server) {
            try {
                client_ip_ = ws_.next_layer().remote_endpoint().address().to_string();
            } catch (...) {
                client_ip_ = "unknown";
            }
        }

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
                    logClientAction(self->client_ip_, "WebSocket handshake successful");
                    self->read();
                } else {
                    logError("WebSocket handshake failed for client [" + self->client_ip_ + "]: " + ec.message());
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
                    logClientAction(self->client_ip_, "Message received", "Size: " + std::to_string(bytes) + " bytes");
                    self->handleMessage();
                    self->buffer_.clear();
                    self->read(); // Continue reading
                } else {
                    if (ec != websocket::error::closed) {
                        logClientAction(self->client_ip_, "Read error", "Reason: " + ec.message());
                    } else {
                        logClientAction(self->client_ip_, "Connection closed normally");
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
                        logError("Write error for client [" + self->client_ip_ + "]: " + ec.message());
                        self->cleanup();
                    }
                });
        }

        void handleMessage() {
            try {
                std::string msg = beast::buffers_to_string(buffer_.data());
                json jsondata = json::parse(msg);
                json data = jsondata;
                std::string client_id = client_ip_;

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
                        logClientAction(client_id, "Authentication successful", "User: " + server_.getClientUserId(client_id));
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
                logError("Message handling error for client [" + client_ip_ + "]: " + e.what());
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
            server_.removeSession(client_ip_);
        }

        websocket::stream<tcp::socket> ws_;
        beast::flat_buffer buffer_;
        Impl& server_;
        std::string client_ip_;
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
        auto status = status_manager_->getStatus(contact_id);

        contacts_with_status.push_back({
                                               {"email", email},
                                               {"status", static_cast<int>(status)},
                                               {"last_active", status_manager_->getLastActive(contact_id)}
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