import { Box, IconButton, Stack, Typography } from '@mui/material';
import React from 'react';

const Chats = () => {
    return (
        <div>
            <Box
                sx={{
                    position: 'fixed',
                    width: 320,
                    height: '100vh',
                    top: 0,
                    left: 100,
                    backgroundColor: '#F8FAFF',
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
                    borderRadius: '8px'
                }}>
                    <Stack>
                        <Typography variant='h5'>
                            Chats
                        </Typography>
                        <IconButton>
                            
                        </IconButton>
                    </Stack>

            </Box>
        </div>
    );
};

export default Chats;
