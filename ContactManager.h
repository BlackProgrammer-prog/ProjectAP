#pragma once
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

private:
    std::shared_ptr<Database> database_;
};