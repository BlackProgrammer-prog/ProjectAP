//
// Created by afraa on 5/31/2025.
//

#ifndef BACKEND_DATABASE_H
#define BACKEND_DATABASE_H

#include <string>
#include <vector>
#include <map>
#include <memory>
#include "json.hpp"

using json = nlohmann::json;
using namespace std;


struct DBUser {
    std::string id;
    std::string email;
    std::string username;
    std::string passwordHash;
    json profile;
    json settings;
    std::string customUrl;
    json contacts;
};

struct QueryResult {
    bool success = false;
    std::string message;
    std::vector<std::string> data;
};

class Database {
public:
    explicit Database(const std::string& databasePath);
    ~Database();

    bool createUser(const std::string& email,
                    const std::string& username,
                    const std::string& passwordHash,
                    const json& profile,
                    const json& settings,
                    const std::string& customUrl);

    DBUser getUserById(const std::string& userId);
    DBUser getUserByUsername(const std::string& username);
    DBUser getUserByEmail(const std::string& email);

    bool updateUser(const DBUser& user);
    bool deleteUser(const std::string& userId);

    QueryResult executeQuery(const std::string& query);
    QueryResult executeQueryWithParams(const std::string& query,
                                       const std::vector<std::string>& params);

    bool userExistsByEmail(const std::string& email);
    bool userExistsByUsername(const std::string& username);

    // Contact methods
    bool addContact(const std::string& user_id, const std::string& contact_email);
    bool removeContact(const std::string& user_id, const std::string& contact_email);
    std::vector<std::string> getContacts(const std::string& user_id);
    json getPublicUserProfile(const std::string& email);
    std::vector<DBUser> searchUsers(const std::string& query);
    // Message methods
    bool storeMessage(const std::string& id,
                      const std::string& sender_id,
                      const std::string& receiver_id,
                      const std::string& content,
                      time_t timestamp,
                      bool delivered,
                      bool read);

    std::vector<std::vector<std::string>> getMessagesBetweenUsers(
            const std::string& user1,
            const std::string& user2,
            int limit = 100
    );

private:
    struct Impl;
    std::unique_ptr<Impl> pImpl;
};


#endif //BACKEND_DATABASE_H
