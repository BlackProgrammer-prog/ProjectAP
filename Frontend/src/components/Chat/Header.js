import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  Fade,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CaretDown, MagnifyingGlass, Phone, VideoCamera } from "phosphor-react";
import { faker } from "@faker-js/faker";
import { useSearchParams, useParams } from "react-router-dom";
import { loadPV } from "../../utils/pvStorage";
import { resolveAvatarUrl } from "../../utils/resolveAvatarUrl";
import useResponsive from "../../hooks/useResponsive";
import { useVideoCall } from "../../contexts/VideoCallContext";
import { useAuth } from "../../Login/Component/Context/AuthContext";
import webSocketService from "../../Login/Component/Services/WebSocketService";

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const Conversation_Menu = [
  {
    title: "Contact info",
  },
  {
    title: "Mute notifications",
  },
  {
    title: "Clear messages",
  },
  {
    title: "Delete chat",
  },
];

const ChatHeader = () => {
  const isMobile = useResponsive("between", "md", "xs", "sm");
  const [searchParams, setSearchParams] = useSearchParams();
  const { username } = useParams();
  const theme = useTheme();
  const { startCall } = useVideoCall();
  const { token } = useAuth();

  const [conversationMenuAnchorEl, setConversationMenuAnchorEl] =
    React.useState(null);
  const openConversationMenu = Boolean(conversationMenuAnchorEl);
  const handleClickConversationMenu = (event) => {
    setConversationMenuAnchorEl(event.currentTarget);
  };
  const handleCloseConversationMenu = () => {
    setConversationMenuAnchorEl(null);
  };

  const [online, setOnline] = React.useState(false);
  const [profile, setProfile] = React.useState(null);

  // Poll PV every 1.5s to reflect presence updates set by ContactsContext
  React.useEffect(() => {
    const update = () => {
      const pv = loadPV();
      const u = (pv || []).find((p) => p && (p.customUrl === username || p.username === username || p.email === username)) || null;
      setProfile(u);
      setOnline(!!u && Number(u.status) === 1);
    };
    update();
    const interval = setInterval(update, 1500);
    return () => clearInterval(interval);
  }, [username]);

  return (
    <Box
      p={2}
      width={"100%"}
      sx={{
        backgroundColor:
          theme.palette.mode === "light" ? "#F8FAFF" : theme.palette.background,
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Stack
        alignItems={"center"}
        direction={"row"}
        sx={{ width: "100%", height: "100%" }}
        justifyContent="space-between"
      >
        <Stack
          onClick={() => {
            searchParams.set("open", true);
            setSearchParams(searchParams);
          }}
          spacing={2}
          direction="row"
        >
          <Box>
            {(() => {
              const u = profile || {};
              const name = u.fullName || u.username || u.email || faker.name.fullName();
              const avatar = resolveAvatarUrl(u.avatarUrl) || faker.image.avatar();
              // Only show green badge when online; otherwise plain avatar without dot
              if (online) {
                return (
                  <StyledBadge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    variant="dot"
                  >
                    <Avatar alt={name} src={avatar} />
                  </StyledBadge>
                );
              }
              return <Avatar alt={name} src={avatar} />;
            })()}
          </Box>
          <Stack spacing={0.2}>
            {(() => {
              const u = profile || {};
              const name = u.fullName || u.username || u.email || faker.name.fullName();
              return <Typography variant="subtitle2">{name}</Typography>;
            })()}
            {online ? (
              <Typography variant="caption" color={'success.main'}>
                Online
              </Typography>
            ) : null}
          </Stack>
        </Stack>
        <Stack direction={"row"} alignItems="center" spacing={isMobile ? 1 : 3}>
          <IconButton
            onClick={() => {
              try {
                const pv = loadPV();
                const u = (pv || []).find((p) => p && (p.customUrl === username || p.username === username || p.email === username));
                const toUserId = u && (u.user_id || u.id || u.userId);
                if (toUserId) { startCall(String(toUserId)); return; }

                // If numeric id is not available, immediately try alias-based dialing (email/username/customUrl)
                const targetIdentity = (u && (u.email || u.username || u.customUrl)) || username || null;
                if (targetIdentity) { startCall(String(targetIdentity)); return; }

                // Fallback: request profile then start when id arrives
                const targetEmail = (u && u.email) || (username && username.includes('@') ? username : null) || (u && u.username) || null;
                const httpResolve = async (identity) => {
                  try {
                    if (!identity) return false;
                    const resp = await fetch('http://localhost:5000/resolve-user', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ identity })
                    });
                    const data = await resp.json().catch(() => null);
                    if (resp.ok && data && data.status === 'success' && data.userId) {
                      startCall(String(data.userId));
                      return true;
                    }
                  } catch {}
                  return false;
                };
                if (token && targetEmail) {
                  let resolved = false;
                  const off = webSocketService.addGeneralListener((raw) => {
                    let data; try { data = JSON.parse(raw); } catch { return; }
                    if ((data?.type === 'get_profile_response' || data?.profile) && data?.status === 'success' && data?.profile) {
                      const same = String(data.profile.email || data.profile.username || '').toLowerCase() === String(targetEmail).toLowerCase();
                      if (!same) return;
                      const id = data.profile.user_id || data.profile.id || data.profile.userId;
                      if (id && !resolved) { resolved = true; off && off(); startCall(String(id)); }
                    }
                  });
                  try { webSocketService.send({ type: 'get_profile', token, email: targetEmail }); } catch {}
                  setTimeout(async () => {
                    if (!resolved) {
                      off && off();
                      const ok = await httpResolve(targetEmail);
                      if (!ok) alert('شناسه کاربر برای تماس پیدا نشد');
                    }
                  }, 1500);
                  return;
                }

                // Final fallback: try HTTP resolver with provided username/email
                (async () => {
                  const identity = targetEmail || username || null;
                  const ok = await httpResolve(identity);
                  if (!ok) alert('شناسه کاربر برای تماس پیدا نشد');
                })();
              } catch { alert('شناسه کاربر برای تماس پیدا نشد'); }
            }}
          >
            <VideoCamera />
          </IconButton>
          <IconButton>
            <Phone />
          </IconButton>
          {!isMobile && (
            <IconButton>
              <MagnifyingGlass />
            </IconButton>
          )}

          <Divider orientation="vertical" flexItem />
          <IconButton
            id="conversation-positioned-button"
            aria-controls={
              openConversationMenu ? "conversation-positioned-menu" : undefined
            }
            aria-haspopup="true"
            aria-expanded={openConversationMenu ? "true" : undefined}
            onClick={handleClickConversationMenu}
          >
            <CaretDown />
          </IconButton>
          <Menu
            MenuListProps={{
              "aria-labelledby": "fade-button",
            }}
            TransitionComponent={Fade}
            id="conversation-positioned-menu"
            aria-labelledby="conversation-positioned-button"
            anchorEl={conversationMenuAnchorEl}
            open={openConversationMenu}
            onClose={handleCloseConversationMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <Box p={1}>
              <Stack spacing={1}>
                {Conversation_Menu.map((el) => (
                  <MenuItem onClick={handleCloseConversationMenu}>
                    <Stack
                      sx={{ minWidth: 100 }}
                      direction="row"
                      alignItems={"center"}
                      justifyContent="space-between"
                    >
                      <span>{el.title}</span>
                    </Stack>{" "}
                  </MenuItem>
                ))}
              </Stack>
            </Box>
          </Menu>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ChatHeader;
