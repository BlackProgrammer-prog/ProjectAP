import { Box, Stack, Typography } from '@mui/material';
import React from 'react';

const Chats = () => {
    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* نوار کناری یا داشبورد */}
            <Box
                sx={{
                    position: 'relative',
                    height: '100vh',
                    width: 320, // عرض برای باکس چت
                    backgroundColor: '#F8FAFF',
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)', // سایه برای برجسته کردن
                    borderRadius: '8px',
                    padding: 2,
                    marginRight: 2, // فاصله بین نوار کناری و باکس چت
                }}
            >
                <Stack direction="column" spacing={2}>
                    <Typography variant="h5">Chats</Typography>
                    {/* اینجا می‌توانید محتوای چت را قرار دهید */}
                </Stack>
            </Box>

            {/* فضای اصلی برای محتوا */}
            <Box sx={{ flexGrow: 1, backgroundColor: '#fff' }}>
                {/* محتوای اصلی */}
            </Box>
        </Box>
    );
};

export default Chats;
