//
// Created by afraa on 8/9/2025.
//

#include "HttpServer.h"
#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/dispatch.hpp>
#include <boost/asio/strand.hpp>
#include <boost/config.hpp>
#include <iostream>
#include <string>
#include <vector>
#include <filesystem>

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
using tcp = boost::asio::ip::tcp;
namespace fs = std::filesystem;

// Return a reasonable mime type based on the extension of a file.
beast::string_view mime_type(beast::string_view path) {
    using beast::iequals;
    auto const ext = [&path] {
        auto const pos = path.rfind(".");
        if(pos == beast::string_view::npos)
            return beast::string_view{};
        return path.substr(pos);
    }();
    if(iequals(ext, ".htm"))  return "text/html";
    if(iequals(ext, ".html")) return "text/html";
    if(iequals(ext, ".php"))  return "text/html";
    if(iequals(ext, ".css"))  return "text/css";
    if(iequals(ext, ".txt"))  return "text/plain";
    if(iequals(ext, ".js"))   return "application/javascript";
    if(iequals(ext, ".json")) return "application/json";
    if(iequals(ext, ".xml"))  return "application/xml";
    if(iequals(ext, ".swf"))  return "application/x-shockwave-flash";
    if(iequals(ext, ".flv"))  return "video/x-flv";
    if(iequals(ext, ".png"))  return "image/png";
    if(iequals(ext, ".jpe"))  return "image/jpeg";
    if(iequals(ext, ".jpeg")) return "image/jpeg";
    if(iequals(ext, ".jpg"))  return "image/jpeg";
    if(iequals(ext, ".gif"))  return "image/gif";
    if(iequals(ext, ".svg"))  return "image/svg+xml";
    if(iequals(ext, ".ico"))  return "image/vnd.microsoft.icon";
    if(iequals(ext, ".tiff")) return "image/tiff";
    if(iequals(ext, ".tif"))  return "image/tiff";
    if(iequals(ext, ".pdf"))  return "application/pdf";
    if(iequals(ext, ".zip"))  return "application/zip";
    if(iequals(ext, ".gz"))   return "application/gzip";
    return "application/octet-stream";
}

// Append an HTTP rel-path to a local filesystem path.
// The returned path is normalized for the platform.
std::string path_cat(beast::string_view base, beast::string_view path) {
    if(base.empty())
        return std::string(path);
    std::string result(base);
#ifdef BOOST_MSVC
    char constexpr path_separator = '\\';
    if(result.back() == path_separator)
        result.resize(result.size() - 1);
    result.append(path.data(), path.size());
    for(auto& c : result)
        if(c == '/')
            c = path_separator;
#else
    char constexpr path_separator = '/';
    if(result.back() == path_separator)
        result.resize(result.size() - 1);
    result.append(path.data(), path.size());
#endif
    return result;
}

// This function produces an HTTP response for the given
// request. The type of the response object depends on the
// contents of the request, so the interface requires the
// caller to pass a generic lambda for receiving the response.
template<class Body, class Allocator, class Send>
void handle_request(
    beast::string_view doc_root,
    http::request<Body, http::basic_fields<Allocator>>&& req,
    Send&& send)
{
    // Debug: log incoming request target and doc_root
    try {
        std::cout << "[HTTP] target=" << req.target() << ", doc_root=" << std::string(doc_root) << std::endl;
    } catch(...) {}
    auto const bad_request =
    [&req](beast::string_view why)
    {
        http::response<http::string_body> res{http::status::bad_request, req.version()};
        res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
        res.set(http::field::content_type, "text/html");
        res.keep_alive(req.keep_alive());
        res.body() = std::string(why);
        res.prepare_payload();
        return res;
    };

    auto const not_found =
    [&req](beast::string_view target)
    {
        http::response<http::string_body> res{http::status::not_found, req.version()};
        res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
        res.set(http::field::content_type, "text/html");
        res.keep_alive(req.keep_alive());
        res.body() = "The resource '" + std::string(target) + "' was not found.";
        res.prepare_payload();
        return res;
    };

    auto const server_error =
    [&req](beast::string_view what)
    {
        http::response<http::string_body> res{http::status::internal_server_error, req.version()};
        res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
        res.set(http::field::content_type, "text/html");
        res.keep_alive(req.keep_alive());
        res.body() = "An error occurred: '" + std::string(what) + "'";
        res.prepare_payload();
        return res;
    };

    if( req.method() != http::verb::get &&
        req.method() != http::verb::head)
        return send(bad_request("Unknown HTTP-method"));

    if( req.target().empty() ||
        req.target()[0] != '/' ||
        req.target().find("..") != beast::string_view::npos)
        return send(bad_request("Illegal request-target"));

    // Build a filesystem-safe path: doc_root + target (without leading '/')
    std::string target_str = std::string(req.target());
    if(!target_str.empty() && target_str.front() == '/') {
        target_str.erase(0, 1);
    }
    if(target_str.empty()) {
        target_str = "index.html";
    }
    if(!target_str.empty() && target_str.back() == '/') {
        target_str += "index.html";
    }
    fs::path fs_doc_root{std::string(doc_root)};
    fs::path fs_full = fs::weakly_canonical(fs_doc_root / target_str);
    // Prevent path traversal outside doc_root
    if(fs_full.string().rfind(fs::weakly_canonical(fs_doc_root).string(), 0) != 0) {
        return send(bad_request("Illegal request-target"));
    }
    std::string path = fs_full.string();
    try {
        std::cout << "[HTTP] resolved path=" << path << std::endl;
    } catch(...) {}
    if(req.target().back() == '/')
        path.append("index.html");

    beast::error_code ec;
    http::file_body::value_type body;
    body.open(path.c_str(), beast::file_mode::scan, ec);

    if(ec == beast::errc::no_such_file_or_directory)
        return send(not_found(req.target()));

    if(ec)
        return send(server_error(ec.message()));

    auto const size = body.size();

    if(req.method() == http::verb::head)
    {
        http::response<http::empty_body> res{http::status::ok, req.version()};
        res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
        res.set(http::field::content_type, mime_type(path));
        res.content_length(size);
        res.keep_alive(req.keep_alive());
        return send(std::move(res));
    }

    http::response<http::file_body> res{
        std::piecewise_construct,
        std::make_tuple(std::move(body)),
        std::make_tuple(http::status::ok, req.version())};
    res.set(http::field::server, BOOST_BEAST_VERSION_STRING);
    res.set(http::field::content_type, mime_type(path));
    res.content_length(size);
    res.keep_alive(req.keep_alive());
    return send(std::move(res));
}

