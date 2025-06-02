cmake_minimum_required(VERSION 3.20)
project(Backend)

set(CMAKE_CXX_STANDARD 20)

# ────────────────────────────────
# vcpkg toolchain (برای استفاده با vcpkg.json)
set(CMAKE_TOOLCHAIN_FILE "${CMAKE_SOURCE_DIR}/vcpkg/scripts/buildsystems/vcpkg.cmake"
        CACHE STRING "Vcpkg toolchain file")

# ────────────────────────────────
# افزودن ماژول دیتابیس
add_subdirectory(DataBase)

# ────────────────────────────────
# تعریف فایل اجرایی اصلی
add_executable(BackendApp
        main.cpp
        login.cpp login.h
        User.cpp User.h

        Socket/JwtAuth.cpp Socket/JwtAuth.h
        Socket/WebSocketHandler.cpp Socket/WebSocketHandler.h
)

# ────────────────────────────────
# لینک کردن به ماژول دیتابیس
target_link_libraries(BackendApp PRIVATE DataBaseLib)

# ────────────────────────────────
# لینک به کتابخانه‌های نصب‌شده توسط vcpkg
find_package(jwt-cpp CONFIG REQUIRED)
find_package(Boost REQUIRED)

target_link_libraries(BackendApp PRIVATE
        jwt-cpp::jwt-cpp
        Boost::boost
)

# ────────────────────────────────
# اضافه کردن مسیرهای include برای کدهای داخلی
target_include_directories(BackendApp PRIVATE
        ${CMAKE_SOURCE_DIR}/library        # کتابخانه‌های header-only مثل json.hpp
        ${CMAKE_SOURCE_DIR}/Socket           # ماژول‌های jwt و WebSocketHandler
)