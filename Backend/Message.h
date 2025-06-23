#pragma once

#include <string>
#include <ctime>
#include <nlohmann/json.h>
#include <stdexcept>

using json = nlohmann::json;

enum class MessageType {
    PRIVATE,
    GROUP,
    CHANNEL
};

inline std::string messageTypeToString(MessageType type) {
    switch (type) {
        case MessageType::PRIVATE: return "PRIVATE";
        case MessageType::GROUP:   return "GROUP";
        case MessageType::CHANNEL: return "CHANNEL";
    }
    return "UNKNOWN";
}

inline MessageType stringToMessageType(const std::string& str) {
    if (str == "PRIVATE")  return MessageType::PRIVATE;
    if (str == "GROUP")    return MessageType::GROUP;
    if (str == "CHANNEL")  return MessageType::CHANNEL;
    throw std::invalid_argument("Invalid MessageType string: " + str);
}

struct Message {
    std::string id;
    std::string sender_id;
    std::string receiver_id;
    MessageType type;
    std::string content;
    std::time_t timestamp;
    bool delivered = false;
    bool read = false;

    Message() = default;

    Message(const std::string& sender,
            const std::string& receiver,
            MessageType msg_type,
            const std::string& msg_content);

    static std::string generateUUID();


    json toJson() const {
        return {
            {"id", id},
            {"sender_id", sender_id},
            {"receiver_id", receiver_id},
            {"type", messageTypeToString(type)},
            {"content", content},
            {"timestamp", timestamp},
            {"delivered", delivered},
            {"read", read}
        };
    }


    static Message fromJson(const json& j) {
        Message msg;
        msg.id          = j.at("id");
        msg.sender_id   = j.at("sender_id");
        msg.receiver_id = j.at("receiver_id");
        msg.type        = stringToMessageType(j.at("type"));
        msg.content     = j.at("content");
        msg.timestamp   = j.at("timestamp");
        msg.delivered   = j.value("delivered", false);
        msg.read        = j.value("read", false);
        return msg;
    }
};
