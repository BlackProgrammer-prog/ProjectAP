//
// Created by afraa on 6/1/2025.
//

#ifndef BACKEND_WEBSOCKETHANDLER_H
#define BACKEND_WEBSOCKETHANDLER_H

#include <memory>
#include <string>
#include <functional>
#include <unordered_map>
#include "JwtAuth.h"
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

class WebSocketServer {
public:
    // سازنده و تخریب کننده
    WebSocketServer(int port, const std::string& jwt_secret);
    ~WebSocketServer();

    // مدیریت سرور
    void start();
    void stop();

    // ثبت هندلرهای پیام
    void on(const std::string& message_type,
            std::function<json(const json&, const std::string&)> handler);

    // ارسال پیام به کلاینت خاص
    void sendToClient(const std::string& client_id, const json& message);

    // مدیریت کاربران
    std::string getClientUserId(const std::string& client_id);
    std::string getClientRole(const std::string& client_id);

private:
    class Impl;
    std::unique_ptr<Impl> impl_;
};


#endif //BACKEND_WEBSOCKETHANDLER_H
