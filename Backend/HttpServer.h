//
// Created by afraa on 8/9/2025.
//

#ifndef BACKEND_HTTPSERVER_H
#define BACKEND_HTTPSERVER_H

#include <string>
#include <memory>
#include <thread>

class HttpServer {
public:
    HttpServer(unsigned short port, const std::string& doc_root);
    ~HttpServer();

    void run();
    void stop();

private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
    std::thread server_thread_;
};

#endif //BACKEND_HTTPSERVER_H
