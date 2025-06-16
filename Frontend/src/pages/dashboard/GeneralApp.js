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

"use client"

import { lazy } from "react"
import Chats from "./Chats"
import { Box, Stack } from "@mui/material"
import Conversation from "../../components/Conversation"
import { useTheme } from "@mui/material/styles"
import Contact from "../../components/Contact"
import Profile from "../../layouts/dashboard/Profile"
// import { useSelector } from "react-redux"

const Cat = lazy(() => import("../../components/Cat"))

const GeneralApp = () => {
  const theme = useTheme()
  // const app =  useSelector((store)=> store.app);
  // console.log(app , 'app');

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


// "use client"

// import { Box, Stack } from "@mui/material"
// import { useTheme } from "@mui/material/styles"
// import Chats from "./Chats"
// import Conversation from "../../components/Conversation/Chat"
// import Contact from "../../components/Contact"
// import { useState } from "react"

// const GeneralApp = () => {
//   const theme = useTheme()
//   const [showContact, setShowContact] = useState(true)

//   return (
//     <Stack direction="row">
//       {/* Sidebar for chats */}
//       <Chats />

//       {/* Main conversation area */}
//       <Box
//         sx={{
//           position: "fixed",
//           top: 30,
//           left: 420,
//           height: "100vh",
//           width: showContact ? "calc(100vw - 420px - 320px)" : "calc(100vw - 420px)",
//           backgroundColor: theme.palette.mode === "light" ? "#F0F4FA" : theme.palette.background.paper,
//           transition: "width 0.3s ease",
//         }}
//       >
//         <Conversation onToggleContact={() => setShowContact(!showContact)} />
//       </Box>

//       {/* Contact/Details panel */}
//       {showContact && <Contact />}
//     </Stack>
//   )
// }

// export default GeneralApp
