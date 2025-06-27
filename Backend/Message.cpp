#include "Message.h"
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <chrono>

std::string Message::generateUUID() {
    static boost::uuids::random_generator gen;
    return boost::uuids::to_string(gen());
}

Message::Message(const std::string& sender,
                 const std::string& receiver,
                 MessageType msg_type,
                 const std::string& msg_content)
    : id(generateUUID()),
      sender_id(sender),
      receiver_id(receiver),
      type(msg_type),
      content(msg_content),
      timestamp(std::chrono::system_clock::to_time_t(std::chrono::system_clock::now()))
{}
