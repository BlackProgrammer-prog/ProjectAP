#include "User.h"

using json = nlohmann::json;

User::User() : id(""), email(""), username(""), passwordHash(""), customUrl("") {}

std::string User::getId() const { return id; }
void User::setId(const std::string& id) { this->id = id; }

std::string User::getEmail() const { return email; }
void User::setEmail(const std::string& email) { this->email = email; }

std::string User::getUsername() const { return username; }
void User::setUsername(const std::string& username) { this->username = username; }

std::string User::getPasswordHash() const { return passwordHash; }
void User::setPasswordHash(const std::string& passwordHash) { this->passwordHash = passwordHash; }

std::string User::getCustomUrl() const { return customUrl; }
void User::setCustomUrl(const std::string& customUrl) { this->customUrl = customUrl; }

Profile User::getProfile() const { return profile; }
void User::setProfile(const Profile& profile) { this->profile = profile; }
void User::setProfileFromJson(const std::string& profileJson) {
    profile.fromJson(profileJson);
}

Settings User::getSettings() const { return settings; }
void User::setSettings(const Settings& settings) { this->settings = settings; }
void User::setSettingsFromJson(const std::string& settingsJson) {
    settings.fromJson(settingsJson);
}


const std::vector<User::Contact>& User::getContacts() const { return contacts; }
void User::setContacts(const std::vector<Contact>& contacts) { this->contacts = contacts; }
void User::addContact(const Contact& contact) { contacts.push_back(contact); }

bool User::isValid() const {
    return !id.empty() && !email.empty() && !username.empty() && !passwordHash.empty();
}


std::string User::toJson() const {
    json j;
    j["id"] = id;
    j["email"] = email;
    j["username"] = username;
    j["passwordHash"] = passwordHash;
    j["customUrl"] = customUrl;
    j["profile"] = profile.toJson();
    j["settings"] = settings.toJson();

    json contactArray = json::array();
    for (const auto& contact : contacts) {
        contactArray.push_back(contact.toJson());
    }
    j["contacts"] = contactArray;

    return j.dump();
}


void User::fromJson(const std::string& jsonStr) {
    try {
        json j = json::parse(jsonStr);
        fromJson(j);
    } catch (...) {
        // handle error silently
    }
}


void User::fromJson(const json& j) {
    id = j.value("id", "");
    email = j.value("email", "");
    username = j.value("username", "");
    passwordHash = j.value("passwordHash", "");
    customUrl = j.value("customUrl", "");

    profile.fromJson(j.value("profile", json::object()));
    settings.fromJson(j.value("settings", json::object()));

    contacts.clear();
    for (const auto& item : j.value("contacts", json::array())) {
        Contact contact;
        contact.fromJson(item);
        contacts.push_back(contact);
    }
}
