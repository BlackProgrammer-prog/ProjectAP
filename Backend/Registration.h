#ifndef REGISTRATION_H
#define REGISTRATION_H

#include "WebSocketHandler.h"
#include "Database.h"
#include "User.h"
#include "UrlCreate.h"
#include "sha256.h"
#include <functional>
#include <json.hpp>

using json = nlohmann::json;

class Registration {
public:
    Registration(std::shared_ptr<Database> db, WebSocketServer& server);
    void setupRoutes();

private:
    json handleRegistration(const json& data, const std::string& clientId);

    std::shared_ptr<Database> db_;
//    Database& db_;
    WebSocketServer& server_;
    UrlCreate urlCreator_;
};

#endif // REGISTRATION_H