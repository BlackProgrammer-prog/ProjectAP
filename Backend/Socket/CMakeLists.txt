# ایجاد کتابخانه SocketLib
add_library(SocketLib
        JwtAuth.cpp
        WebSocketHandler.cpp
        JwtAuth.h
        WebSocketHandler.h
)

# پیدا کردن پکیج‌های مورد نیاز
find_package(jwt-cpp CONFIG REQUIRED)
find_package(Boost REQUIRED COMPONENTS system thread)

# لینک کردن کتابخانه‌ها
target_link_libraries(SocketLib
        PRIVATE
        jwt-cpp::jwt-cpp
        Boost::system
        Boost::thread
)

# مسیرهای اینکلود برای boost (ضروری اگر با beast یا asio مستقیم کار می‌کنی)
target_include_directories(SocketLib
        PUBLIC
        ${CMAKE_CURRENT_SOURCE_DIR}
        ${Boost_INCLUDE_DIRS}
)