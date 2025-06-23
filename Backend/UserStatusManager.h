#pragma once
#include <string>
#include <unordered_map>
#include <set>
#include <mutex>
#include <ctime>

class UserStatusManager {
public:
    enum class Status { ONLINE, OFFLINE, AWAY, BUSY };

    void setStatus(const std::string& user_id, Status status);
    Status getStatus(const std::string& user_id);
    time_t getLastActive(const std::string& user_id);
    void updateLastActive(const std::string& user_id);
    std::set<std::string> getOnlineUsers();
    std::string statusToString(Status status) const;
    std::string timeToString(time_t t) const;

private:
    std::mutex mutex_;
    std::unordered_map<std::string, Status> status_map_;
    std::unordered_map<std::string, time_t> last_active_map_;
};