//
// Created by afraa on 6/7/2025.
//

#ifndef BACKEND_PROFILEMANAGER_H
#define BACKEND_PROFILEMANAGER_H

#include "Database.h"
#include "json.hpp"
#include "JwtAuth.h"

class WebSocketServer; // Forward declaration

using json = nlohmann::json;


class ProfileManager {
public:
    ProfileManager(std::shared_ptr<Database> db, WebSocketServer& server, std::shared_ptr<JwtAuth> jwtAuth);
    void setupRoutes();

private:
    json handleProfileRequest(const json& data);
    json handleUpdateUserInfo(const json& data);
    json handleChangePassword(const json& data);
    json handleSetNotificationStatus(const json& data);

    std::shared_ptr<Database> db_;
    WebSocketServer& server_;
    std::shared_ptr<JwtAuth> jwtAuth_;
};

#endif //BACKEND_PROFILEMANAGER_H
