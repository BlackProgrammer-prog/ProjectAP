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
#include "ContactManager.h"
#include "UserStatusManager.h"
#include "SessionManager.h"
#include "PrivateChatManager.h"
#include "NotificationManager.h"
#include "ProfileManager.h"
#include "HttpServer.h"
#include <filesystem>

int main() {
    // تنظیمات اولیه
    // Use the database file in Backend directory to match runtime data
    const std::string DB_PATH = "C:/Users/HOME/Desktop/ProjectAP/ProjectAP/Database/app_database.db";
    const int WS_PORT = 8081;
    const int HTTP_PORT = 8080;
    const std::string JWT_SECRET = "your_strong_jwt_secret_here";
    // Serve static files from the project source root regardless of working directory
    const std::string DOC_ROOT = std::filesystem::path(__FILE__).parent_path().string();

    try {
        // 1. اتصال به دیتابیس
        auto db = std::make_shared<Database>(DB_PATH);

        // 2. راه‌اندازی سرویس‌های اصلی
        auto jwtAuth = JwtAuth::create(JWT_SECRET);
        if (!jwtAuth) {
            std::cerr << "خطا در ایجاد سرویس احراز هویت" << std::endl;
            return 1;
        }

        // 3. ایجاد ماژول‌های مدیریتی
        auto session_manager = std::make_shared<SessionManager>();
        auto status_manager = std::make_shared<UserStatusManager>();
        auto contact_manager = std::make_shared<ContactManager>(db);
        auto chat_manager = std::make_shared<PrivateChatManager>(db);
        
        // 4. راه‌اندازی سرور WebSocket با وابستگی‌های جدید
        WebSocketServer server(
            WS_PORT,
            JWT_SECRET,
            contact_manager,
            status_manager,
            session_manager
        );

        auto profile_manager = std::make_shared<ProfileManager>(db, server, jwtAuth);

        // 5. تنظیم chat_manager برای سرور
        server.setChatManager(chat_manager);
        server.setProfileManager(profile_manager);


        // 6. ایجاد و تنظیم NotificationManager
        auto notification_manager = std::make_shared<NotificationManager>(
                server,
            session_manager,
            chat_manager
        );

        // 7. ثبت هندلرهای اصلی
        Registration registrationHandler(db, server);
        registrationHandler.setupRoutes();

        Login loginHandler(db, server, jwtAuth);
        loginHandler.setupRoutes();

        profile_manager->setupRoutes();


        // 8. تنظیم هندلرهای چت و مخاطبین
        server.setupHandlers(); // این متد تمام هندلرهای چت را ثبت می‌کند

        // 9. راه‌اندازی سرور HTTP برای فایل‌های استاتیک
        HttpServer http_server(HTTP_PORT, DOC_ROOT);
        http_server.run();
        std::cout << "سرور HTTP برای فایل‌های استاتیک روی پورت " << HTTP_PORT << " راه‌اندازی شد" << std::endl;

        // 10. شروع سرور وب‌سوکت
        server.start();
        std::cout << "سرور چت روی پورت " << WS_PORT << " راه‌اندازی شد" << std::endl;
        
        // 11. نگه‌داشتن برنامه در حالت اجرا
        while (true) {
            std::this_thread::sleep_for(std::chrono::hours(1));
        }
    } catch (const std::exception& e) {
        std::cerr << "خطای بحرانی: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}
