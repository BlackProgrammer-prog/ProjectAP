#ifndef GROUPMANAGER_GROUPMANAGER_H
#define GROUPMANAGER_GROUPMANAGER_H

#include <string>
#include <vector>
#include <memory>
#include <ctime>
#include "DataBase/Database.h"

struct Group {
    std::string id;
    std::string name;
    std::string creator_id;
    time_t created_at;
    std::vector<std::string> members;
};

class GroupManager {
public:
    explicit GroupManager(std::shared_ptr<Database> db);

    Group createGroup(const std::string& name, const std::string& creator_id, const std::vector<std::string>& members);
    bool deleteGroup(const std::string& group_id);
    bool addMember(const std::string& group_id, const std::string& user_id);
    bool removeMember(const std::string& group_id, const std::string& user_id);
    Group getGroup(const std::string& group_id);
    bool isMember(const std::string& group_id, const std::string& user_id);
    std::vector<Group> getUserGroups(const std::string& user_id);

private:
    std::shared_ptr<Database> db_;
};

#endif //GROUPMANAGER_GROUPMANAGER_H
