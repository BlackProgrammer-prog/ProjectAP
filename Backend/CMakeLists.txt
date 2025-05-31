cmake_minimum_required(VERSION 3.30)
project(Backend)

set(CMAKE_CXX_STANDARD 20)

# اضافه کردن زیرپوشه دیتابیس
add_subdirectory(DataBase)

# تعریف executable اصلی
add_executable(BackendApp
        main.cpp
        login.cpp login.h
        Message.cpp Message.h
        User.cpp User.h
        Chat.cpp Chat.h
)

# لینک کردن کتابخانه دیتابیس
target_link_libraries(BackendApp PRIVATE DataBaseLib)

# افزودن مسیر به لایبرری‌های json و sqlite
target_include_directories(BackendApp PRIVATE ${CMAKE_SOURCE_DIR}/library)