#ifndef BACKEND_PROFILEMANAGER_H
#define BACKEND_PROFILEMANAGER_H

#include "Database.h"
#include "json.hpp"

class WebSocketServer; // Forward declaration

using json = nlohmann::json;

// handles stuff about user profiles
class ProfileManager {
public:
    ProfileManager(std::shared_ptr<Database> db, WebSocketServer& server);

    // sets up WebSocket routes for profile stuff
    void setupRoutes();

private:
    // handles a "get_profile" request
    json handleProfileRequest(const json& data);

    std::shared_ptr<Database> db_;
    WebSocketServer& server_;
};

#endif //BACKEND_PROFILEMANAGER_H