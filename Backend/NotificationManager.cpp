//
// Created by HOME on 6/29/2025.
//

#include "NotificationManager.h"

NotificationManager::NotificationManager(
        WebSocketServer& ws,
        std::shared_ptr<SessionManager> sm,
        std::shared_ptr<PrivateChatManager> cm)
        : ws_server_(ws), session_manager_(sm), chat_manager_(cm) {}

void NotificationManager::notifyNewMessage(const Message& message) {
    json payload = {
            {"type", "new_message"},
            {"message", message.toJson()}
    };

    auto client_ids = session_manager_->getClientIds(message.receiver_id);
    for (const auto& client_id : client_ids) {
        ws_server_.sendToClient(client_id, payload);
    }

    if (message.status != MessageStatus::DELIVERED) {
        json ack = {
                {"type", "message_delivered"},
                {"message_id", message.id}
        };
        auto sender_clients = session_manager_->getClientIds(message.sender_id);
        for (const auto& client_id : sender_clients) {
            ws_server_.sendToClient(client_id, ack);
        }
    }
}

void NotificationManager::notifyMessageRead(const std::string& message_id) {
    Message msg = chat_manager_->getMessageById(message_id);
    if (msg.id.empty()) return;

    json payload = {
            {"type", "message_read"},
            {"message_id", message_id}
    };

    auto client_ids = session_manager_->getClientIds(msg.sender_id);
    for (const auto& client_id : client_ids) {
        ws_server_.sendToClient(client_id, payload);
    }
}

void NotificationManager::notifyMessageEdited(
        const std::string& message_id,
        const std::string& new_content) {
    Message msg = chat_manager_->getMessageById(message_id);
    if (msg.id.empty()) return;

    json payload = {
            {"type", "message_edited"},
            {"message_id", message_id},
            {"new_content", new_content}
    };

    // ارسال به هر دو طرف چت
    auto receiver_clients = session_manager_->getClientIds(msg.receiver_id);
    for (const auto& client_id : receiver_clients) {
        ws_server_.sendToClient(client_id, payload);
    }

    auto sender_clients = session_manager_->getClientIds(msg.sender_id);
    for (const auto& client_id : sender_clients) {
        ws_server_.sendToClient(client_id, payload);
    }
}

void NotificationManager::notifyMessageDeleted(const std::string& message_id) {
    Message msg = chat_manager_->getMessageById(message_id);
    if (msg.id.empty()) return;

    json payload = {
            {"type", "message_deleted"},
            {"message_id", message_id}
    };

    // ارسال به هر دو طرف چت
    auto receiver_clients = session_manager_->getClientIds(msg.receiver_id);
    for (const auto& client_id : receiver_clients) {
        ws_server_.sendToClient(client_id, payload);
    }

    auto sender_clients = session_manager_->getClientIds(msg.sender_id);
    for (const auto& client_id : sender_clients) {
        ws_server_.sendToClient(client_id, payload);
    }
}