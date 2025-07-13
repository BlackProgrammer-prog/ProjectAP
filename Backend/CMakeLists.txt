cmake_minimum_required(VERSION 3.20)
project(Backend)

set(CMAKE_CXX_STANDARD 20)

# ────────────────────────────────
# vcpkg toolchain (برای استفاده با vcpkg.json)
#set(CMAKE_TOOLCHAIN_FILE "${CMAKE_SOURCE_DIR}/vcpkg/scripts/buildsystems/vcpkg.cmake"
#        CACHE STRING "Vcpkg toolchain file")

# ────────────────────────────────
# افزودن ماژول دیتابیس
add_subdirectory(DataBase)
# ────────────────────────────────

add_subdirectory(Socket)
# تعریف فایل اجرایی اصلی
add_executable(Backend
        main.cpp
        login.cpp login.h
        UrlCreate.cpp UrlCreate.h
        sha256.cpp sha256.h
        Registration.cpp Registration.h
        profile.cpp profile.h
        Settings.h Settings.cpp
        user.h user.cpp
        Message.h Message.cpp
        UserStatusManager.h UserStatusManager.cpp

#        Socket/JwtAuth.cpp Socket/JwtAuth.h
#        Socket/WebSocketHandler.cpp Socket/WebSocketHandler.h
        PrivateChatManager.cpp
        PrivateChatManager.h
        SessionManager.cpp
        SessionManager.h
        ContactManager.cpp
        ContactManager.h
        NotificationManager.cpp
        NotificationManager.h
)

# ────────────────────────────────
# لینک کردن به ماژول دیتابیس
target_link_libraries(Backend PRIVATE DataBaseLib)

# ────────────────────────────────

target_link_libraries(Backend PRIVATE SocketLib)

# لینک به کتابخانه‌های نصب‌شده توسط vcpkg
find_package(jwt-cpp CONFIG REQUIRED)
#find_package(Boost REQUIRED)

find_package(Boost REQUIRED COMPONENTS uuid system thread)

target_link_libraries(Backend PRIVATE
        jwt-cpp::jwt-cpp
        Boost::uuid
        Boost::system
        Boost::thread
)

#target_link_libraries(Backend PRIVATE
#        jwt-cpp::jwt-cpp
#        Boost::boost
#)

if(WIN32)
    target_link_libraries(Backend PRIVATE ws2_32 mswsock)
endif()



# ────────────────────────────────
# اضافه کردن مسیرهای include برای کدهای داخلی
target_include_directories(Backend PRIVATE
        ${CMAKE_SOURCE_DIR}/library        # کتابخانه‌های header-only مثل json.hpp
        ${CMAKE_SOURCE_DIR}/Socket           # ماژول‌های jwt و WebSocketHandler
)
target_compile_options(Backend PRIVATE -Wa,-mbig-obj)