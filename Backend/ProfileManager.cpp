#include "ProfileManager.h"
#include "Socket/WebSocketHandler.h"

// constructor saves db and server
ProfileManager::ProfileManager(std::shared_ptr<Database> db, WebSocketServer& server)
        : db_(db), server_(server) {}

// sets up route for "get_profile" message
void ProfileManager::setupRoutes() {
    server_.on("get_profile", [this](const json& data, const std::string& clientId) {
        return handleProfileRequest(data);
    });
}

// handles profile request from client
json ProfileManager::handleProfileRequest(const json& data) {
    if (!data.contains("email")) {
        return {{"status", "error"}, {"message", "Email is required"}};
    }

    std::string email = data["email"];
    json profile = db_->getPublicUserProfile(email);

    if (profile.is_null()) {
        return {{"status", "error"}, {"message", "User not found"}};
    }

    return {{"status", "success"}, {"profile", profile}};
}
