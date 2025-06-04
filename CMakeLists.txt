cmake_minimum_required(VERSION 3.14)
project(UserProfile2)

set(CMAKE_CXX_STANDARD 17)

# اضافه کردن مسیر فایل json.hpp
include_directories(${CMAKE_SOURCE_DIR}/external)

add_executable(UserProfile2
        main.cpp
        profile.h
        Profile.cpp
        Settings.h
        Settings.cpp
        user.h
        user.cpp
)
