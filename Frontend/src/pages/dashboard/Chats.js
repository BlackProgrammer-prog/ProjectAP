import { alpha, Avatar, Badge, Box, Button, Divider, IconButton, InputBase, Stack, styled, Typography, useTheme } from '@mui/material';
import { ArchiveBox, CircleDashed, MagnifyingGlass } from 'phosphor-react';
import React, { useState, useEffect } from 'react';
import { faker } from '@faker-js/faker';
import { Link } from "react-router-dom";
import { PATH_DASHBOARD } from "../../routes/paths";
import { loadPrivateChat } from "../../utils/chatStorage";
import { loadPV } from "../../utils/pvStorage";
import { resolveAvatarUrl } from "../../utils/resolveAvatarUrl";
import { format, isToday, isYesterday, isThisYear } from "date-fns";

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

// تابع برای دریافت آخرین پیام از چت خصوصی (کلید چت = customUrl)
const getLastMessage = (chatKey) => {
  try {
    const privateChat = loadPrivateChat(chatKey);
    if (privateChat && privateChat.length > 0) {
      const lastMessage = privateChat[privateChat.length - 1];
      return lastMessage.message || "No messages yet";
    }
  } catch (error) {
    console.error("Error loading last message:", error);
  }
  return "No messages yet";
};

// تابع برای دریافت زمان آخرین پیام
const getLastMessageTime = (chatKey) => {
  try {
    const privateChat = loadPrivateChat(chatKey);
    if (privateChat && privateChat.length > 0) {
      const lastMessage = privateChat[privateChat.length - 1];
      if (lastMessage.timestamp) {
        const messageDate = new Date(lastMessage.timestamp);
        const now = new Date();

        // اگر پیام امروز است
        if (isToday(messageDate)) {
          return format(messageDate, "HH:mm");
        }
        // اگر پیام دیروز است
        else if (isYesterday(messageDate)) {
          return "Yesterday";
        }
        // اگر پیام در همین سال است
        else if (isThisYear(messageDate)) {
          return format(messageDate, "MMM d");
        }
        // اگر پیام سال‌های قبل است
        else {
          return format(messageDate, "MMM d, yyyy");
        }
      }
    }
  } catch (error) {
    console.error("Error loading last message time:", error);
  }
  return " ";
};

const ChatElement = ({ id, name, msg, time, unread, img, online, username }) => {
  const Theme = useTheme();
  const [lastMessage, setLastMessage] = useState(msg);
  const [lastMessageTime, setLastMessageTime] = useState(time);

  // به‌روزرسانی آخرین پیام و زمان هر 2 ثانیه
  useEffect(() => {
    const interval = setInterval(() => {
      const newLastMessage = getLastMessage(username);
      const newLastMessageTime = getLastMessageTime(username);
      setLastMessage(newLastMessage);
      setLastMessageTime(newLastMessageTime);
    }, 2000);

    return () => clearInterval(interval);
  }, [username]);

  return (
    <Link
      to={PATH_DASHBOARD.general.chat(username)}
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
                <Avatar src={resolveAvatarUrl(img) || avatar} />
              </StyledBadge>
            ) : (
              <Avatar src={resolveAvatarUrl(img) || avatar} />
            )}

            <Stack spacing={0.3}>
              <Typography variant='subtitle2'>{name}</Typography>
              <Typography variant='caption' sx={{ color: Theme.palette.text.secondary }}>
                {lastMessage}
              </Typography>
            </Stack>
          </Stack>
          <Stack spacing={2} alignItems={'center'}>
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                color: Theme.palette.text.secondary
              }}
              variant='caption'
            >
              {lastMessageTime}
            </Typography>
            {unread > 0 && (
              <Badge color='primary' badgeContent={unread}></Badge>
            )}
          </Stack>
        </Stack>
      </Box>
    </Link>
  );
};

const Chats = () => {
  const Theme = useTheme();
  // chatList از PV ساخته می‌شود. username را به عنوان کلید چت = customUrl نگه می‌داریم
  const [chatList, setChatList] = useState(() => {
    const pv = loadPV();
    return (pv || []).map((p, idx) => ({
      id: p.email || idx,
      username: p.customUrl, // کلید چت و پارام در URL
      name: p.fullName || p.username || p.email,
      img: p.avatarUrl,
      msg: getLastMessage(p.customUrl),
      time: getLastMessageTime(p.customUrl),
      unread: 0,
      pinned: false,
      online: false,
    }));
  });

  // بروزرسانی دوره‌ای پیام/زمان و گوش دادن به تغییر PV از storage
  useEffect(() => {
    const interval = setInterval(() => {
      setChatList((prev) =>
        prev.map((chat) => ({
          ...chat,
          msg: getLastMessage(chat.username),
          time: getLastMessageTime(chat.username),
        }))
      );
    }, 3000);

    const onStorage = (e) => {
      if (e.storageArea === localStorage && e.key === 'PV') {
        const pv = loadPV();
        const next = (pv || []).map((p, idx) => ({
          id: p.email || idx,
          username: p.customUrl,
          name: p.fullName || p.username || p.email,
          img: p.avatarUrl,
          msg: getLastMessage(p.customUrl),
          time: getLastMessageTime(p.customUrl),
          unread: 0,
          pinned: false,
          online: false,
        }));
        setChatList(next);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

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
              {chatList.filter((el) => el.pinned).map((el) => (
                <ChatElement key={el.id} {...el} username={el.username} />
              ))}
            </Stack>
            <Stack spacing={2.4}>
              <Typography variant='subtitle2' sx={{ color: '#676767' }}>All Chat</Typography>
              {chatList.filter((el) => !el.pinned).map((el) => (
                <ChatElement key={el.id} {...el} username={el.username} />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </div>
  );
};

export default Chats;