#include "Settings.h"
using json = nlohmann::json;

Settings::Settings() : darkMode(false), language("en"), notificationsEnabled(true) {}

Settings::Settings(const std::string& jsonStr) {
    fromJson(jsonStr);
}

bool Settings::getDarkMode() const { return darkMode; }
void Settings::setDarkMode(bool mode) { darkMode = mode; }

std::string Settings::getLanguage() const { return language; }
void Settings::setLanguage(const std::string& lang) { language = lang; }

bool Settings::getNotificationsEnabled() const { return notificationsEnabled; }
void Settings::setNotificationsEnabled(bool enabled) { notificationsEnabled = enabled; }

json Settings::toJson() const {
    return json{
            {"darkMode", darkMode},
            {"language", language},
            {"notificationsEnabled", notificationsEnabled}
    };
}

void Settings::fromJson(const json& j) {
    darkMode = j.value("darkMode", false);
    language = j.value("language", "en");
    notificationsEnabled = j.value("notificationsEnabled", true);
}

void Settings::fromJson(const std::string& jsonStr) {
    try {
        json j = json::parse(jsonStr);
        fromJson(j);
    } catch (...) {
        // Ignore errors
    }
}

Settings Settings::defaultSettings() {
    return Settings();
}
