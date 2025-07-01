//
// Created by HOME on 6/29/2025.
//

#ifndef BACKEND_NOTIFICATIONMANAGER_H
#define BACKEND_NOTIFICATIONMANAGER_H

#include "Message.h"
#include "WebSocketHandler.h"
#include "SessionManager.h"
#include <memory>
#include <set>

class NotificationManager {
public:
    NotificationManager(WebSocketServer& ws,
                        std::shared_ptr<SessionManager> sm,
                        std::shared_ptr<PrivateChatManager> cm);

    void notifyNewMessage(const Message& message);
    void notifyMessageRead(const std::string& message_id);
    void notifyMessageEdited(const std::string& message_id,
                             const std::string& new_content);
    void notifyMessageDeleted(const std::string& message_id);

private:
    WebSocketServer& ws_server_;
    std::shared_ptr<SessionManager> session_manager_;
    std::shared_ptr<PrivateChatManager> chat_manager_;
};


#endif //BACKEND_NOTIFICATIONMANAGER_H
