#include "ProfileManager.h"
#include "Socket/WebSocketHandler.h"

ProfileManager::ProfileManager(std::shared_ptr<Database> db, WebSocketServer& server)
        : db_(db), server_(server) {}

void ProfileManager::setupRoutes() {
    server_.on("get_profile", [this](const json& data, const std::string& clientId) {
        return handleProfileRequest(data);
    });
}

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
