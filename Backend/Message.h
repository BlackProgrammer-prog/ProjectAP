//
// Created by afraa on 5/22/2025.
//

#ifndef PROGECTAP_MESSAGE_H
#define PROGECTAP_MESSAGE_H

#include <string>
#include <chrono>
#include "User.h"
#include "Database.h"

using namespace std;


class Message {
private:
    string content; //متن پیام
    chrono::system_clock::time_point timestamp; // ساعت ارسال پیام
    User sender; // فرستنده پیام
public:
    Message( const string& content , const User& sender);
    const string& getContent() const;
    const User& getSender() const;
    const std::chrono::system_clock::time_point& getTimestamp() const;
    void display() const;
    void saveToDatabase(Database& db) const;
    static void createTable(Database& db);
};


#endif //PROGECTAP_MESSAGE_H
