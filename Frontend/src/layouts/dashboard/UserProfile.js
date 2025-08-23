import React from 'react';
import { Avatar, Box, Typography, Divider, Button, IconButton, Stack } from '@mui/material';
import { ArrowLeft, Phone, VideoCamera, Info } from 'phosphor-react';
import { faker } from '@faker-js/faker';
import { useParams } from 'react-router-dom';
import { ChatList } from '../../data';
import { clearPrivateChat } from '../../utils/chatStorage';
import { loadPV } from '../../utils/pvStorage';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import webSocketService from '../../Login/Component/Services/WebSocketService';
import Swal from 'sweetalert2';
import { findGroupByIdOrUrl, removeGroupById } from '../../utils/groupStorage';

const UserProfile = ({ onClose, onBlockUser, onDeleteChat, isBlocked }) => {
    const { username, groupId } = useParams();
    const { token } = useAuth();
    const group = groupId ? findGroupByIdOrUrl(groupId) : null;

    // Hooks must be called unconditionally
    const [profile, setProfile] = React.useState(() => {
        const pv = loadPV();
        return (pv || []).find((p) => p.customUrl === username) || {};
    });
    const [online, setOnline] = React.useState(() => Number(profile?.status) === 1);
    React.useEffect(() => {
        const update = () => {
            const pv = loadPV();
            const u = (pv || []).find((p) => p && (p.customUrl === username || p.username === username || p.email === username)) || {};
            setProfile(u);
            setOnline(Number(u?.status) === 1);
        };
        update();
        const interval = setInterval(update, 1500);
        return () => clearInterval(interval);
    }, [username]);
    const user = {
        name: profile.fullName || profile.username || profile.email || username,
        status: online ? 'Online' : 'Offline',
        email: profile.email || '',
        bio: profile.bio || faker.lorem.sentence(),
        avatar: resolveAvatarUrl(profile.avatarUrl) || faker.image.avatar(),
        isBlocked: isBlocked || false
    };

    const handleBlockUser = () => {
        if (onBlockUser) onBlockUser(username);
        try {
            if (token && user.email) {
                webSocketService.send({ type: 'block_user', token, email: user.email });
                Swal.fire({ toast: true, position: 'bottom-start', icon: 'success', title: user.isBlocked ? 'کاربر آنبلاک شد' : 'کاربر بلاک شد', showConfirmButton: false, timer: 1800, timerProgressBar: true });
            }
        } catch {}
    };

    const handleDeleteChat = () => {
        if (onDeleteChat) {
            onDeleteChat(username);
            onClose(); // بستن پروفایل بعد از حذف چت
        }
    };

    return (
        group ? (
            <Box sx={{
                width: 320,
                height: '100vh',
                backgroundColor: 'background.paper',
                boxShadow: 3,
                position: 'fixed',
                top: 0,
                right: 0,
                zIndex: 1300,
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText'
                }}>
                    <IconButton onClick={onClose} sx={{ color: 'inherit' }}>
                        <ArrowLeft size={24} />
                    </IconButton>
                    <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>Group</Typography>
                </Box>

                <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
                    <Stack alignItems="center" spacing={2}>
                        <Avatar
                            src={group.profile_image || ''}
                            sx={{
                                width: 100,
                                height: 100,
                                border: '3px solid',
                                borderColor: 'primary.main'
                            }}
                        />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>{group.name}</Typography>

                        <Divider sx={{ width: '100%', my: 2 }} />
                        <Stack spacing={1} sx={{ width: '100%' }}>
                            <Button
                                color="error"
                                variant="outlined"
                                fullWidth
                                onClick={() => {
                                    try {
                                        if (token && group?.id) {
                                            webSocketService.send({ type: 'leave_group', token, group_id: group.id });
                                            removeGroupById(group.id);
                                            onClose && onClose();
                                            Swal.fire({ toast: true, position: 'bottom-start', icon: 'success', title: 'از گروه خارج شدید', showConfirmButton: false, timer: 1600, timerProgressBar: true });
                                        }
                                    } catch {}
                                }}
                            >
                                Leave Group
                            </Button>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => {
                                    const email = prompt('ایمیل عضو جدید را وارد کنید:');
                                    if (!email) return;
                                    try {
                                        if (token && group?.id) {
                                            webSocketService.send({ type: 'invite_to_group', token, group_id: group.id, email });
                                            Swal.fire({ toast: true, position: 'bottom-start', icon: 'success', title: 'دعوت‌نامه ارسال شد', showConfirmButton: false, timer: 1600, timerProgressBar: true });
                                        }
                                    } catch {}
                                }}
                            >
                                Invite Member
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Box>
        ) : (
            <Box sx={{
                width: 320,
                height: '100vh',
                backgroundColor: 'background.paper',
                boxShadow: 3,
                position: 'fixed',
                top: 0,
                right: 0,
                zIndex: 1300,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* هدر با دکمه بازگشت */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText'
                }}>
                    <IconButton onClick={onClose} sx={{ color: 'inherit' }}>
                        <ArrowLeft size={24} />
                    </IconButton>
                    <Typography variant="h6" sx={{ ml: 2, fontWeight: 600 }}>Profile</Typography>
                </Box>

                {/* محتوای پروفایل */}
                <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
                    <Stack alignItems="center" spacing={2}>
                        <Avatar
                            src={user.avatar}
                            sx={{
                                width: 100,
                                height: 100,
                                border: '3px solid',
                                borderColor: 'primary.main'
                            }}
                        />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                        <Typography color="text.secondary">{user.status}</Typography>

                        <Stack direction="row" spacing={2} sx={{ my: 2, width: '100%' }}>
                            <Button
                                variant="contained"
                                startIcon={<Phone />}
                                fullWidth
                                sx={{ py: 1.5 }}
                            >
                                Call
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<VideoCamera />}
                                fullWidth
                                sx={{ py: 1.5 }}
                            >
                                Video
                            </Button>
                        </Stack>

                        <Divider sx={{ width: '100%', my: 2 }} />

                        <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle2" gutterBottom>Contact Info</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                {user.email || '—'}
                            </Typography>
                            <Typography variant="body2">
                                {user.bio}
                            </Typography>
                        </Box>

                        <Divider sx={{ width: '100%', my: 2 }} />

                        <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle2" gutterBottom>Media, Links & Docs</Typography>
                            <Typography variant="body2">401 items</Typography>
                        </Box>

                        <Divider sx={{ width: '100%', my: 2 }} />

                        <Stack spacing={2} sx={{ width: '100%' }}>
                            <Button
                                startIcon={<Info />}
                                fullWidth
                                onClick={handleBlockUser}
                                color={user.isBlocked ? "success" : "warning"}
                            >
                                {user.isBlocked ? 'Unblock' : 'Block'}
                            </Button>
                            <Button
                                color="error"
                                fullWidth
                                onClick={handleDeleteChat}
                            >
                                Delete Chat
                            </Button>
                        </Stack>
                    </Stack>
                </Box>
            </Box>
        )
    );
};

export default UserProfile;