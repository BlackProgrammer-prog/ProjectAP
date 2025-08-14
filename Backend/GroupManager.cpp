#include "GroupManager.hpp"
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <ctime>

GroupManager::GroupManager(std::shared_ptr<Database> db)
        : db_(std::move(db)) {}

Group GroupManager::createGroup(const std::string& name,
                                const std::string& creator_id,
                                const std::vector<std::string>& members) {
    Group group{
            boost::uuids::to_string(boost::uuids::random_generator()()),
            name,
            creator_id,
            std::time(nullptr),
            members
    };

    group.members.push_back(creator_id); // افزودن سازنده به اعضا

    // ذخیره گروه
    db_->executeQueryWithParams(
            "INSERT INTO groups (id, name, creator_id, created_at) VALUES (?, ?, ?, ?)",
            {group.id, group.name, group.creator_id, std::to_string(group.created_at)}
    );

    // ذخیره اعضا
    const std::string member_sql =
            "INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)";
    for (const auto& member : group.members) {
        db_->executeQueryWithParams(member_sql, {
                group.id, member, std::to_string(group.created_at)
        });
    }
    return group;
}

bool GroupManager::deleteGroup(const std::string& group_id) {
    return db_->executeQueryWithParams("DELETE FROM groups WHERE id = ?", {group_id}).success;
}

bool GroupManager::addMember(const std::string& group_id, const std::string& user_id) {
    return db_->executeQueryWithParams(
            "INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)",
            {group_id, user_id, std::to_string(std::time(nullptr))}
    ).success;
}

bool GroupManager::removeMember(const std::string& group_id, const std::string& user_id) {
    return db_->executeQueryWithParams(
            "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
            {group_id, user_id}
    ).success;
}

Group GroupManager::getGroup(const std::string& group_id) {
    Group group;
    auto result = db_->executeQueryWithParams(
            "SELECT id, name, creator_id, created_at FROM groups WHERE id = ?", {group_id}
    );

    if (result.data.size() >= 4) {
        group.id = result.data[0];
        group.name = result.data[1];
        group.creator_id = result.data[2];
        group.created_at = std::stol(result.data[3]);

        auto members_result = db_->executeQueryWithParams(
                "SELECT user_id FROM group_members WHERE group_id = ?", {group_id}
        );
        for (const auto& user_id : members_result.data) {
            group.members.push_back(user_id);
        }
    }
    return group;
}

bool GroupManager::isMember(const std::string& group_id, const std::string& user_id) {
    auto result = db_->executeQueryWithParams(
            "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?",
            {group_id, user_id}
    );
    return !result.data.empty();
}

std::vector<Group> GroupManager::getUserGroups(const std::string& user_id) {
    std::vector<Group> groups;
    auto result = db_->executeQueryWithParams(R"(
        SELECT g.id, g.name, g.creator_id, g.created_at
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
    )", {user_id});

    for (size_t i = 0; i + 3 < result.data.size(); i += 4) {
        Group group{
                result.data[i],
                result.data[i+1],
                result.data[i+2],
                std::stol(result.data[i+3]),
                {}
        };

        auto members_result = db_->executeQueryWithParams(
                "SELECT user_id FROM group_members WHERE group_id = ?", {group.id}
        );
        for (const auto& member : members_result.data) {
            group.members.push_back(member);
        }

        groups.push_back(std::move(group));
    }
    return groups;
}