#ifndef USER_H
#define USER_H

#include <string>
#include <vector>
#include <nlohmann/json.hpp>
#include "Profile.h"
#include "Settings.h"

class User {
public:
    User();

    struct Contact {
        std::string id;
        std::string name;

        nlohmann::json toJson() const {
            return { {"id", id}, {"name", name} };
        }

        void fromJson(const nlohmann::json& j) {
            id = j.value("id", "");
            name = j.value("name", "");
        }
    };


    std::string getId() const;
    void setId(const std::string& id);

    std::string getEmail() const;
    void setEmail(const std::string& email);

    std::string getUsername() const;
    void setUsername(const std::string& username);

    std::string getPasswordHash() const;
    void setPasswordHash(const std::string& passwordHash);

    std::string getCustomUrl() const;
    void setCustomUrl(const std::string& customUrl);

    Profile getProfile() const;
    void setProfile(const Profile& profile);
    void setProfileFromJson(const std::string& json);

    Settings getSettings() const;
    void setSettings(const Settings& settings);
    void setSettingsFromJson(const std::string& json);

    const std::vector<Contact>& getContacts() const;
    void setContacts(const std::vector<Contact>& contacts);
    void addContact(const Contact& contact);

    std::string toJson() const;
    void fromJson(const std::string& jsonStr);
    void fromJson(const nlohmann::json& j);

    bool isValid() const;


private:
    std::string id;
    std::string email;
    std::string username;
    std::string passwordHash;
    std::string customUrl;
    Profile profile;
    Settings settings;
    std::vector<Contact> contacts;
};

#endif // USER_H
