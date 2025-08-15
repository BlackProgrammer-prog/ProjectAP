#include "starter.h"
#include <iostream>
#include <thread>
#include <chrono>
#include <cstdlib>

using namespace std;

Starter::Starter(const vector<string>& commands, int delaySeconds)
    : commands_(commands), delaySeconds_(delaySeconds) {}

void Starter::execute() {
    for (const auto& cmd : commands_) {
        cout << "[Starter] Running: " << cmd << endl;

        int result = system(cmd.c_str());

        if (result != 0) {
            cerr << "[Starter] Command failed with code: " << result << endl;
        }

        this_thread::sleep_for(chrono::seconds(delaySeconds_));
    }
}