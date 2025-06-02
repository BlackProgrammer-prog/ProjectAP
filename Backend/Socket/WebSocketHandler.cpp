//
// Created by afraa on 6/1/2025.
//

#include "WebSocketHandler.h"
#include "server_ws.hpp"
#include <thread>
#include <mutex>
#include <unordered_map>

using WsServer = SimpleWeb::SocketServer<SimpleWeb::WS>;

class WebSocketServer::Impl {
public:
    Impl(int port, const std::string& jwt_secret)
            : port_(port),
              server_(std::make_shared<WsServer>()),
              jwt_auth_(SimpleJwtAuth::create(jwt_secret)) {

        server_->config.port = port_;
        setupEndpoints();
    }

    void start() {
        if (running_) return;
        running_ = true;
        server_thread_ = std::thread([this]() {
            server_->start();
        });
    }

    void stop() {
        if (!running_) return;
        server_->stop();
        if (server_thread_.joinable()) {
            server_thread_.join();
        }
        running_ = false;
    }

    void on(const std::string& message_type,
            std::function<json(const json&, const std::string&)> handler) {
        std::lock_guard<std::mutex> lock(handlers_mutex_);
        handlers_[message_type] = handler;
    }

    void sendToClient(const std::string& client_id, const json& message) {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        if (connections_.count(client_id)) {
            auto connection = connections_[client_id].lock();
            if (connection) {
                connection->send(message.dump());
            } else {
                connections_.erase(client_id);
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

    std::string getClientRole(const std::string& client_id) {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        if (client_sessions_.count(client_id)) {
            return client_sessions_[client_id].role;
        }
        return "";
    }

private:
    struct ClientSession {
        std::string user_id;
        std::string role;
        std::string token;
    };

    void setupEndpoints() {
        auto& endpoint = server_->endpoint["^/?$"];

        endpoint.on_message = [this](auto connection, auto message) {
            handleMessage(connection, message);
        };

        endpoint.on_open = [this](auto connection) {
            handleConnectionOpen(connection);
        };

        endpoint.on_close = [this](auto connection, int status, const std::string& reason) {
            handleConnectionClose(connection, status, reason);
        };
    }

    void handleMessage(std::shared_ptr<WsServer::Connection> connection,
                       std::shared_ptr<WsServer::Message> message) {
        try {
            json data = json::parse(message->string());
            std::string client_id = connection->remote_endpoint_address();

            // احراز هویت برای پیام‌های غیر از login و register
            if (data["type"] != "login" && data["type"] != "register") {
                if (!authenticateClient(client_id, data)) {
                    connection->send(json{{"status", "error"}, {"message", "Unauthorized"}}.dump());
                    return;
                }
            }

            std::lock_guard<std::mutex> lock(handlers_mutex_);
            if (handlers_.count(data["type"])) {
                json response = handlers_[data["type"]](data, client_id);
                connection->send(response.dump());
            } else {
                connection->send(json{{"status", "error"}, {"message", "Unknown message type"}}.dump());
            }
        } catch (const std::exception& e) {
            connection->send(json{{"status", "error"}, {"message", e.what()}}.dump());
        }
    }

    void handleConnectionOpen(std::shared_ptr<WsServer::Connection> connection) {
        std::string client_id = connection->remote_endpoint_address();
        std::lock_guard<std::mutex> lock(clients_mutex_);connections_[client_id] = connection;
    }

    void handleConnectionClose(std::shared_ptr<WsServer::Connection> connection,
                               int status, const std::string& reason) {
        std::string client_id = connection->remote_endpoint_address();
        std::lock_guard<std::mutex> lock(clients_mutex_);

        if (client_sessions_.count(client_id)) {
            jwt_auth_->invalidateToken(client_sessions_[client_id].token);
            client_sessions_.erase(client_id);
        }
        connections_.erase(client_id);
    }

    bool authenticateClient(const std::string& client_id, const json& data) {
        std::lock_guard<std::mutex> lock(clients_mutex_);

        if (!data.contains("token")) return false;

        std::string token = data["token"];
        if (!jwt_auth_->isValidToken(token)) return false;

        // ذخیره اطلاعات کاربر
        if (!client_sessions_.count(client_id)) {
            ClientSession session;
            session.user_id = jwt_auth_->getUserId(token);
            session.role = jwt_auth_->getUserRole(token);
            session.token = token;
            client_sessions_[client_id] = session;
        }

        return true;
    }

    int port_;
    bool running_ = false;
    std::shared_ptr<WsServer> server_;
    std::thread server_thread_;
    std::shared_ptr<SimpleJwtAuth> jwt_auth_;

    std::unordered_map<std::string, std::function<json(const json&, const std::string&)>> handlers_;
    std::mutex handlers_mutex_;

    std::unordered_map<std::string, std::weak_ptr<WsServer::Connection>> connections_;
    std::unordered_map<std::string, ClientSession> client_sessions_;
    std::mutex clients_mutex_;
};

// Implementations of WebSocketServer
WebSocketServer::WebSocketServer(int port, const std::string& jwt_secret)
        : impl_(std::make_unique<Impl>(port, jwt_secret)) {}

WebSocketServer::~WebSocketServer() {
    stop();
}

void WebSocketServer::start() {
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
    return impl_->getClientRole(client_id);
}