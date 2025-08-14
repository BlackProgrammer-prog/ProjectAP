#include "UserStatusManager.h"
#include <ctime>
#include <iomanip>
#include <sstream>


void UserStatusManager::setStatus(const std::string& user_id, Status status) {
    std::lock_guard<std::mutex> lock(mutex_);
    status_map_.insert_or_assign(user_id, status);
    last_active_map_.insert_or_assign(user_id, std::time(nullptr));
}

UserStatusManager::Status UserStatusManager::getStatus(const std::string& user_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (status_map_.count(user_id) > 0) {
        return status_map_.at(user_id);
    }
    return Status::OFFLINE;
}

time_t UserStatusManager::getLastActive(const std::string& user_id) {
    std::lock_guard<std::mutex> lock(mutex_);

    if (last_active_map_.count(user_id) > 0) {
        return last_active_map_.at(user_id);
    }
    // If we don't have a record yet but status says ONLINE, treat "last active" as now
    if (status_map_.count(user_id) > 0 && status_map_.at(user_id) == Status::ONLINE) {
        time_t now = std::time(nullptr);
        last_active_map_.insert_or_assign(user_id, now);
        return now;
    }
    return 0;
}

void UserStatusManager::updateLastActive(const std::string& user_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    last_active_map_.insert_or_assign(user_id, std::time(nullptr));
}

std::set<std::string> UserStatusManager::getOnlineUsers() {
    std::lock_guard<std::mutex> lock(mutex_);

    std::set<std::string> online_users;
    for (const auto& pair : status_map_) {
        if (pair.second == Status::ONLINE) {
            online_users.insert(pair.first);
        }
    }
    return online_users;
}

std::string UserStatusManager::statusToString(Status status) const {
    switch (status) {
        case Status::ONLINE:
            return "ONLINE";
        case Status::OFFLINE:
            return "OFFLINE";
        case Status::AWAY:
            return "AWAY";
        case Status::BUSY:
            return "BUSY";
        default:
            return "UNKNOWN";
    }
}


std::string UserStatusManager::timeToString(time_t t) const {
    std::ostringstream oss;
    std::tm tm_struct{};

#ifdef _WIN32
    // Windows uses localtime_s
    localtime_s(&tm_struct, &t);
#else
    // POSIX systems (Linux, macOS) use localtime_r
    localtime_r(&t, &tm_struct);
#endif

    oss << std::put_time(&tm_struct, "%Y-%m-%d %H:%M:%S");
    return oss.str();
}