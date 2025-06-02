# CMakeLists.txt for socket module

# ساختن یک کتابخانه داخلی برای WebSocket و JWT
add_library(SocketLib
        JwtAuth.cpp
        WebSocketHandler.cpp

        JwtAuth.h
        WebSocketHandler.h
)

# لینک به کتابخانه‌های خارجی نصب‌شده با vcpkg (اگر لازم داری)
find_package(jwt-cpp CONFIG REQUIRED)
find_package(Boost REQUIRED)

target_link_libraries(SocketLib
        PRIVATE
        jwt-cpp::jwt-cpp
        Boost::boost
)

# مسیر include این ماژول
target_include_directories(SocketLib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})