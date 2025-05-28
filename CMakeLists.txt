cmake_minimum_required(VERSION 3.30)
project(ProjectAP)

set(CMAKE_CXX_STANDARD 14)

include_directories(Backend)

add_executable(ProjectAP
        Backend/Chat.cpp
        Backend/Chat.h
        Backend/Database.cpp
        Backend/Database.h
        Backend/login.cpp
        Backend/login.h
        Backend/main.cpp
        Backend/Message.cpp
        Backend/Message.h
        Backend/User.cpp
        Backend/User.h)
