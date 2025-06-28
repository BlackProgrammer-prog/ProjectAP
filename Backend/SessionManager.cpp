//
// Created by HOME on 6/28/2025.
//

#include "SessionManager.h"
void SessionManager::addSession(const std::string& client_id,
                                const std::string& user_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    client_to_user_[client_id] = user_id;
    user_to_clients_[user_id].insert(client_id);
}

void SessionManager::removeSession(const std::string& client_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = client_to_user_.find(client_id);
    if (it != client_to_user_.end()) {
        user_to_clients_[it->second].erase(client_id);
        client_to_user_.erase(it);
    }
}

std::set<std::string> SessionManager::getClientIds(const std::string& user_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (user_to_clients_.count(user_id)) {
        return user_to_clients_[user_id];
    }
    return {};
}

std::string SessionManager::getUserId(const std::string& client_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (client_to_user_.count(client_id)) {
        return client_to_user_[client_id];
    }
    return "";
}