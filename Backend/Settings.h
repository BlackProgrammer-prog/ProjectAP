#ifndef SETTINGS_H
#define SETTINGS_H

#include <string>
#include "json.hpp"

class Settings {
public:
    Settings();
    explicit Settings(const std::string& jsonStr);

    bool getDarkMode() const;
    void setDarkMode(bool mode);

    std::string getLanguage() const;
    void setLanguage(const std::string& lang);

    bool getNotificationsEnabled() const;
    void setNotificationsEnabled(bool enabled);

    nlohmann::json toJson() const;
    void fromJson(const nlohmann::json& j);
    void fromJson(const std::string& jsonStr);  // فقط برای ورودی string

    static Settings defaultSettings();

private:
    bool darkMode;
    std::string language;
    bool notificationsEnabled;
};

#endif
