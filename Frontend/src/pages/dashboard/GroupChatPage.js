import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Conversation from '../../components/Conversation';
import GroupSidebar from '../../components/Group/Sidebar';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import webSocketService from '../../Login/Component/Services/WebSocketService';
import { findGroupByIdOrUrl, upsertGroup } from '../../utils/groupStorage';
import { ensureGroupChatExists, saveGroupChat, loadGroupChat } from '../../utils/groupChatStorage';
import { v4 as uuidv4 } from 'uuid';

const GroupChatPage = () => {
    const { groupId } = useParams();
    const { token, user } = useAuth();
    const [group, setGroup] = useState(() => findGroupByIdOrUrl(groupId));
    const [messages, setMessages] = useState([]);

    const chatData = useMemo(() => {
        if (!group) return null;
        return {
            customUrl: group.custom_url || group.id,
            fullName: group.name,
            avatarUrl: group.profile_image || '',
        };
    }, [group]);

    useEffect(() => {
        setGroup(findGroupByIdOrUrl(groupId));
        ensureGroupChatExists(groupId);
        setMessages(loadGroupChat(groupId));
    }, [groupId]);

    // Refresh group info and messages from server
    useEffect(() => {
        if (!token || !groupId) return;
        webSocketService.send({ type: 'get_group_info', token, group_id: group?.id || groupId });
        webSocketService.send({ type: 'get_group_messages', token, group_id: group?.id || groupId, limit: 50, order: 'asc' });
        const off = webSocketService.addGeneralListener((raw) => {
            try {
                const data = JSON.parse(raw);
                // Group info
                if (data && (data.type === 'get_group_info_response' || (data.status === 'success' && data.group && data.group.id))) {
                    if (data.status === 'success' && data.group) {
                        upsertGroup(data.group);
                        setGroup(data.group);
                    }
                    return;
                }
                // Bulk messages
                if (data && Array.isArray(data.messages)) {
                    const myId = user?.user_id || user?.id;
                    const adapted = (data.messages || []).map((m) => {
                        const ms = typeof m.timestamp === 'number' ? (m.timestamp < 1e12 ? m.timestamp * 1000 : m.timestamp) : null;
                        const ts = ms ? new Date(ms).toISOString() : (m.timestamp || new Date().toISOString());
                        const isOutgoing = myId && m.sender_id ? String(m.sender_id) === String(myId) : false;
                        return {
                            id: m.id || m._id || uuidv4(),
                            type: 'msg',
                            message: m.content || m.message || '',
                            incoming: !isOutgoing,
                            outgoing: !!isOutgoing,
                            sender: String(m.sender_id || ''),
                            receiver: '',
                            timestamp: ts,
                            read: m.read === true || m.read === 1,
                            senderName: isOutgoing ? (user?.profile?.fullName || user?.username || 'You') : `Member ${m.sender_id}`,
                            senderAvatar: isOutgoing ? (user?.profile?.avatarUrl || '') : '',
                        };
                    });
                    saveGroupChat(groupId, adapted);
                    setMessages(adapted);
                    return;
                }
                // Single group message event (if any)
                if (data && data.type && String(data.type).includes('group') && (data.content || data.message) && (data.group_id === group?.id || data.group_id === groupId)) {
                    const myId = user?.user_id || user?.id;
                    const ts = data.timestamp ? (typeof data.timestamp === 'number' ? new Date((data.timestamp < 1e12 ? data.timestamp * 1000 : data.timestamp)).toISOString() : data.timestamp) : new Date().toISOString();
                    const isOutgoing = myId && data.sender_id ? String(data.sender_id) === String(myId) : false;
                    const incomingMsg = {
                        id: data.id || data.message_id || uuidv4(),
                        type: 'msg',
                        message: data.content || data.message || '',
                        incoming: !isOutgoing,
                        outgoing: !!isOutgoing,
                        sender: String(data.sender_id || ''),
                        receiver: '',
                        timestamp: ts,
                        read: false,
                        senderName: isOutgoing ? (user?.profile?.fullName || user?.username || 'You') : `Member ${data.sender_id}`,
                        senderAvatar: isOutgoing ? (user?.profile?.avatarUrl || '') : '',
                    };
                    setMessages((prev) => {
                        const next = [...(prev || []), incomingMsg];
                        saveGroupChat(groupId, next);
                        return next;
                    });
                    return;
                }
                // Sent ack could be handled here if server emits it
                if (data && data.status === 'success' && data.message_id && data.type === 'send_group_message_response') {
                    const ackId = data.message_id;
                    setMessages((prev) => {
                        const next = (prev || []).map((m) => (m.pending ? { ...m, id: ackId, pending: false } : m));
                        saveGroupChat(groupId, next);
                        return next;
                    });
                    return;
                }
            } catch {}
        });
        return () => off && off();
    }, [token, groupId, group]);

    // Placeholder handlers; will be implemented with group messaging later
    const handleSend = (text) => {
        const pending = {
            id: uuidv4(),
            type: 'msg',
            message: text,
            incoming: false,
            outgoing: true,
            sender: 'me',
            receiver: groupId,
            timestamp: new Date().toISOString(),
            read: false,
            pending: true,
        };
        setMessages((prev) => {
            const next = [...(prev || []), pending];
            saveGroupChat(groupId, next);
            return next;
        });
        try {
            if (token && (group?.id || groupId)) {
                webSocketService.send({ type: 'send_group_message', token, group_id: group?.id || groupId, message: text });
            }
        } catch {}
    };
    const handleDeleteMessage = () => {};
    const handleDeleteChat = () => {};
    const handleReactionChange = () => {};
    const handleForwardMessage = () => {};
    const handleEditMessage = () => {};
    const handleReportMessage = () => {};

    return (
        <>
            <GroupSidebar />
            <Conversation
                chatData={chatData}
                messages={messages}
                onSend={handleSend}
                onDeleteMessage={handleDeleteMessage}
                onDeleteChat={handleDeleteChat}
                onReactionChange={handleReactionChange}
                onForwardMessage={handleForwardMessage}
                onEditMessage={handleEditMessage}
                onReportMessage={handleReportMessage}
            />
        </>
    );
};

export default GroupChatPage;


