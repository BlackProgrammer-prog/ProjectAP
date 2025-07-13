#include "ContactManager.h"
#include <algorithm>
using namespace std;

ContactManager::ContactManager(shared_ptr<Database> db)
    : database_(db) {}

bool ContactManager::addContact(const string& user_id,
                                const string& contact_email) {
    DBUser user = database_->getUserById(user_id);
    DBUser contact = database_->getUserByEmail(contact_email);

    if (user.id.empty() || contact.id.empty()) {
        return false;
    }

    json contacts = user.contacts;
    if (!contacts.contains(contact.id)) {
        contacts[contact.id] = contact_email;
        user.contacts = contacts;
        return database_->updateUser(user);
    }
    return true;
}

bool ContactManager::removeContact(const string& user_id,
                                   const string& contact_email) {
    DBUser user = database_->getUserById(user_id);
    DBUser contact = database_->getUserByEmail(contact_email);

    if (user.id.empty() || contact.id.empty()) {
        return false;
    }

    json contacts = user.contacts;
    if (contacts.contains(contact.id)) {
        contacts.erase(contact.id);
        user.contacts = contacts;
        return database_->updateUser(user);
    }
    return true;
}

vector<string> ContactManager::getContacts(const string& user_id) {
    DBUser user = database_->getUserById(user_id);
    vector<string> contacts;

    if (!user.id.empty()) {
        for (auto& [id, email] : user.contacts.items()) {
            contacts.push_back(email);
        }
    }
    return contacts;
}

bool ContactManager::isContact(const string& user_id,
                               const string& contact_email) {
    DBUser user = database_->getUserById(user_id);
    DBUser contact = database_->getUserByEmail(contact_email);

    if (user.id.empty() || contact.id.empty()) {
        return false;
    }

    return user.contacts.contains(contact.id);
}

string ContactManager::findUserByEmail(const string& email) {
    DBUser user = database_->getUserByEmail(email);
    return user.id;
}