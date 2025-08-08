//
// Created by afraa on 6/7/2025.
//

#include "ProfileManager.h"
#include "Socket/WebSocketHandler.h"
#include "sha256.h"
#include "FileManager.h"

ProfileManager::ProfileManager(std::shared_ptr<Database> db, WebSocketServer& server, std::shared_ptr<JwtAuth> jwtAuth)
    : db_(db), server_(server), jwtAuth_(jwtAuth) {}

void ProfileManager::setupRoutes() {
    server_.on("get_profile", [this](const json& data, const std::string& clientId) {
        return handleProfileRequest(data);
    });
    
    server_.on("update_user_info", [this](const json& data, const std::string& clientId) {
        return handleUpdateUserInfo(data);
    });

    server_.on("change_password", [this](const json& data, const std::string& clientId) {
        return handleChangePassword(data);
    });

    server_.on("set_notification_status", [this](const json& data, const std::string& clientId) {
        return handleSetNotificationStatus(data);
    });

    server_.on("update_avatar", [this](const json& data, const std::string& clientId) {
        return handleUpdateAvatar(data);
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

json ProfileManager::handleUpdateUserInfo(const json& data) {
    if (!data.contains("token")) {
        return {{"status", "error"}, {"message", "Token is required"}};
    }

    std::string token = data["token"];
    if (!jwtAuth_->isValidToken(token)) {
        return {{"status", "error"}, {"message", "Invalid or expired token"}};
    }

    std::string userId = jwtAuth_->getUserId(token);
    DBUser user = db_->getUserById(userId);

    if (user.id.empty()) {
        return {{"status", "error"}, {"message", "User not found"}};
    }

    bool updated = false;

    if (data.contains("profile_json")) {
        user.profile = data["profile_json"];
        updated = true;
    }

    if (data.contains("settings_json")) {
        user.settings = data["settings_json"];
        updated = true;
    }

    if (updated) {
        if (db_->updateUser(user)) {
            return {{"status", "success"}, {"message", "User information updated successfully"}};
        } else {
            return {{"status", "error"}, {"message", "Failed to update user information"}};
        }
    }

    return {{"status", "error"}, {"message", "No update information provided"}};
}

json ProfileManager::handleChangePassword(const json& data) {
    if (!data.contains("token") || !data.contains("current_password") || !data.contains("new_password")) {
        return {{"status", "error"}, {"message", "Token, current password, and new password are required"}};
    }

    std::string token = data["token"];
    if (!jwtAuth_->isValidToken(token)) {
        return {{"status", "error"}, {"message", "Invalid or expired token"}};
    }

    std::string userId = jwtAuth_->getUserId(token);
    DBUser user = db_->getUserById(userId);

    if (user.id.empty()) {
        return {{"status", "error"}, {"message", "User not found"}};
    }

    // Verify current password
    std::string currentPasswordHash = sha256(data["current_password"]);
    if (currentPasswordHash != user.passwordHash) {
        return {{"status", "error"}, {"message", "Incorrect current password"}};
    }

    // Set new password
    user.passwordHash = sha256(data["new_password"]);

    if (db_->updateUser(user)) {
        return {{"status", "success"}, {"message", "Password changed successfully"}};
    } else {
        return {{"status", "error"}, {"message", "Failed to change password"}};
    }
}

json ProfileManager::handleSetNotificationStatus(const json& data) {
    if (!data.contains("token") || !data.contains("enabled")) {
        return {{"status", "error"}, {"message", "Token and enabled status are required"}};
    }

    std::string token = data["token"];
    if (!jwtAuth_->isValidToken(token)) {
        return {{"status", "error"}, {"message", "Invalid or expired token"}};
    }

    std::string userId = jwtAuth_->getUserId(token);
    DBUser user = db_->getUserById(userId);

    if (user.id.empty()) {
        return {{"status", "error"}, {"message", "User not found"}};
    }

    if (!data["enabled"].is_boolean()) {
        return {{"status", "error"}, {"message", "Enabled status must be a boolean (true/false)"}};
    }

    user.settings["notificationsEnabled"] = data["enabled"];

    if (db_->updateUser(user)) {
        return {{"status", "success"}, {"message", "Notification status updated successfully"}};
    } else {
        return {{"status", "error"}, {"message", "Failed to update notification status"}};
    }
}

json ProfileManager::handleUpdateAvatar(const json& data) {
    if (!data.contains("token") || !data.contains("avatar_data") || !data.contains("filename")) {
        return {{"status", "error"}, {"message", "Token, avatar data, and filename are required"}};
    }

    std::string token = data["token"];
    if (!jwtAuth_->isValidToken(token)) {
        return {{"status", "error"}, {"message", "Invalid or expired token"}};
    }

    std::string userId = jwtAuth_->getUserId(token);
    DBUser user = db_->getUserById(userId);

    if (user.id.empty()) {
        return {{"status", "error"}, {"message", "User not found"}};
    }

    std::string avatarData = data["avatar_data"];
    std::string filename = data["filename"];
    
    std::string savedPath = FileManager::saveBase64File(avatarData, "../uploads/avatars", filename);

    if (savedPath.empty()) {
        return {{"status", "error"}, {"message", "Failed to save avatar image"}};
    }

    user.profile["avatarUrl"] = savedPath;

    if (db_->updateUser(user)) {
        return {
            {"status", "success"},
            {"message", "Avatar updated successfully"},
            {"avatarUrl", savedPath}
        };
    } else {
        return {{"status", "error"}, {"message", "Failed to update avatar URL in database"}};
    }
}
