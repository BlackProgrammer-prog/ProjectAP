#include "Profile.h"
using json = nlohmann::json;

Profile::Profile() : fullName(""), bio(""), avatarUrl(""), birthDate("") {}

Profile::Profile(const std::string& jsonStr) {
    fromJson(jsonStr);
}

std::string Profile::getFullName() const { return fullName; }
void Profile::setFullName(const std::string& name) { fullName = name; }

std::string Profile::getBio() const { return bio; }
void Profile::setBio(const std::string& b) { bio = b; }

std::string Profile::getAvatarUrl() const { return avatarUrl; }
void Profile::setAvatarUrl(const std::string& url) { avatarUrl = url; }

std::string Profile::getBirthDate() const { return birthDate; }
void Profile::setBirthDate(const std::string& date) { birthDate = date; }

json Profile::toJson() const {
    return json{
            {"fullName", fullName},
            {"bio", bio},
            {"avatarUrl", avatarUrl},
            {"birthDate", birthDate}
    };
}

void Profile::fromJson(const json& j) {
    fullName = j.value("fullName", "");
    bio = j.value("bio", "");
    avatarUrl = j.value("avatarUrl", "");
    birthDate = j.value("birthDate", "");
}

void Profile::fromJson(const std::string& jsonStr) {
    try {
        json j = json::parse(jsonStr);
        fromJson(j);
    } catch (...) {
        // نادیده گرفتن خطا
    }
}

bool Profile::isValid() const {
    return !fullName.empty();
}
