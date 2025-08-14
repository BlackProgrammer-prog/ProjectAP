//
// Created by HOME on 6/28/2025.
//

#include "ContactManager.h"
#include <algorithm>

ContactManager::ContactManager(std::shared_ptr<Database> db)
        : database_(db) {}

bool ContactManager::addContact(const std::string& user_id,
                                const std::string& contact_email) {
    DBUser user = database_->getUserById(user_id);
    DBUser contact = database_->getUserByEmail(contact_email);

    if(user.id.empty() || contact.id.empty()) {
        return false;
    }

    json contacts = user.contacts;
    if(!contacts.contains(contact.id)) {
        contacts[contact.id] = contact_email;
        user.contacts = contacts;
        return database_->updateUser(user);
    }
    return true;
}

bool ContactManager::removeContact(const std::string& user_id,
                                   const std::string& contact_email) {
    DBUser user = database_->getUserById(user_id);
    DBUser contact = database_->getUserByEmail(contact_email);

    if(user.id.empty() || contact.id.empty()) {
        return false;
    }

    json contacts = user.contacts;
    if(contacts.contains(contact.id)) {
        contacts.erase(contact.id);
        user.contacts = contacts;
        return database_->updateUser(user);
    }
    return true;
}

std::vector<std::string> ContactManager::getContacts(const std::string& user_id) {
    DBUser user = database_->getUserById(user_id);
    std::vector<std::string> contacts;

    if(!user.id.empty()) {
        for(auto& [id, email] : user.contacts.items()) {
            contacts.push_back(email);
        }
    }
    return contacts;
}

bool ContactManager::isContact(const std::string& user_id,
                               const std::string& contact_email) {
    DBUser user = database_->getUserById(user_id);
    DBUser contact = database_->getUserByEmail(contact_email);

    if(user.id.empty() || contact.id.empty()) {
        return false;
    }

    return user.contacts.contains(contact.id);
}

std::string ContactManager::findUserByEmail(const std::string& email) {
    DBUser user = database_->getUserByEmail(email);
    return user.id;
}

json ContactManager::searchUsers(const std::string& query) {
    auto results = database_->searchUsers(query);
    json users = json::array();

    for (const auto& user : results) {
        users.push_back({
            {"user_id", user.id},
            {"email", user.email},
            {"username", user.username}
        });
    }

    return users;
}

bool ContactManager::setUserOnlineStatus(const std::string& user_id, bool online) {
    // Database expects user id; if empty, nothing to do
    if (user_id.empty()) return false;
    return database_->setUserOnlineStatus(user_id, online);
}

bool ContactManager::setAllUsersOffline() {
    return database_->setAllUsersOffline();
}
