#include "Database.h"
#include "sqlite3.h"
#include <iostream>
#include <sstream>
#include <stdexcept>

struct Database::Impl {
    sqlite3* db;

    Impl(const std::string& dbPath) {
        if (sqlite3_open(dbPath.c_str(), &db) != SQLITE_OK) {
            std::cerr << "Cannot open database: " << sqlite3_errmsg(db) << std::endl;
        }
        initializeDatabase();
    }

    ~Impl() {
        if (db) sqlite3_close(db);
    }

    void initializeDatabase() {
        const char* sql = R"(
            PRAGMA foreign_keys = ON;
            
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                profile_json TEXT NOT NULL,
                settings_json TEXT NOT NULL,
                custom_url TEXT UNIQUE NOT NULL,
                contacts_json TEXT,
                open_chats_json TEXT
            );
            
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                contact_user_id TEXT NOT NULL,
                added_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, contact_user_id)
            );
            
            -- Blocks table
            CREATE TABLE IF NOT EXISTS blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                blocked_user_id TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, blocked_user_id)
            );
            
            CREATE TABLE IF NOT EXISTS private_messages (
                id TEXT PRIMARY KEY,
                sender_id TEXT NOT NULL,
                receiver_id TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                delivered INTEGER DEFAULT 0,
                read INTEGER DEFAULT 0,
                deleted INTEGER DEFAULT 0,
                edited_timestamp INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_msg_sender ON private_messages(sender_id);
            CREATE INDEX IF NOT EXISTS idx_msg_receiver ON private_messages(receiver_id);
            CREATE INDEX IF NOT EXISTS idx_msg_timestamp ON private_messages(timestamp);

            CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts
            USING fts5(sender_id, receiver_id, content);
            
            CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts 
            USING fts5(sender_id, receiver_id, content);

            -- Groups core tables
            CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                creator_id TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                custom_url TEXT UNIQUE NOT NULL,
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS group_members (
                group_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                joined_at INTEGER NOT NULL,
                PRIMARY KEY (group_id, user_id),
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS group_messages (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL,
                sender_id TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                edited_timestamp INTEGER DEFAULT 0,
                deleted INTEGER DEFAULT 0,
                pinned INTEGER DEFAULT 0,
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS group_message_logs (
                id TEXT PRIMARY KEY,
                message_id TEXT NOT NULL,
                group_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (message_id) REFERENCES group_messages(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_group_members_gid ON group_members(group_id);
            CREATE INDEX IF NOT EXISTS idx_group_messages_gid_ts ON group_messages(group_id, timestamp);
        )";
        executeQueryInternal(sql);

        // Migrations / compatibility adjustments (idempotent best-effort)
        // 1) Ensure groups.custom_url exists and is populated with id
        {
            char* errMsg = nullptr;
            sqlite3_exec(db, "ALTER TABLE groups ADD COLUMN custom_url TEXT", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            sqlite3_exec(db, "UPDATE groups SET custom_url = id WHERE custom_url IS NULL OR custom_url = ''", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            sqlite3_exec(db, "CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_custom_url ON groups(custom_url)", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
        }

        // 2) Normalize group_messages schema in case of legacy (few-column) tables
        // Add missing columns if they don't exist; ignore errors if already exist
        {
            char* errMsg = nullptr;
            sqlite3_exec(db, "ALTER TABLE group_messages ADD COLUMN edited_timestamp INTEGER DEFAULT 0", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            sqlite3_exec(db, "ALTER TABLE group_messages ADD COLUMN deleted INTEGER DEFAULT 0", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            sqlite3_exec(db, "ALTER TABLE group_messages ADD COLUMN pinned INTEGER DEFAULT 0", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            // Ensure timestamp column exists; if a legacy table lacks it, attempt to add with default 0
            sqlite3_exec(db, "ALTER TABLE group_messages ADD COLUMN timestamp INTEGER DEFAULT 0", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            // Drop any legacy tables with incorrect casing or schema (best-effort)
            sqlite3_exec(db, "DROP TABLE IF EXISTS Group_messages", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            sqlite3_exec(db, "DROP TABLE IF EXISTS group_message", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            sqlite3_exec(db, "DROP TABLE IF EXISTS Group_message", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            sqlite3_exec(db, "DROP TABLE IF EXISTS GROUP_MESSAGES", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
            sqlite3_exec(db, "DROP TABLE IF EXISTS GROUP_MESSAGE", nullptr, nullptr, &errMsg);
            if (errMsg) sqlite3_free(errMsg);
        }

        // Try to add 'online' column if it doesn't exist (ignore error if already exists)
        // Add online column if missing (ignore error if exists)
        char* errMsg = nullptr;
        std::string add_online_col = "ALTER TABLE users ADD COLUMN online INTEGER DEFAULT 0";
        sqlite3_exec(db, add_online_col.c_str(), nullptr, nullptr, &errMsg);
        if (errMsg) {
            // Suppress duplicate column error
            std::string err = errMsg;
            sqlite3_free(errMsg);
        }

        // Try to add 'open_chats_json' column if it doesn't exist (ignore error if exists)
        errMsg = nullptr;
        std::string add_open_chats_col = "ALTER TABLE users ADD COLUMN open_chats_json TEXT DEFAULT '[]'";
        sqlite3_exec(db, add_open_chats_col.c_str(), nullptr, nullptr, &errMsg);
        if (errMsg) {
            std::string err2 = errMsg;
            sqlite3_free(errMsg);
        }
    }

    bool executeQueryInternal(const std::string& sql) {
        char* errMsg = nullptr;
        if (sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &errMsg) != SQLITE_OK) {
            std::cerr << "SQL error: " << errMsg << std::endl;
            sqlite3_free(errMsg);
            return false;
        }
        return true;
    }

    DBUser getUser(const std::string& field, const std::string& value) {
        DBUser user;
        std::string sql = "SELECT * FROM users WHERE " + field + " = ? LIMIT 1";

        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK)
            return user;

        sqlite3_bind_text(stmt, 1, value.c_str(), -1, SQLITE_TRANSIENT);

        if (sqlite3_step(stmt) == SQLITE_ROW) {
            const auto get_safe = [](sqlite3_stmt* s, int i) -> std::string {
                const char* val = reinterpret_cast<const char*>(sqlite3_column_text(s, i));
                return val ? val : "";
            };

            user.id = get_safe(stmt, 0);
            user.email = get_safe(stmt, 1);
            user.username = get_safe(stmt, 2);
            user.passwordHash = get_safe(stmt, 3);
            user.customUrl = get_safe(stmt, 6);

            try {
                user.profile = json::parse(get_safe(stmt, 4));
            } catch (...) {
                user.profile = json::object();
            }

            try {
                user.settings = json::parse(get_safe(stmt, 5));
            } catch (...) {
                user.settings = json::object();}

            try {
                user.contacts = json::parse(get_safe(stmt, 7));
            } catch (...) {
                user.contacts = json::object();
            }
        }

        sqlite3_finalize(stmt);
        return user;
    }
};

// Implementations
Database::Database(const std::string& databasePath)
        : pImpl(std::make_unique<Impl>(databasePath)) {}

Database::~Database() = default;

bool Database::createUser(const std::string& email,
                          const std::string& username,
                          const std::string& passwordHash,
                          const json& profile,
                          const json& settings,
                          const std::string& customUrl) {
    std::string userId = std::to_string(std::hash<std::string>{}(email + username));
    std::string sql = R"(
        INSERT INTO users
        (id, email, username, password_hash, profile_json, settings_json, custom_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    )";
    std::vector<std::string> params = {
            userId, email, username, passwordHash,
            profile.dump(), settings.dump(), customUrl
    };
    return executeQueryWithParams(sql, params).success;
}


DBUser Database::getUserById(const std::string& userId) {
    return pImpl->getUser("id", userId);
}

DBUser Database::getUserByUsername(const std::string& username) {
    return pImpl->getUser("username", username);
}

DBUser Database::getUserByEmail(const std::string& email) {
    return pImpl->getUser("email", email);
}

bool Database::updateUser(const DBUser& user) {
    std::string sql = R"(
        UPDATE users SET
        email = ?,
        username = ?,
        password_hash = ?,
        profile_json = ?,
        settings_json = ?,
        custom_url = ?,
        contacts_json = ?
        WHERE id = ?
    )";
    std::vector<std::string> params = {
            user.email,
            user.username,
            user.passwordHash,
            user.profile.dump(),
            user.settings.dump(),
            user.customUrl,
            user.contacts.dump(),
            user.id
    };
    return executeQueryWithParams(sql, params).success;
}

bool Database::deleteUser(const std::string& userId) {
    return executeQueryWithParams("DELETE FROM users WHERE id = ?", {userId}).success;
}

QueryResult Database::executeQuery(const std::string& query) {
    QueryResult result;
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(pImpl->db, query.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
        result.message = sqlite3_errmsg(pImpl->db);
        return result;
    }
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        int colCount = sqlite3_column_count(stmt);
        for (int i = 0; i < colCount; ++i) {
            const char* val = reinterpret_cast<const char*>(sqlite3_column_text(stmt, i));
            result.data.push_back(val ? val : "");
        }
    }
    sqlite3_finalize(stmt);
    result.success = true;
    return result;
}

QueryResult Database::executeQueryWithParams(const std::string& query, const std::vector<std::string>& params) {
    QueryResult result;
    sqlite3_stmt* stmt;
    if (sqlite3_prepare_v2(pImpl->db, query.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
        result.message = sqlite3_errmsg(pImpl->db);
        return result;
    }
    for (size_t i = 0; i < params.size(); ++i) {
        sqlite3_bind_text(stmt, static_cast<int>(i + 1), params[i].c_str(), -1, SQLITE_TRANSIENT);
    }
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        int colCount = sqlite3_column_count(stmt);
        for (int i = 0; i < colCount; ++i) {
            const char* val = reinterpret_cast<const char*>(sqlite3_column_text(stmt, i));
            result.data.push_back(val ? val : "");
        }
    }
    sqlite3_finalize(stmt);
    result.success = true;
    return result;
}

//bool Database::backupDatabase(const std::string& backupPath) {
//    return false;
//}
//
//bool Database::restoreDatabase(const std::string& backupPath) {
//    return false;
//}

bool Database::userExistsByEmail(const std::string& email) {
    DBUser user = getUserByEmail(email);
    return !user.id.empty();
}

bool Database::userExistsByUsername(const std::string& username) {
    DBUser user = getUserByUsername(username);
    return !user.id.empty();
}

// Contact methods
bool Database::addContact(const std::string& user_id, const std::string& contact_email) {
    DBUser contact = getUserByEmail(contact_email);
    if(contact.id.empty()) return false;

    std::string sql = R"(
        INSERT INTO contacts (user_id, contact_user_id, added_at)
        VALUES (?, ?, ?)
    )";

    return executeQueryWithParams(sql, {
            user_id,
            contact.id,
            std::to_string(std::time(nullptr))
    }).success;
}

bool Database::removeContact(const std::string& user_id, const std::string& contact_email) {
    DBUser contact = getUserByEmail(contact_email);
    if(contact.id.empty()) return false;

    std::string sql = "DELETE FROM contacts WHERE user_id = ? AND contact_user_id = ?";
    return executeQueryWithParams(sql, {user_id, contact.id}).success;
}

std::vector<std::string> Database::getContacts(const std::string& user_id) {
    std::vector<std::string> contacts;
    std::string sql = R"(
        SELECT u.email
        FROM contacts c
        JOIN users u ON c.contact_user_id = u.id
        WHERE c.user_id = ?
    )";

    auto result = executeQueryWithParams(sql, {user_id});
    for(size_t i = 0; i < result.data.size(); i++) {
        contacts.push_back(result.data[i]);
    }
    return contacts;
}

// Message methods
bool Database::storeMessage(const std::string& id,
                            const std::string& sender_id,
                            const std::string& receiver_id,
                            const std::string& content,
                            time_t timestamp,
                            bool delivered,
                            bool read) {
    std::string sql = R"(
        INSERT INTO private_messages
        (id, sender_id, receiver_id, content, timestamp, delivered, read)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    )";

    return executeQueryWithParams(sql, {
            id,
            sender_id,
            receiver_id,
            content,
            std::to_string(timestamp > 0 ? timestamp : std::time(nullptr)),
            delivered ? "1" : "0",
            read ? "1" : "0"
    }).success;
}

std::vector<std::vector<std::string>> Database::getMessagesBetweenUsers(
        const std::string& user1,
        const std::string& user2,
        int limit
) {
    std::vector<std::vector<std::string>> messages;
    std::string sql = R"(
        SELECT id, sender_id, receiver_id, content,
               COALESCE(timestamp, 0), COALESCE(delivered, 0), COALESCE(read, 0)
        FROM private_messages
        WHERE (sender_id = ? AND receiver_id = ?)
        OR (sender_id = ? AND receiver_id = ?)
        ORDER BY timestamp DESC
        LIMIT ?
    )";

    auto result = executeQueryWithParams(sql, {
            user1, user2, user2, user1, std::to_string(limit)
    });

    // Group results into rows of 7 columns
    for(size_t i = 0; i < result.data.size(); i += 7) {
        std::vector<std::string> row;
        for(int j = 0; j < 7; j++) {
            if(i+j < result.data.size()) {
                row.push_back(result.data[i+j]);
            }
        }
        messages.push_back(row);
    }
    return messages;
}
json Database::getPublicUserProfile(const std::string& email) {
    DBUser user = getUserByEmail(email);
    if (user.id.empty()) {
        return nullptr;
    }

    // Start with the existing profile data from the database
    json publicProfile = user.profile;

    // Ensure the main fields are present
    publicProfile["email"] = user.email;
    publicProfile["username"] = user.username;
    publicProfile["customUrl"] = user.customUrl;

    return publicProfile;
}

std::vector<DBUser> Database::searchUsers(const std::string& query) {
    std::vector<DBUser> users;
    std::string sql = "SELECT * FROM users WHERE username LIKE ? OR email LIKE ? LIMIT 10";
    
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(pImpl->db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
        return users;
    }
    
    std::string searchQuery = "%" + query + "%";
    sqlite3_bind_text(stmt, 1, searchQuery.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, searchQuery.c_str(), -1, SQLITE_TRANSIENT);
    
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        DBUser user;
        const auto get_safe = [](sqlite3_stmt* s, int i) -> std::string {
            const char* val = reinterpret_cast<const char*>(sqlite3_column_text(s, i));
            return val ? val : "";
        };

        user.id = get_safe(stmt, 0);
        user.email = get_safe(stmt, 1);
        user.username = get_safe(stmt, 2);
        // We don't need to load other fields for search results
        users.push_back(user);
    }
    
    sqlite3_finalize(stmt);
    return users;
}

bool Database::setUserOnlineStatus(const std::string& userId, bool online) {
    std::string sql = "UPDATE users SET online = ? WHERE id = ?";
    auto result = executeQueryWithParams(sql, { online ? "1" : "0", userId });
    if (result.success && sqlite3_changes(pImpl->db) > 0) {
        std::cout << "Updated online status for user " << userId << " to " << (online ? 1 : 0) << std::endl;
        return true;
    } else {
        std::cout << "Failed to update online status for user " << userId << ": No rows affected" << std::endl;
        return false;
    }
}

bool Database::setAllUsersOffline() {
    std::string sql = "UPDATE users SET online = 0";
    auto result = executeQuery(sql);
    return result.success;
}

json Database::getOpenChats(const std::string& userId) {
    std::string sql = "SELECT open_chats_json FROM users WHERE id = ?";
    auto result = executeQueryWithParams(sql, {userId});
    if (result.success && !result.data.empty()) {
        try {
            return json::parse(result.data[0].empty() ? "[]" : result.data[0]);
        } catch(...) {
            return json::array();
        }
    }
    return json::array();
}

bool Database::setOpenChats(const std::string& userId, const json& openChats) {
    std::string sql = "UPDATE users SET open_chats_json = ? WHERE id = ?";
    auto result = executeQueryWithParams(sql, {openChats.dump(), userId});
    return result.success;
}

int Database::getOnlineStatusByEmail(const std::string& email) {
    std::string sql = "SELECT online FROM users WHERE email = ?";
    auto result = executeQueryWithParams(sql, {email});
    if (result.success && !result.data.empty()) {
        return std::stoi(result.data[0]);
    }
    return 0;
}

bool Database::addBlock(const std::string& userId, const std::string& blockedUserId) {
    std::string sql = R"(
        INSERT OR IGNORE INTO blocks (user_id, blocked_user_id, created_at)
        VALUES (?, ?, ?)
    )";
    auto result = executeQueryWithParams(sql, {userId, blockedUserId, std::to_string(std::time(nullptr))});
    return result.success;
}

bool Database::isBlocked(const std::string& userId, const std::string& blockedUserId) {
    std::string sql = R"(
        SELECT COUNT(1)
        FROM blocks
        WHERE user_id = ? AND blocked_user_id = ?
    )";
    auto result = executeQueryWithParams(sql, {userId, blockedUserId});
    if (result.success && !result.data.empty()) {
        return std::stoi(result.data[0]) > 0;
    }
    return false;
}

int Database::getUnreadCountForUser(const std::string& userId) {
    std::string sql = R"(
        SELECT COUNT(1)
        FROM private_messages
        WHERE receiver_id = ? AND read = 0 AND deleted = 0
    )";
    auto result = executeQueryWithParams(sql, {userId});
    if (result.success && !result.data.empty()) {
        return std::stoi(result.data[0]);
    }
    return 0;
}

