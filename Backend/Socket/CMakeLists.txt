add_library(SocketLib
        JwtAuth.cpp
        WebSocketHandler.cpp
        JwtAuth.h
        WebSocketHandler.h
)

find_package(jwt-cpp CONFIG REQUIRED)
find_package(Boost REQUIRED COMPONENTS uuid system thread)

target_link_libraries(SocketLib
        PUBLIC
        DataBaseLib             # اگر WebSocketHandler به دیتابیس ارجاع می‌ده
        PRIVATE
        jwt-cpp::jwt-cpp
        Boost::uuid
        Boost::system
        Boost::thread
)

target_include_directories(SocketLib
        PUBLIC
        ${CMAKE_SOURCE_DIR}
        ${CMAKE_CURRENT_SOURCE_DIR}            # هدرهای Socket
        ${CMAKE_SOURCE_DIR}/library            # اگر json.hpp یا sqlite3 اینجاست
        ${CMAKE_SOURCE_DIR}/SomeOtherModuleDir # مسیر هر هدر دیگری که نیاز دارید
        ${Boost_INCLUDE_DIRS}
)