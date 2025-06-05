//
// Created by Acer on 5/28/2025.
//

#ifndef LOGIN_H
#define LOGIN_H

#include <string>
#include "DataBase/Database.h"

class Login {
public:
    explicit Login(Database& database);

    bool authenticate(const std::string& credential, const std::string& password);

    User getUserData(const std::string& credential);

private:
    Database& db;

    std::string hashPassword(const std::string& password);
};

#endif // LOGIN_H
