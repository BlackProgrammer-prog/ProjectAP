// import React, { lazy, Suspense } from "react";
// import Chats from "./Chats";
// import { Box, Stack } from "@mui/material";
// import Conversation from "../../components/Conversation";
// import { useTheme } from "@emotion/react";

// const Cat = lazy(() => import("../../components/Cat"));

// const GeneralApp = () => {
//   const theme = useTheme()
//   return (
//     <Stack direction={"row"} sx={{ width: 'auto' }}>
//       <Chats />
//       <Box sx={{ height: '100%', width: "calc(100vw - 420px)",
//          backgroundColor: theme.palette.mode === 'light' ? '#2C3E50' : theme.palette.background.pape, 
//          position: "relative", top: 0, left: 410 }}>
//         <Conversation />
//       </Box>
//     </Stack>
//   );
// };

// export default GeneralApp;

// .........................................MAIN

// "use client"

import { lazy } from "react"
import Chats from "./Chats"
import { Box, Stack } from "@mui/material"
import Conversation from "../../components/Conversation"
import { useTheme } from "@mui/material/styles"

const Cat = lazy(() => import("../../components/Cat"))

const GeneralApp = () => {
  const theme = useTheme()
  return (
    <Stack direction={"row"} >
      {/* Sidebar چت‌ها */}
      <Chats />

      {/* ناحیه اصلی مکالمه */}
      <Box
        sx={{
          position: 'fixed',
          top: 30,
          left: 420,
          height: "100vh",
          width: "calc(100vw - 420px)",
          backgroundColor: theme.palette.mode === "light" ? "#F0F4FA" : theme.palette.background.paper,

        }}
      >
        <Conversation />
      </Box>
    </Stack>
  )
}

export default GeneralApp


// ...........................................................................................
