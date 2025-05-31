//
// Created by afraa on 5/22/2025.
//

#ifndef PROGECTAP_USER_H
#define PROGECTAP_USER_H

#include <string>
#include "DataBase/Database.h"

using namespace std;

class User {
private:
    string name; //نام واقعی کاربر
    string username; // نام کاربری کاربر
    string Password; // رمز عبور کاربر
public:
    User(const string& name, const string& username, const string& password);
    string getName() const;
    string getUsername() const;
    string getPassword() const;
    static void createTable(Database& db);
};


#endif //PROGECTAP_USER_H
