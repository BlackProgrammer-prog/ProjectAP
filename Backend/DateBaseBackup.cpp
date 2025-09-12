//
// Created by HOME on 9/10/2025.
//

#include "DateBaseBackup.h"
#include <filesystem>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <ctime>
#include <iostream>

namespace fs = std::filesystem;

DateBaseBackup::DateBaseBackup(const std::string& dbPath, const std::string& backupFolder, int intervalMinutes)
        : dbPath(dbPath), backupFolder(backupFolder), intervalMinutes(intervalMinutes) {
    if (!fs::exists(backupFolder)) {
        fs::create_directories(backupFolder);
    }
}

DateBaseBackup::~DateBaseBackup() {
    stop();
}

void DateBaseBackup::start() {
    running = true;
    worker = std::thread(&DateBaseBackup::backupLoop, this);
}

void DateBaseBackup::stop() {
    running = false;
    if (worker.joinable()) {
        worker.join();
    }
}

void DateBaseBackup::backupNow() {
    try {
        auto t = std::time(nullptr);
        std::ostringstream oss;
        oss << std::put_time(std::localtime(&t), "%Y-%m-%d_%H-%M-%S");
        std::string filename = "backup_" + oss.str() + ".db";

        fs::path target = fs::path(backupFolder) / filename;
        fs::copy_file(dbPath, target, fs::copy_options::overwrite_existing);

        std::cout << "Backup created: " << target << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Backup failed: " << e.what() << std::endl;
    }
}

void DateBaseBackup::backupLoop() {
    while (running) {
        backupNow();
        std::this_thread::sleep_for(std::chrono::minutes(intervalMinutes));
    }
}