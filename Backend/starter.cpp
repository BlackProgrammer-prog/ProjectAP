#include "starter.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <cstdlib>

Starter::Starter(const std::vector<std::string>& commands, int delaySeconds)
    : commands_(commands), delaySeconds_(delaySeconds) {}