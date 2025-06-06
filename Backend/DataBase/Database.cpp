//
// Created by afraa on 5/31/2025.
//

#include "Database.h"
#include "sqlite3.h"
#include <iostream>
#include "json.hpp"


using json = nlohmann::json;

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
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                profile_json TEXT NOT NULL,
                settings_json TEXT NOT NULL,
                custom_url TEXT UNIQUE NOT NULL,
                contacts_json TEXT
            );
        )";
        executeQueryInternal(sql);
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
                user.settings = json::object();
            }

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

[[maybe_unused]] DBUser Database::getUserByEmail(const std::string& email) {
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

bool Database::backupDatabase(const std::string& backupPath) {
    return false; // پیاده‌سازی در صورت نیاز
}

bool Database::restoreDatabase(const std::string& backupPath) {
    return false; // پیاده‌سازی در صورت نیاز
}

bool Database::userExistsByEmail(const std::string& email) {
    DBUser user = getUserByEmail(email);
    return !user.id.empty();
}

bool Database::userExistsByUsername(const std::string& username) {
    DBUser user = getUserByUsername(username);
    return !user.id.empty();
}