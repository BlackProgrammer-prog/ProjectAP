//
// Created by afraa on 6/3/2025.
//
#include <iostream>
#include <memory>
#include <thread>
#include <chrono>
#include "WebSocketHandler.h"
#include "Database.h"
#include "JwtAuth.h"
#include "Registration.h"
#include "Login.h"

int main() {
    // تنظیمات اولیه
    const std::string DB_PATH = "app_database.db";
    const int WS_PORT = 8080;
    const std::string JWT_SECRET = "your_strong_jwt_secret_here";

    try {
        // اتصال به دیتابیس
        Database db(DB_PATH);

        // راه‌اندازی احراز هویت JWT
        auto jwtAuth = JwtAuth::create(JWT_SECRET);
        if (!jwtAuth) {
            std::cerr << "خطا در ایجاد سرویس احراز هویت" << std::endl;
            return 1;
        }

        // راه‌اندازی سرور WebSocket (با توجه به سازنده جدید)
        WebSocketServer server(WS_PORT, JWT_SECRET);

        // ثبت هندلرهای ثبت‌نام و ورود
        Registration registrationHandler(db, server);
        registrationHandler.setupRoutes();

        Login loginHandler(db, server, jwtAuth);
        loginHandler.setupRoutes();

        // شروع سرور
        server.start();
        std::cout << "سرور WebSocket روی پورت " << WS_PORT << " راه‌اندازی شد" << std::endl;

        // نگه‌داشتن برنامه در حالت اجرا
        while (true) {
            std::this_thread::sleep_for(std::chrono::hours(1));
        }
    } catch (const std::exception& e) {
        std::cerr << "خطای بحرانی: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}