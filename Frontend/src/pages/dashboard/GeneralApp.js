import React, { lazy, Suspense } from "react";
import Chats from "./Chats";
import { Box, Stack } from "@mui/material";
import Conversation from "../../components/Conversation";
import { useTheme } from "@emotion/react";

const Cat = lazy(() => import("../../components/Cat"));

const GeneralApp = () => {
  const theme = useTheme()
  return (
    <Stack direction={"row"} sx={{ width: 'auto' }}>
      <Chats />
      <Box sx={{
        height: '100%', width: "calc(100vw - 420px)",
        backgroundColor: theme.palette.mode === 'light' ? '#fff' : theme.palette.background.default,
        position: "relative", top: 0, left: 410
      }}>
        <Conversation />
      </Box>
    </Stack>
  );
};

export default GeneralApp;