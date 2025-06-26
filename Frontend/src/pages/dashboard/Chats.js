import { alpha, Avatar, Badge, Box, Button, Divider, IconButton, InputBase, Stack, styled, Typography, useTheme } from '@mui/material';
import { ArchiveBox, CircleDashed, MagnifyingGlass, Rows } from 'phosphor-react';
import React from 'react';
import { faker } from '@faker-js/faker';
import { ChatList } from '../../data';
import { Link } from "react-router-dom";
import { PATH_DASHBOARD } from "../../routes/paths";


const avatar = faker.image.avatar();

const Search = styled("div")(({ theme }) => ({
  position: 'relative',
  borderRadius: 20,
  backgroundColor: alpha(theme.palette.background.paper, 1),
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  display: 'flex',
  alignItems: 'center',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  padding: theme.spacing(1, 1, 1, 2),
  width: "100%",
  '& .MuiInputBase-input': {
    paddingLeft: theme.spacing(2),
  },
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
    '0%': { transform: 'scale(.8)', opacity: 1 },
    '100%': { transform: 'scale(2.4)', opacity: 0 },
  },
}));

// const ChatElement = ({ id, name, msg, time, unread, img, online }) => {
//     const Theme = useTheme()
//   return (
//     <Box sx={{ width: "100%", height: 60, backgroundColor: Theme.palette.mode==="light" ? "#fff" : Theme.palette.background.paper, borderRadius: 1 }} p={2}>
//       <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
//         <Stack direction={'row'} spacing={2}>
//           {online ? (
//             <StyledBadge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot">
//               <Avatar src={avatar} />
//             </StyledBadge>
//           ) : (
//             <Avatar src={avatar} />
//           )}
//           <Stack spacing={0.3}>
//             <Typography variant='subtitle2'>{name}</Typography>
//             <Typography variant='caption'>{msg}</Typography>
//           </Stack>
//         </Stack>
//         <Stack spacing={2} alignItems={'center'}>
//           <Typography sx={{ fontWeight: 600 }} variant='caption'>{time}</Typography>
//           <Badge color='primary' badgeContent={unread}></Badge>
//         </Stack>
//       </Stack>
//     </Box>
//   );
// };


const ChatElement = ({ id, name, msg, time, unread, img, online }) => {
  const Theme = useTheme();
  return (
    <Link
      to={PATH_DASHBOARD.general.chat(id)} // استفاده از تابع chat از PATH_DASHBOARD
      style={{
        textDecoration: 'none',
        display: 'block',
        width: "100%"
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: 60,
          backgroundColor: Theme.palette.mode === "light" ? "#fff" : Theme.palette.background.paper,
          borderRadius: 1,
          '&:hover': {
            backgroundColor: Theme.palette.mode === "light" ? "#f5f5f5" : Theme.palette.action.hover,
            cursor: 'pointer'
          }
        }}
        p={2}
      >
        <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
          <Stack direction={'row'} spacing={2}>
            {online ? (
              <StyledBadge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot">
                <Avatar src={img || avatar} /> {/* استفاده از تصویر مخاطب اگر وجود دارد */}
              </StyledBadge>
            ) : (
              <Avatar src={img || avatar} /> 
            )}

            <Stack spacing={0.3}>
              <Typography variant='subtitle2'>{name}</Typography>
              <Typography variant='caption'>{msg}</Typography>
            </Stack>
          </Stack>
          <Stack spacing={2} alignItems={'center'}>
            <Typography sx={{ fontWeight: 600 }} variant='caption'>{time}</Typography>
            {unread > 0 && ( // فقط اگر پیام خوانده نشده وجود دارد نشان داده شود
              <Badge color='primary' badgeContent={unread}></Badge>
            )}
          </Stack>
        </Stack>
      </Box>
    </Link>
  );
};

const Chats = () => {
  const Theme = useTheme()
  return (
    <div>
      <Box
        sx={{
          position: 'absolute',
          width: 320,
          height: '100vh',
          top: 0,
          left: 100,
          backgroundColor: Theme.palette.mode === "light" ? '#F8FAFF' : Theme.palette.background.paper,
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
          borderRadius: '8px',
          // فعال کردن اسکرول برای محتویات چت
        }}
      >
        <Stack sx={{ padding: 3 }}>
          <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
            <Typography variant='h5'>Chats</Typography>
            <IconButton>
              <CircleDashed />
            </IconButton>
          </Stack>
          <Stack sx={{ width: "100%" }}>
            <Search>
              <SearchIconWrapper>
                <MagnifyingGlass color='#709CE6' />
              </SearchIconWrapper>
              <StyledInputBase placeholder='Search...' />
            </Search>
          </Stack>
          <Stack spacing={2.5}>
            <Stack direction={'row'} alignItems={'center'} spacing={3.3} sx={{ paddingTop: 1, paddingLeft: 1 }}>
              <ArchiveBox size={24} />
              <Button>Archived</Button>
            </Stack>
            <Divider />
          </Stack>
          <Stack direction={"column"} sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'scroll' }}>
            <Stack spacing={2.4}>
              <Typography variant='subtitle2' sx={{ color: '#676767' }}>Pinned</Typography>
              {ChatList.filter((el) => el.pinned).map((el) => (
                <ChatElement {...el} />
              ))}
            </Stack>
            <Stack spacing={2.4}>
              <Typography variant='subtitle2' sx={{ color: '#676767' }}>All Chat</Typography>
              {ChatList.filter((el) => !el.pinned).map((el) => (
                <ChatElement {...el} />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </div>
  );
};

export default Chats;



// .....................................................................................


