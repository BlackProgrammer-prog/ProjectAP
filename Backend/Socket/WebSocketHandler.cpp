// WebSocketHandler.cpp
#include "WebSocketHandler.h"
#include <boost/asio.hpp>
#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/strand.hpp>
#include <thread>
#include <mutex>
#include <iostream>

using tcp = boost::asio::ip::tcp;
namespace websocket = boost::beast::websocket;
namespace beast = boost::beast;
using json = nlohmann::json;

class WebSocketServer::Impl {
public:
    Impl(int port, const std::string& jwt_secret)
            : port_(port),
              jwt_auth_(JwtAuth::create(jwt_secret)),
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
        return client_sessions_[client_id].user_id;
    }

    std::string getClientRole(const std::string& client_id) {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        return client_sessions_[client_id].role;
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
                std::string msg = boost::beast::buffers_to_string(buffer_.data());
                json data = json::parse(msg);
                std::string client_id = remoteIp();

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
                ws_.write(boost::asio::buffer(json{{"status", "error"}, {"message", e.what()}}.dump()));
            }

            buffer_.consume(buffer_.size());
            read();
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
        }

        return true;
    }

    int port_;
    boost::asio::io_context ioc_;
    tcp::acceptor acceptor_;
    std::thread thread_;

    std::shared_ptr<JwtAuth> jwt_auth_;
    std::unordered_map<std::string, std::function<json(const json&, const std::string&)>> handlers_;
    std::mutex handlers_mutex_;

    std::unordered_map<std::string, std::shared_ptr<websocket::stream<tcp::socket>>> connections_;
    std::unordered_map<std::string, ClientSession> client_sessions_;
    std::mutex clients_mutex_;
};

// رابط عمومی
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