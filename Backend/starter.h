#ifndef STARTER_H
#define STARTER_H

#include <string>
#include <vector>

using namespace std;

class Starter {
public:
    Starter(const vector<string>& commands, int delaySeconds = 10);
    void execute();

private:
    vector<string> commands_;
    int delaySeconds_;
};

#endif // STARTER_H