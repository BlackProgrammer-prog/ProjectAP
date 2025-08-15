#include "starter.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <cstdlib>

Starter::Starter(const std::vector<std::string>& commands, int delaySeconds)
    : commands_(commands), delaySeconds_(delaySeconds) {}

void Starter::execute() {
    for (const auto& cmd : commands_) {
        std::cout << "[Starter] Running: " << cmd << std::endl;

        int result = std::system(cmd.c_str());

        if (result != 0) {
            std::cerr << "[Starter] Command failed with code: " << result << std::endl;
        }

        std::this_thread::sleep_for(std::chrono::seconds(delaySeconds_));
    }
}