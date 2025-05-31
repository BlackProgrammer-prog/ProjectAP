//
// Created by afraa on 5/22/2025.
//

#ifndef PROGECTAP_CHAT_H
#define PROGECTAP_CHAT_H

#include <vector>
#include "User.h"
#include "Message.h"
#include "DataBase/Database.h"
#include <vector>
#include <string>

using namespace std;

class Chat {
private:
    Database& db;                 // شی دیتابیس
    std::vector<User> users;      // لیست کاربران
    std::vector<Message> messages;// لیست پیام‌ها
    User* currentUser = nullptr;  // کاربر فعلی (در صورت ورود)

public:
    Chat(Database& dbRef);
    ~Chat();

    bool registerUser(const std::string& name, const std::string& username, const std::string& password);
    bool login(const std::string& username, const std::string& password);
    void sendMessage(const std::string& content);
    vector<vector<string>> showAllMessages() const;
    void showRecentMessages(int n) const;
    string getNameApi(string &UserName)const;
};


#endif //PROGECTAP_CHAT_H
