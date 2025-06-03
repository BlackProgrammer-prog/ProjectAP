import { Box, Stack } from '@mui/material';
import React from 'react';

const Conversation = () => {
    return (
        <Stack >
            {/* chat header */}
            <Box
                sx={{
                    height: "100px",
                    width: '100%',
                    backgroundColor: "#F8FAFF",
                    boxShadow: "0px 0px 2px rgba(0,0,0,0.25)",
                    position: 'fixed', // تنظیم به صورت ثابت در بالای صفحه
                    top: 0,  // در بالای صفحه قرار می‌گیرد
                    left: 420,
                    // برای اینکه روی سایر بخش‌ها قرار بگیرد
                }}
            >
                <Stack alignItems={'center'} direction={'row'} justifyContent={'space-between'} sx={{
                    width: '100%',
                    height: '100%'
                }}>
                    {/* Add your content for the header here */}
                </Stack>
            </Box>

            {/* msg */}
            {/* <Box sx={{ width: '100%', flexGrow: 1, paddingTop: '100px' }}>

               
            </Box> */}

            {/* chat footer */}
            <Box
                sx={{
                    height: "100px",
                    width: '100%',
                    backgroundColor: "#F8FAFF",
                    boxShadow: '0px 0px 2px rgba(0,0,0,0.25)',
                    position: 'fixed',  // قرار گرفتن در پایین صفحه
                    bottom: 0,   // در پایین صفحه قرار می‌گیرد
                    left: 418,
                    // برای اینکه روی سایر بخش‌ها قرار بگیرد
                }}
            >
                {/* Add your footer content here */}
            </Box>
        </Stack>
    );
}

export default Conversation;
