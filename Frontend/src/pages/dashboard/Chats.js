import { Box, Stack, Typography } from '@mui/material'
import React from 'react'

const Chats = () => {
    return (
        <div>
            <Box sx={{
                position: 'relative',
                backgroundColor: '#F8FAFF',
                height: '100vh',  // تغییر به 100vh برای پوشش کامل صفحه
                width: 320,
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',  // سایه بهبود یافته
                borderRadius: 2,
                padding: 2,  // فاصله داخلی
                transition: 'box-shadow 0.3s ease',  // انیمیشن برای تغییر سایه
                '&:hover': {
                    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.2)'  // سایه بیشتر هنگام هاور
                }
            }}>
                <Stack>
                    <Typography>
                        Chats
                    </Typography>
                </Stack>
            </Box>
        </div>
    )
}

export default Chats;
