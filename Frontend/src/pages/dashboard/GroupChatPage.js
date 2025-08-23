import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Conversation from '../../components/Conversation';
import GroupSidebar from '../../components/Group/Sidebar';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import webSocketService from '../../Login/Component/Services/WebSocketService';
import { findGroupByIdOrUrl, upsertGroup } from '../../utils/groupStorage';

const GroupChatPage = () => {
    const { groupId } = useParams();
    const { token } = useAuth();
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
    }, [groupId]);

    // Refresh group info from server on mount/param change
    useEffect(() => {
        if (!token || !groupId) return;
        webSocketService.send({ type: 'get_group_info', token, group_id: group?.id || groupId });
        const off = webSocketService.addGeneralListener((raw) => {
            try {
                const data = JSON.parse(raw);
                if (data && (data.type === 'get_group_info_response' || (data.status === 'success' && data.group && data.group.id))) {
                    if (data.status === 'success' && data.group) {
                        upsertGroup(data.group);
                        setGroup(data.group);
                    }
                }
            } catch {}
        });
        return () => off && off();
    }, [token, groupId, group]);

    // Placeholder handlers; will be implemented with group messaging later
    const handleSend = () => {};
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


