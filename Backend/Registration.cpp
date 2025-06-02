//
// Created by afraa on 5/22/2025.
//

#include "Registration.h"
#include <functional> // برای std::hash
#include <iostream>

Registration::Registration(Database& database) : db(database) {}

bool Registration::registerUser(
        const std::string& email,
        const std::string& username,
        const std::string& password,
        const json& profile,
        const json& settings
) {
    if (isDuplicate("email", email)) {
        std::cerr << "Email already exists.\n";
        return false;
    }

    if (isDuplicate("username", username)) {
        std::cerr << "Username already exists.\n";
        return false;
    }

    std::string hashedPassword = hashPassword(password);
    std::string customUrl = urlCreator.createUrl(email);

    return db.createUser(email, username, hashedPassword, profile, settings, customUrl);
}

std::string Registration::hashPassword(const std::string& password) {
    // هش ساده برای نمونه؛ در پروژه واقعی از کتابخانه‌های امن‌تر استفاده کن
    return std::to_string(std::hash<std::string>{}(password));
}

bool Registration::isDuplicate(const std::string& field, const std::string& value) {
    User user;
    if (field == "email") {
        user = db.getUserByEmail(value);
    } else if (field == "username") {
        user = db.getUserByUsername(value);
    } else {
        return false;
    }

    return !user.id.empty(); // یعنی کاربر پیدا شده
}
