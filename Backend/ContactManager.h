//
// Created by HOME on 6/28/2025.
//

#ifndef BACKEND_CONTACTMANAGER_H
#define BACKEND_CONTACTMANAGER_H

#include "Database.h"
#include <string>
#include <vector>
#include <memory>

class ContactManager {

public:
    explicit ContactManager(std::shared_ptr<Database> db);

    bool addContact(const std::string& user_id, const std::string& contact_email);
    bool removeContact(const std::string& user_id, const std::string& contact_email);
    std::vector<std::string> getContacts(const std::string& user_id);
    bool isContact(const std::string& user_id, const std::string& contact_email);
    std::string findUserByEmail(const std::string& email);
    json searchUsers(const std::string& query);

    // Persist online/offline flag in database
    bool setUserOnlineStatus(const std::string& user_id, bool online);
    bool setAllUsersOffline();

    // Blocking helpers
    bool blockUserByEmail(const std::string& user_id, const std::string& target_email);
    bool isBlocked(const std::string& user_id, const std::string& target_email);

    // Online status by email (from DB `users.online`)
    int getOnlineStatusByEmail(const std::string& email);
    
    // Unread count by user id
    int getUnreadCountForUser(const std::string& user_id);

    // Delete user by id
    bool deleteUserById(const std::string& user_id);

    // Open chats JSON helpers
    json getOpenChats(const std::string& user_id);
    bool setOpenChats(const std::string& user_id, const json& open_chats);

private:
    std::shared_ptr<Database> database_;
};


#endif //BACKEND_CONTACTMANAGER_H
