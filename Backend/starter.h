#ifndef STARTER_H
#define STARTER_H

#include <string>
#include <vector>

class Starter {
public:
    Starter(const std::vector<std::string>& commands, int delaySeconds = 10);
    void execute();

private:
    std::vector<std::string> commands_;
    int delaySeconds_;
};

#endif // STARTER_H