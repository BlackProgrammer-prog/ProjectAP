#include "Registration.h"
#include <stdexcept>
#include <chrono>
#include <random>
#include <sstream>
#include "json.hpp"

Registration::Registration(std::shared_ptr<Database> db, WebSocketServer& server)
        : db_(db), server_(server) {}

void Registration::setupRoutes() {
    server_.on("register", [this](const json& data, const std::string& clientId) {
        return handleRegistration(data, clientId);
    });
}

json Registration::handleRegistration(const json& data, const std::string& clientId) {

    if (!data.contains("email") && !data.contains("password") && !data.contains("username")) {
        return {{"status", "error"}, {"message", "فیلدهای ضروری پر نشده‌اند"}};
    }

    std::string email = data["email"];
    std::string password = data["password"];
    std::string username = data["username"];


    if (db_->userExistsByEmail(email)) {
        return {{"status", "error"}, {"message", "این ایمیل قبلاً ثبت شده است"}};
    }


    if (db_->userExistsByUsername(username)) {
        return {{"status", "error"}, {"message", "این نام کاربری قبلاً انتخاب شده است"}};
    }


    std::string passwordHash = sha256(password);


    std::string customUrl = urlCreator_.createUrl(email);


    Profile defaultProfile;
    Settings defaultSettings = Settings::defaultSettings();



    json profileJson = defaultProfile.toJson();
    json settingsJson = defaultSettings.toJson();
    json contactsJson = json::array();


    if (!db_->createUser(
            email,
            username,
            passwordHash,
            profileJson,
            settingsJson,
            customUrl
    )) {
        return {{"status", "error"}, {"message", "خطا در ایجاد حساب کاربری"}};
    }

    return {{"status", "success"}, {"message", "ثبت‌نام با موفقیت انجام شد"}};
}