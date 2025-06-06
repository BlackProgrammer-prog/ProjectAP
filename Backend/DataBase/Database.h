//
// Created by afraa on 5/31/2025.
//

#ifndef BACKEND_DATABASE_H
#define BACKEND_DATABASE_H

#include <string>
#include <vector>
#include <memory>
#include "json.hpp"

using json = nlohmann::json;
using namespace std;


struct DBUser {
    string id;
    string email;
    string username;
    string passwordHash;
    json profile;
    json settings;
    string customUrl;
    json contacts;
};

struct QueryResult {
    bool success;
    string message;
    vector<string> data;
};


class Database {
public:
    Database (const std::string& databasePath);
    ~Database ();

    bool createUser(const std::string& email,
                    const std::string& username,
                    const std::string& passwordHash,
                    const json& profile = json::object(),
                    const json& settings = json::object(),
                    const std::string& customUrl = "");


    DBUser getUserById(const std::string& userId);
    DBUser getUserByUsername(const std::string& username);

    [[maybe_unused]] DBUser getUserByEmail(const std::string& email);

    bool updateUser(const DBUser& user);
    bool deleteUser(const std::string& userId);

    QueryResult executeQuery(const std::string& query);
    QueryResult executeQueryWithParams(const std::string& query,
                                       const std::vector<std::string>& params);

    bool backupDatabase(const std::string& backupPath);
    bool restoreDatabase(const std::string& backupPath);

    bool userExistsByEmail(const std::string& email);
    bool userExistsByUsername(const std::string& username);

private:
    struct Impl;
    std::unique_ptr<Impl> pImpl;
};


#endif //BACKEND_DATABASE_H
