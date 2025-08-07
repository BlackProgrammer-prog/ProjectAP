
#ifndef BACKEND_PROFILEMANAGER_H
#define BACKEND_PROFILEMANAGER_H

#include "Database.h"
#include "json.hpp"

class WebSocketServer; // Forward declaration

using json = nlohmann::json;


class ProfileManager {
public:
    ProfileManager(std::shared_ptr<Database> db, WebSocketServer& server);
    void setupRoutes();

private:
    json handleProfileRequest(const json& data);

    std::shared_ptr<Database> db_;
    WebSocketServer& server_;
};

#endif //BACKEND_PROFILEMANAGER_H