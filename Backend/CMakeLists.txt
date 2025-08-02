cmake_minimum_required(VERSION 3.20)
project(Backend)

set(CMAKE_CXX_STANDARD 20)

# ────────────────────────────────
# تنظیمات برای MinGW
if(WIN32 AND MINGW)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wa,-mbig-obj")
endif()

# ────────────────────────────────
# Build type
set(CMAKE_BUILD_TYPE Release)
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -g1")
set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} -O2 -DNDEBUG")

# ────────────────────────────────
# افزودن ماژول‌ها
add_subdirectory(DataBase)
add_subdirectory(Socket)

# ────────────────────────────────
# فایل اجرایی اصلی
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
# لینک به ماژول‌ها
target_link_libraries(Backend PRIVATE DataBaseLib SocketLib)

# ────────────────────────────────
# لینک به کتابخانه‌های خارجی
find_package(jwt-cpp CONFIG REQUIRED)
find_package(Boost REQUIRED COMPONENTS uuid system thread)

target_link_libraries(Backend PRIVATE
        jwt-cpp::jwt-cpp
        Boost::uuid
        Boost::system
        Boost::thread
)

if(WIN32)
    target_link_libraries(Backend PRIVATE ws2_32 mswsock)
endif()

# ────────────────────────────────
# تنظیمات اضافی برای جلوگیری از خطای big obj در MinGW
if(WIN32 AND MINGW)
    target_compile_options(Backend PRIVATE -Wa,-mbig-obj)
    target_compile_options(DataBaseLib PRIVATE -Wa,-mbig-obj)
    target_compile_options(SocketLib PRIVATE -Wa,-mbig-obj)
endif()

# ────────────────────────────────
# اضافه کردن مسیرهای include داخلی
target_include_directories(Backend PRIVATE
        ${CMAKE_SOURCE_DIR}/library
        ${CMAKE_SOURCE_DIR}/Socket
)