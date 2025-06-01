import { alpha, Avatar, Badge, Box, Button, Divider, IconButton, InputBase, Stack, styled, Typography } from '@mui/material';
import { ArchiveBox, CircleDashed, MagnifyingGlass, Rows } from 'phosphor-react';
import React from 'react';
import { faker } from '@faker-js/faker';




const avatar = faker.image.avatar()

const Search = styled("div")(({ theme }) => ({
    position: 'relative',
    borderRadius: 20,
    backgroundColor: alpha(theme.palette.background.paper, 1),
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: "100%",
    display: 'flex',  // تغییر به فلت برای قرار گرفتن آیکون و ورودی کنار هم
    alignItems: 'center'  // برای هم‌راستا کردن آیکون و ورودی
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 1),  // کمی فضا برای آیکون
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    padding: theme.spacing(1, 1, 1, 2),  // اضافه کردن پدینگ چپ بیشتر
    width: "100%",
    '& .MuiInputBase-input': {
        paddingLeft: theme.spacing(2),  // فاصله بیشتر از آیکون
    }
}));


const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
        },
    },
    '@keyframes ripple': {
        '0%': {
            transform: 'scale(.8)',
            opacity: 1,
        },
        '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
        },
    },
}));

const ChatElement = () => {
    return (
        <Box sx={{
            width: "100%",
            height: 60,
            backgroundColor: "#fff",
            borderRadius: 1
        }} p={2}>
            <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                <Stack direction={'row'} spacing={2}>
                    <StyledBadge overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot">
                        <Avatar src={avatar} />
                    </StyledBadge>
                    <Stack spacing={0.3}>
                        <Typography variant='subtitle2'>
                            Ali
                        </Typography>
                        <Typography variant='caption'>
                            سلام حالت خوبه؟
                        </Typography>
                    </Stack>
                    <Stack spacing={2} alignItems={'center'} sx={{
                        position: 'fixed',
                        right: 1129
                    }}>
                        <Typography sx={{ fontWeight: 600 }} variant='caption'>
                            9:36
                        </Typography>
                        <Badge color='primary' badgeContent={2}>

                        </Badge>

                    </Stack>
                </Stack>
            </Stack>
        </Box>
    )
}



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
                <Stack sx={{ padding: 3 }}>
                    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                        <Typography variant='h5'>
                            Chats
                        </Typography>
                        <IconButton>
                            <CircleDashed />
                        </IconButton>
                    </Stack>
                    <Stack sx={{ width: "100%" }}>
                        <Search spacing={2}>
                            <SearchIconWrapper>
                                <MagnifyingGlass color='#709CE6' />
                            </SearchIconWrapper>
                            <StyledInputBase placeholder='Search...' />
                        </Search>
                    </Stack>
                    <Stack spacing={2.5}>
                        <Stack direction={'row'} alignItems={'center'} spacing={3.3} sx={{
                            paddingTop: 1,
                            paddingLeft: 1,
                            paddingBottom: 0
                        }}>
                            <ArchiveBox size={24} />
                            <Button>
                                Archived
                            </Button>
                        </Stack>
                        <Divider />
                    </Stack>
                    <Stack direction={"column"}>
                        <Stack spacing={2.4}>
                            <Typography variant='subtitle2' sx={{
                                color: '#676767'
                            }}>
                                Pinned
                            </Typography>
                            <ChatElement />
                        </Stack>

                    </Stack>
                </Stack>
            </Box>
        </div>
    );
};

export default Chats;
