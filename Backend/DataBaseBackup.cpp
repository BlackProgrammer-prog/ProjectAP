#include "DatabaseBackup.h"
#include <filesystem>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <ctime>
#include <iostream>

namespace fs = std::filesystem;

DatabaseBackup::DatabaseBackup(std::string dbPath, std::string backupFolder, int intervalMinutes)
    : dbPath(std::move(dbPath)),
      backupFolder(std::move(backupFolder)),
      intervalMinutes(intervalMinutes)
{
    try
    {
        if (!fs::exists(this->backupFolder))
        {
            fs::create_directories(this->backupFolder);
        }
    }
    catch (const std::exception &e)
    {
        std::cerr << "Failed to create backup directory: " << e.what() << std::endl;
        throw; // بهتره خطا propagate بشه تا برنامه بدونه بکاپ نمی‌تونه ذخیره بشه
    }
}

DatabaseBackup::~DatabaseBackup()
{
    stop();
}

void DatabaseBackup::start()
{
    if (running.exchange(true))
        return; // اگر قبلاً اجرا شده، دوباره اجرا نکن
    worker = std::thread(&DatabaseBackup::backupLoop, this);
}

void DatabaseBackup::stop()
{
    if (!running.exchange(false))
        return; // اگر قبلاً متوقف شده، کاری نکن
    if (worker.joinable())
    {
        worker.join();
    }
}

void DatabaseBackup::backupNow()
{
    try
    {
        auto now = std::chrono::system_clock::now();
        std::time_t t = std::chrono::system_clock::to_time_t(now);

        std::ostringstream oss;
        oss << std::put_time(std::localtime(&t), "%Y-%m-%d_%H-%M-%S");
        std::string filename = "backup_" + oss.str() + ".db";

        fs::path target = fs::path(backupFolder) / filename;
        fs::copy_file(dbPath, target, fs::copy_options::overwrite_existing);

        std::cout << "[INFO] Backup created: " << target << std::endl;
    }
    catch (const fs::filesystem_error &e)
    {
        std::cerr << "[ERROR] Filesystem error during backup: " << e.what() << std::endl;
    }
    catch (const std::exception &e)
    {
        std::cerr << "[ERROR] Backup failed: " << e.what() << std::endl;
    }
}

void DatabaseBackup::backupLoop()
{
    using namespace std::chrono_literals;
    while (running)
    {
        backupNow();
        for (int i = 0; i < intervalMinutes * 60 && running; ++i)
        {
            std::this_thread::sleep_for(1s); // چک هر ثانیه برای stop()
        }
    }
}