class session : public std::enable_shared_from_this<session>
{
    beast::tcp_stream stream_;
    beast::flat_buffer buffer_;
    std::shared_ptr<std::string const> doc_root_;
    http::request<http::string_body> req_;

public:
    session(
        tcp::socket&& socket,
        std::shared_ptr<std::string const> const& doc_root)
        : stream_(std::move(socket))
        , doc_root_(doc_root)
    {
    }

    void run()
    {
        net::dispatch(stream_.get_executor(),
                      beast::bind_front_handler(
                          &session::do_read,
                          shared_from_this()));
    }

    void do_read()
    {
        req_ = {};
        stream_.expires_after(std::chrono::seconds(30));
        http::async_read(stream_, buffer_, req_,
            beast::bind_front_handler(
                &session::on_read,
                shared_from_this()));
    }

    void on_read(
        beast::error_code ec,
        std::size_t bytes_transferred)
    {
        boost::ignore_unused(bytes_transferred);
        if(ec == http::error::end_of_stream)
            return do_close();
        if(ec)
            return; // fail
        
        // Call handle_request and pass it a lambda that will send the response
        handle_request(*doc_root_, std::move(req_),
            [this](auto&& response)
            {
                // The lifetime of the response has to be managed, so we use a shared_ptr.
                using response_type = typename std::decay<decltype(response)>::type;
                auto sp = std::make_shared<response_type>(std::forward<decltype(response)>(response));
                
                http::async_write(this->stream_, *sp,
                    [self = shared_from_this(), sp](beast::error_code ec, std::size_t bytes)
                    {
                        self->on_write(ec, bytes, sp->need_eof());
                    });
            });
    }

    void on_write(
        beast::error_code ec,
        std::size_t bytes_transferred,
        bool close)
    {
        boost::ignore_unused(bytes_transferred);
        if(ec)
            return; // fail
        if(close)
            return do_close();
        do_read();
    }

    void do_close()
    {
        beast::error_code ec;
        stream_.socket().shutdown(tcp::socket::shutdown_send, ec);
    }
};

class listener : public std::enable_shared_from_this<listener>
{
    net::io_context& ioc_;
    tcp::acceptor acceptor_;
    std::shared_ptr<std::string const> doc_root_;

public:
    listener(
        net::io_context& ioc,
        tcp::endpoint endpoint,
        std::shared_ptr<std::string const> const& doc_root)
        : ioc_(ioc)
        , acceptor_(net::make_strand(ioc))
        , doc_root_(doc_root)
    {
        beast::error_code ec;
        acceptor_.open(endpoint.protocol(), ec);
        if(ec)
        {
            // fail
            return;
        }
        acceptor_.set_option(net::socket_base::reuse_address(true), ec);
        if(ec)
        {
            // fail
            return;
        }
        acceptor_.bind(endpoint, ec);
        if(ec)
        {
            // fail
            return;
        }
        acceptor_.listen(net::socket_base::max_listen_connections, ec);
        if(ec)
        {
            // fail
            return;
        }
    }
    void run()
    {
        do_accept();
    }
private:
    void do_accept()
    {
        acceptor_.async_accept(
            net::make_strand(ioc_),
            beast::bind_front_handler(
                &listener::on_accept,
                shared_from_this()));
    }

    void on_accept(beast::error_code ec, tcp::socket socket)
    {
        if(ec)
        {
            return; // fail
        }
        std::make_shared<session>(
            std::move(socket),
            doc_root_)->run();
        do_accept();
    }
};

struct HttpServer::Impl
{
    unsigned short port_;
    std::string doc_root_;
    net::io_context ioc_{1};

    Impl(unsigned short port, const std::string& doc_root)
        : port_(port), doc_root_(doc_root) {}

    void run()
    {
        auto const address = net::ip::make_address("0.0.0.0");
        std::make_shared<listener>(
            ioc_,
            tcp::endpoint{address, port_},
            std::make_shared<std::string>(doc_root_))->run();
        ioc_.run();
    }

    void stop()
    {
        ioc_.stop();
    }
};

HttpServer::HttpServer(unsigned short port, const std::string& doc_root)
    : impl_(std::make_unique<Impl>(port, doc_root)) {}

HttpServer::~HttpServer() {
    stop();
}

void HttpServer::run() {
    server_thread_ = std::thread([this](){
        impl_->run();
    });
}

void HttpServer::stop() {
    impl_->stop();
    if(server_thread_.joinable()) {
        server_thread_.join();
    }
}
