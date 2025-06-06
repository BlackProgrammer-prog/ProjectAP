#ifndef LOGIN_H
#define LOGIN_H

#include "WebSocketHandler.h"
#include "Database.h"
#include "JwtAuth.h"
#include "sha256.h"
#include <functional>
#include <json.hpp>
#include "user.h"
#include "Settings.h"
#include "UrlCreate.h"



class Login {
public:
    Login(Database& db, WebSocketServer& server, std::shared_ptr<JwtAuth> jwtAuth);
    void setupRoutes();

private:
    nlohmann::json handleLogin(const nlohmann::json& data, const std::string& clientId);

    Database& db_;
    WebSocketServer& server_;
    std::shared_ptr<JwtAuth> jwtAuth_;
};

#endif // LOGIN_H