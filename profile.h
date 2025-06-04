#ifndef PROFILE_H
#define PROFILE_H

#include <string>
#include <nlohmann/json.hpp>

class Profile {
public:
    Profile();
    explicit Profile(const std::string& jsonStr);

    std::string getFullName() const;
    void setFullName(const std::string& name);

    std::string getBio() const;
    void setBio(const std::string& bio);

    std::string getAvatarUrl() const;
    void setAvatarUrl(const std::string& url);

    std::string getBirthDate() const;
    void setBirthDate(const std::string& date);

    nlohmann::json toJson() const;
    void fromJson(const nlohmann::json& j);
    void fromJson(const std::string& jsonStr); // فقط برای سازگاری

    bool isValid() const;

private:
    std::string fullName;
    std::string bio;
    std::string avatarUrl;
    std::string birthDate;
};

#endif
