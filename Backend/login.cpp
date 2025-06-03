//
// Created by Acer on 5/28/2025.
//

#include "Login.h"
#include <functional>  //

Login::Login(Database& database) : db(database) {}

bool Login::authenticate(const std::string& credential, const std::string& password) {
    User user = db.getUserByUsername(credential);
    if (user.username.empty()) {
        user = db.getUserByEmail(credential);
    }

    if (user.passwordHash.empty()) return false;

    return user.passwordHash == hashPassword(password);
}

User Login::getUserData(const std::string& credential) {
    User user = db.getUserByUsername(credential);
    if (user.username.empty()) {
        user = db.getUserByEmail(credential);
    }
    return user;
}

std::string Login::hashPassword(const std::string& password) {
    return std::to_string(std::hash<std::string>{}(password));
}

