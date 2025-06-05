// WebSocketHandler.h
#ifndef BACKEND_WEBSOCKETHANDLER_H
#define BACKEND_WEBSOCKETHANDLER_H

#include <memory>
#include <string>
#include <functional>
#include <unordered_map>
#include "JwtAuth.h"
#include "json.hpp"

class WebSocketServer {
public:
    WebSocketServer(int port, const std::string& jwt_secret);
    ~WebSocketServer();

    void start();
    void stop();

    void on(const std::string& message_type,
            std::function<nlohmann::json(const nlohmann::json&, const std::string&)> handler);

    void sendToClient(const std::string& client_id, const nlohmann::json& message);

    std::string getClientUserId(const std::string& client_id);
    std::string getClientRole(const std::string& client_id);

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};

#endif // BACKEND_WEBSOCKETHANDLER_H