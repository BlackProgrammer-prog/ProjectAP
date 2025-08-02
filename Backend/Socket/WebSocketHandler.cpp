#include "WebSocketHandler.h"
#include "PrivateChatManager.h"
#include <boost/asio/strand.hpp>
#include <thread>
#include <mutex>
#include <iostream>
#include "json.hpp"

namespace beast = boost::beast;
namespace websocket = beast::websocket;
using tcp = boost::asio::ip::tcp;

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
              acceptor_(ioc_, tcp::endpoint(tcp::v4(), port_)) {}

    void start() {
        doAccept();
        thread_ = std::thread([this]() { ioc_.run(); });
    }

    void stop() {
        ioc_.stop();
        if (thread_.joinable())
            thread_.join();
    }

    void on(const std::string& message_type,
            std::function<json(const json&, const std::string&)> handler) {
        std::lock_guard<std::mutex> lock(handlers_mutex_);
        handlers_[message_type] = std::move(handler);
    }

    void sendToClient(const std::string& client_id, const json& message) {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        auto it = connections_.find(client_id);
        if (it != connections_.end()) {
            try {
                it->second->text(true);
                it->second->write(boost::asio::buffer(message.dump()));
            } catch (const std::exception& e) {
                std::cerr << "Send error: " << e.what() << std::endl;
            }
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
        }
    }

    void notifyContactStatusChange(const std::string& user_id, int status) {
        json payload = {
                {"type", "contact_status_change"},
                {"user_id", user_id},
                {"status", status}
        };

        auto contacts = contact_manager_->getContacts(user_id);
        for(const auto& email : contacts) {
            std::string contact_id = contact_manager_->findUserByEmail(email);
            auto client_ids = session_manager_->getClientIds(contact_id);
            for(const auto& cid : client_ids) {
                sendToClient(cid, payload);
            }
        }
    }

private:
    struct ClientSession {
        std::string user_id;
        std::string role;
        std::string token;
    };

    void doAccept() {
        acceptor_.async_accept([this](boost::system::error_code ec, tcp::socket socket) {
            if (!ec) {
                std::make_shared<Session>(std::move(socket), *this)->start();
            }
            doAccept();
        });
    }

    class Session : public std::enable_shared_from_this<Session> {
    public:
        Session(tcp::socket socket, Impl& server)
                : ws_(std::move(socket)), server_(server) {}

        void start() {
            ws_.async_accept([self = shared_from_this()](boost::system::error_code ec) {
                if (!ec) self->read();
            });
        }

    private:
        void read() {
            ws_.async_read(buffer_, [self = shared_from_this()](boost::system::error_code ec, std::size_t) {
                if (!ec) self->handleMessage();
            });
        }

        void handleMessage() {
            try {
                std::string msg = beast::buffers_to_string(buffer_.data());
                json jsondata = json::parse(msg);
                json data = jsondata; // 👈 اضافه شده
                std::string client_id = remoteIp();

                server_.updateUserStatus(client_id, 0); // 0 = ONLINE

                if (data["type"] != "login" && data["type"] != "register") {
                    if (!server_.authenticate(client_id, data)) {
                        ws_.write(boost::asio::buffer(json{{"status", "error"}, {"message", "Unauthorized"}}.dump()));
                        return;
                    }
                }

                std::lock_guard<std::mutex> lock(server_.handlers_mutex_);
                auto it = server_.handlers_.find(data["type"]);
                if (it != server_.handlers_.end()) {
                    json response = it->second(data, client_id);
                    ws_.write(boost::asio::buffer(response.dump()));
                } else {
                    ws_.write(boost::asio::buffer(json{{"status", "error"}, {"message", "Unknown message type"}}.dump()));
                }
            } catch (const std::exception& e) {
                ws_.write(boost::asio::buffer(json{
                        {"status", "error"},
                        {"message", std::string("Exception: ") + e.what()}
                }.dump()));
            }
        }

        std::string remoteIp() const {
            return ws_.next_layer().remote_endpoint().address().to_string();
        }

        websocket::stream<tcp::socket> ws_;
        beast::flat_buffer buffer_;
        Impl& server_;
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

    std::unordered_map<std::string, std::shared_ptr<websocket::stream<tcp::socket>>> connections_;
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