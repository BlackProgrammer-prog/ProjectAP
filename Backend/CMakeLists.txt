cmake_minimum_required(VERSION 3.20)
project(Backend)

set(CMAKE_CXX_STANDARD 20)

# ────────────────────────────────
# تنظیمات برای حل مشکل linker در Windows با MinGW
if(WIN32 AND MINGW)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wa,-mbig-obj")
    # حذف flag مشکل‌ساز
    # set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Wl,--large-address-aware")
endif()

# تنظیمات Build Type
set(CMAKE_BUILD_TYPE Release)
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -g1")
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O2 -DNDEBUG")

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
        ProfileManager.cpp
        ProfileManager.h
        FileManager.cpp
        FileManager.h
        HttpServer.cpp
        HttpServer.h
        GroupNotificationManager.cpp
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
# تنظیمات اضافی برای حل مشکل compile
if(WIN32 AND MINGW)
    target_compile_options(Backend PRIVATE -Wa,-mbig-obj)
    target_compile_options(DataBaseLib PRIVATE -Wa,-mbig-obj)
    target_compile_options(SocketLib PRIVATE -Wa,-mbig-obj)
endif()

# ────────────────────────────────
# اضافه کردن مسیرهای include برای کدهای داخلی
target_include_directories(Backend PRIVATE
        ${CMAKE_SOURCE_DIR}/library        # کتابخانه‌های header-only مثل json.hpp
        ${CMAKE_SOURCE_DIR}/Socket           # ماژول‌های jwt و WebSocketHandler
)