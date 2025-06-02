//
// Created by afraa on 5/22/2025.
//

#ifndef REGISTRATION_H
#define REGISTRATION_H

#include <string>
#include "DataBase/Database.h"
#include "UrlCreate.h"

class Registration {
public:
    explicit Registration(Database& database);

    bool registerUser(
            const std::string& email,
            const std::string& username,
            const std::string& password,
            const json& profile = json::object(),
            const json& settings = json::object()
    );

private:
    Database& db;
    UrlCreate urlCreator;

    std::string hashPassword(const std::string& password);
    bool isDuplicate(const std::string& field, const std::string& value);
};

#endif // REGISTRATION_H

