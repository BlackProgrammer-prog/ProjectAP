#include "login.h"
#include <stdexcept>
#include "user.h"
#include "Database.h"


static User convertDBUserToUser(const DBUser& dbUser) {
    User user;
    user.setId(dbUser.id);
    user.setEmail(dbUser.email);
    user.setUsername(dbUser.username);
    user.setPasswordHash(dbUser.passwordHash);
    user.setCustomUrl(dbUser.customUrl);


    if (!dbUser.profile.empty()) {
        user.setProfileFromJson(dbUser.profile.dump());
    }


    if (!dbUser.settings.empty()) {
        user.setSettingsFromJson(dbUser.settings.dump());
    }


    if (!dbUser.contacts.empty() && dbUser.contacts.is_array()) {
        std::vector<User::Contact> contacts;
        for (const auto& contact : dbUser.contacts) {
            User::Contact c;
            c.fromJson(contact);
            contacts.push_back(c);
        }
        user.setContacts(contacts);
    }

    return user;
}

Login::Login(std::shared_ptr<Database> db, WebSocketServer& server, std::shared_ptr<JwtAuth> jwtAuth)
        : db_(db), server_(server), jwtAuth_(jwtAuth) {}

void Login::setupRoutes() {
    server_.on("login", [this](const nlohmann::json& data, const std::string& clientId) {
        return handleLogin(data, clientId);
    });
}

nlohmann::json Login::handleLogin(const nlohmann::json& data, const std::string& clientId) {
    if (!data.contains("email") || !data.contains("password")) {
        return {{"status", "error"}, {"message", "Missing email or password"}};
    }

    std::string email = data["email"];
    std::string password = data["password"];

    // Get user by email
    DBUser dbUser = db_->getUserByEmail(email);
    if (dbUser.id.empty()) { // Check if user was found
        return {{"status", "error"}, {"message", "Invalid email or password"}};
    }

    User user = convertDBUserToUser(dbUser);

    // Verify password: hash the input and compare with stored hash
    std::string inputHash = sha256(password);
    if (inputHash != user.getPasswordHash()) {
        return {{"status", "error"}, {"message", "Invalid email or password"}};
    }

    // Create JWT token
    std::string token = jwtAuth_->createUserToken(
            user.getId(),
            "user", // Default role
            24 // 24 hours expiration
    );

    // Mark user online (memory and DB)
    // Log login event in stat table
    db_->executeQueryWithParams(
        "INSERT INTO stat (user_id, event, timestamp) VALUES (?, 'login', ?)",
        { user.getId(), std::to_string(std::time(nullptr)) }
    );
    try {
        server_.setUserOnlineStatus(user.getId(), true);
    } catch(...) {}

    // Return token and user info (without sensitive data)
    nlohmann::json userInfo = nlohmann::json::parse(user.toJson());
    userInfo.erase("passwordHash");

    return {
            {"status", "success"},
            {"token", token},
            {"user", userInfo}
    };
}