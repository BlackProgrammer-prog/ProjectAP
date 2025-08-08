#ifndef DS_STORE_GROUPMANAGER_H
#define DS_STORE_GROUPMANAGER_H

#include <string>
#include <vector>

class GroupManager {
public:
    void createGroup(const std::string& groupName,
                     const std::string& description,
                     const std::vector<std::string>& members);

    void deleteGroup(const std::string& groupName);

    void addMember(const std::string& groupName, const std::string& member);

    void removeMember(const std::string& groupName, const std::string& member);

    std::vector<std::string> getGroup(const std::string& groupName);

    std::vector<std::string> listGroups();
};

#endif