

#ifndef BACKEND_DATEBASEBACKUP_H
#define BACKEND_DATEBASEBACKUP_H

#include <string>
#include <thread>
#include <atomic>

class DateBaseBackup
{

public:
    DateBaseBackup(const std::string &dbPath, const std::string &backupFolder, int intervalMinutes = 15);
    ~DateBaseBackup();

    void start();
    void stop();
    void backupNow();

private:
    void backupLoop();

    std::string dbPath;
    std::string backupFolder;
    int intervalMinutes;

    std::thread worker;
    std::atomic<bool> running{false};
};

#endif // BACKEND_DATEBASEBACKUP_H
