import { Avatar, Box, Typography, Divider, Button, IconButton, Stack } from '@mui/material';
import { ArrowLeft, Phone, VideoCamera, Info } from 'phosphor-react';
import { faker } from '@faker-js/faker';

const UserProfile = ({ onClose }) => {
    const user = {
        name: "meysam", // نام کاربر را از هدر می‌گیریم
        status: "Online",
        phone: faker.phone.number(),
        bio: faker.lorem.sentence(),
        avatar: faker.image.avatar(),
        isBlocked: false
    };

    return (
        <Box sx={{
            width: 320,
            height: '100vh',
            backgroundColor: 'background.paper',
            boxShadow: 3,
            position: 'fixed',
            top: 0,
            right: 0,
            zIndex: 1300, // مطمئن شوید بالاتر از هدر قرار می‌گیرد
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
                            {user.phone}
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
                        <Button startIcon={<Info />} fullWidth>
                            {user.isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                        <Button color="error" fullWidth>
                            Delete Chat
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </Box>
    );
};

export default UserProfile;