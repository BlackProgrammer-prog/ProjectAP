//
// Created by HOME on 6/28/2025.
//

#ifndef BACKEND_SESSIONMANAGER_H
#define BACKEND_SESSIONMANAGER_H

#include <string>
#include <unordered_map>
#include <set>
#include <mutex>

class SessionManager {
public:
    void addSession(const std::string& client_id,
                    const std::string& user_id);
    void removeSession(const std::string& client_id);
    std::set<std::string> getClientIds(const std::string& user_id);
    std::string getUserId(const std::string& client_id);

private:
    std::mutex mutex_;
    std::unordered_map<std::string, std::string> client_to_user_;
    std::unordered_map<std::string, std::set<std::string>> user_to_clients_;
};


#endif //BACKEND_SESSIONMANAGER_H
