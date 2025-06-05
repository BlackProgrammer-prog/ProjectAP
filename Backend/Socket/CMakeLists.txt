# CMakeLists.txt for socket module

add_library(SocketLib
        JwtAuth.cpp
        WebSocketHandler.cpp

        JwtAuth.h
        WebSocketHandler.h
)

# استفاده از کتابخانه‌های نصب‌شده با vcpkg
find_package(jwt-cpp CONFIG REQUIRED)
find_package(Boost REQUIRED COMPONENTS beast asio)

target_link_libraries(SocketLib
        PRIVATE
        jwt-cpp::jwt-cpp
        Boost::beast
        Boost::asio
)

# مسیر اینکلودها
target_include_directories(SocketLib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})