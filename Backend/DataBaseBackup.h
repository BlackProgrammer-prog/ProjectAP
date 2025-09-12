#ifndef BACKEND_DATABASEBACKUP_H
#define BACKEND_DATABASEBACKUP_H

#include <string>
#include <thread>
#include <atomic>
#include <chrono>
#include <utility>

class DatabaseBackup
{
public:
    explicit DatabaseBackup(std::string dbPath, std::string backupFolder, int intervalMinutes = 15)
        : dbPath(std::move(dbPath)),
          backupFolder(std::move(backupFolder)),
          intervalMinutes(intervalMinutes) {}

    ~DatabaseBackup()
    {
        stop();
    }

    // جلوگیری از کپی ناخواسته
    DatabaseBackup(const DatabaseBackup &) = delete;
    DatabaseBackup &operator=(const DatabaseBackup &) = delete;

    // اجازه جابجایی در صورت نیاز
    DatabaseBackup(DatabaseBackup &&) noexcept = default;
    DatabaseBackup &operator=(DatabaseBackup &&) noexcept = default;

    void start()
    {
        if (running.exchange(true))
            return; // اگر در حال اجراست دوباره استارت نکن
        worker = std::thread(&DatabaseBackup::backupLoop, this);
    }

    void stop()
    {
        if (!running.exchange(false))
            return; // اگر قبلاً متوقف شده، کاری نکن
        if (worker.joinable())
            worker.join();
    }

    void backupNow();

private:
    void backupLoop()
    {
        using namespace std::chrono_literals;
        while (running)
        {
            std::this_thread::sleep_for(std::chrono::minutes(intervalMinutes));
            if (running)
            {
                backupNow();
            }
        }
    }

    std::string dbPath;
    std::string backupFolder;
    int intervalMinutes;

    std::thread worker;
    std::atomic<bool> running{false};
};

#endif // BACKEND_DATABASEBACKUP_H
