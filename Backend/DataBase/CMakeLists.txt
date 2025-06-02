# ساخت کتابخانه دیتابیس به عنوان کتابخانه جدا
add_library(DataBaseLib
        Database.cpp
        ${CMAKE_SOURCE_DIR}/library/sqlite3.c
)

# افزودن مسیر هدرها برای دیتابیس و لایبرری‌ها
target_include_directories(DataBaseLib PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${CMAKE_SOURCE_DIR}/library
)