import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Conversation from '../../components/Conversation';
import GroupSidebar from '../../components/Group/Sidebar';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import webSocketService from '../../Login/Component/Services/WebSocketService';
import { findGroupByIdOrUrl, upsertGroup } from '../../utils/groupStorage';
import { ensureGroupChatExists, saveGroupChat, loadGroupChat, clearGroupChat } from '../../utils/groupChatStorage';
import { v4 as uuidv4 } from 'uuid';
import { loadGroupMembers, saveGroupMembers, upsertGroupMember } from '../../utils/groupMembersStorage';

const GroupChatPage = () => {
    const { groupId } = useParams();
    const { token, user } = useAuth();
    const [group, setGroup] = useState(() => findGroupByIdOrUrl(groupId));
    const [messages, setMessages] = useState([]);
    const [members, setMembers] = useState(() => loadGroupMembers(groupId));
    const memberEmailsRef = useRef([]);
    const requestedGroupKeyRef = useRef(null);

    const chatData = useMemo(() => {
        if (!group) return null;
        return {
            customUrl: group.custom_url || group.id,
            fullName: group.name,
            avatarUrl: group.profile_image || '',
        };
    }, [group]);

    useEffect(() => {
        const resolved = findGroupByIdOrUrl(groupId);
        setGroup(resolved || null);
        const keyId = (resolved && resolved.id) ? resolved.id : groupId;
        // Reset local cache to avoid showing stale/wrong messages from previous bug
        try { clearGroupChat(keyId); } catch {}
        ensureGroupChatExists(keyId);
        setMessages([]);
        setMembers(loadGroupMembers(keyId));
    }, [groupId]);

    // Refresh group info, messages, and members from server
    useEffect(() => {
        if (!token || !groupId) return;
        // Always resolve a stable key from current URL param to avoid stale state
        const resolved = findGroupByIdOrUrl(groupId);
        const keyId = (resolved && resolved.id) ? resolved.id : groupId;
        const off = webSocketService.addGeneralListener((raw) => {
            try {
                const data = JSON.parse(raw);
                // Group info (only for the current group context)
                if (data && (data.type === 'get_group_info_response' || (data.status === 'success' && data.group && (data.group.id || data.group.custom_url)))) {
                    if (data.status === 'success' && data.group) {
                        const incomingKey = String(data.group.id ?? data.group.custom_url);
                        const currentKey = String((group && (group.id ?? group.custom_url)) ?? groupId);
                        if (incomingKey === currentKey) {
                            upsertGroup(data.group);
                            setGroup(data.group);
                        }
                    }
                    return;
                }
                // Group members list
                if (data && (data.type === 'get_group_members_response' || (data.status === 'success' && Array.isArray(data.members)))) {
                    if (data.status === 'success' && Array.isArray(data.members)) {
                        const emails = (data.members || []).filter((e) => typeof e === 'string');
                        memberEmailsRef.current = emails;
                        // Save minimal members immediately (emails only) while profiles load
                        saveGroupMembers(keyId, emails.map((email) => ({ email })));
                        setMembers(loadGroupMembers(keyId));
                        // Request profiles for each member
                        emails.forEach((email) => {
                            try { webSocketService.send({ type: 'get_profile', token, email }); } catch {}
                        });
                    }
                    return;
                }
                // Profile responses for members
                if (data && (data.type === 'get_profile_response' || data.profile)) {
                    if (data.status === 'success' && data.profile && data.profile.email) {
                        const email = String(data.profile.email);
                        if (memberEmailsRef.current.includes(email)) {
                            upsertGroupMember(keyId, data.profile);
                            setMembers(loadGroupMembers(keyId));
                        }
                    }
                    return;
                }
                // Bulk group messages
                if (data && Array.isArray(data.messages)) {
                    const gid = keyId;
                    const typeStr = typeof data.type === 'string' ? data.type : '';

                    // Ignore PV-like bulk payloads (e.g., get_messages for private chats)
                    const isPvLike = typeStr === 'get_messages_response' || typeStr === 'get_messages' || Object.prototype.hasOwnProperty.call(data, 'with');
                    if (isPvLike) return;

                    // Determine if this payload belongs to current group
                    const first = data.messages[0] || {};
                    const envGroup = data.group_id || data.groupId;
                    const msgGroup = first.group_id || first.groupId || first.group;
                    const matchesEnv = envGroup ? String(envGroup) === String(gid) : false;
                    const matchesMsg = msgGroup ? String(msgGroup) === String(gid) : false;
                    const matchesRequestContext = requestedGroupKeyRef.current && String(requestedGroupKeyRef.current) === String(gid);
                    if (!(matchesEnv || matchesMsg || matchesRequestContext)) return;

                    const myId = user?.user_id || user?.id;
                    const adapted = (data.messages || []).map((m) => {
                        const ms = typeof m.timestamp === 'number' ? (m.timestamp < 1e12 ? m.timestamp * 1000 : m.timestamp) : null;
                        const ts = ms ? new Date(ms).toISOString() : (m.timestamp || new Date().toISOString());
                        const senderAny = m.sender_id || m.senderId || m.sender || m.user_id || m.userId;
                        const isOutgoing = myId && senderAny ? String(senderAny) === String(myId) : false;
                        return {
                            id: m.id || m._id || uuidv4(),
                            type: 'msg',
                            message: m.content || m.message || '',
                            incoming: !isOutgoing,
                            outgoing: !!isOutgoing,
                            sender: String(senderAny || ''),
                            receiver: '',
                            timestamp: ts,
                            read: m.read === true || m.read === 1,
                            senderName: isOutgoing ? (user?.profile?.fullName || user?.username || 'You') : `Member ${senderAny ?? ''}`,
                            senderAvatar: isOutgoing ? (user?.profile?.avatarUrl || '') : '',
                        };
                    });
                    saveGroupChat(gid, adapted);
                    setMessages(adapted);
                    return;
                }
                // Single group message event (if any)
                if (data && data.type && String(data.type).includes('group') && (data.content || data.message) && (String(data.group_id) === String(keyId))) {
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
                        saveGroupChat(keyId, next);
                        return next;
                    });
                    return;
                }
                // Sent ack could be handled here if server emits it
                if (data && data.status === 'success' && data.message_id && data.type === 'send_group_message_response') {
                    const ackId = data.message_id;
                    setMessages((prev) => {
                        const next = (prev || []).map((m) => (m.pending ? { ...m, id: ackId, pending: false } : m));
                        saveGroupChat(keyId, next);
                        return next;
                    });
                    return;
                }
            } catch {}
        });
        // Ensure connection is active before sending; send after listener is registered
        try { webSocketService.connect(); } catch {}
        webSocketService.send({ type: 'get_group_info', token, group_id: keyId });
        requestedGroupKeyRef.current = String(keyId);
        webSocketService.send({ type: 'get_group_messages', token, group_id: keyId, limit: 50, order: 'asc' });
        // On refresh: request group members once
        webSocketService.send({ type: 'get_group_members', token, group_id: keyId });
        return () => off && off();
    }, [token, groupId]);

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
            const resolved = findGroupByIdOrUrl(groupId);
            const keyId = (resolved && resolved.id) ? resolved.id : groupId;
            saveGroupChat(keyId, next);
            return next;
        });
        try {
            if (token && groupId) {
                const resolved = findGroupByIdOrUrl(groupId);
                const keyId = (resolved && resolved.id) ? resolved.id : groupId;
                webSocketService.send({ type: 'send_group_message', token, group_id: keyId, message: text });
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
                key={(group && group.id) ? String(group.id) : String(groupId)}
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


