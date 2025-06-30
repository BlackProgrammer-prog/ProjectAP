// import Header from "./Header"
// import Footer from "./Footer"
// import { Stack, Box } from "@mui/material"
// import Message from "./Message"
// import { Timeline } from "./MsgType"

// const Conversation = () => {
//     return (
//         <Stack>
//             {/* chat header */}
//             <Header />

//             {/* Divider with "Today" text */}
//             <Box
//                 sx={{
//                     position: "fixed",
//                     top: "100px", // درست زیر هدر
//                     left: 422,
//                     width: "calc(100% - 422px)",
//                     px: 2,
//                 }}
//             >
//                 <Timeline text="Today" />
//             </Box>

//             <Stack
//                 direction={"row"}
//                 justifyContent={"space-between"}
//                 alignItems={"center"}
//                 sx={{
//                     position: "fixed",
//                     top: "150px", // بعد از دیوایدر
//                     left: 0,
//                     right: 0,
//                     padding: "0 20px",
//                 }}
//             >
//                 <Message />
//             </Stack>

//             {/* chat footer */}
//             <Footer />
//         </Stack>
//     )
// }

// export default Conversation


// ..........................................................MAIN

import Header from "./Header"
import Footer from "./Footer"
import { Stack, Box } from "@mui/material"
import Message from "./Message"
import { Timeline } from "./MsgType"

const Conversation = () => {
    return (
        <Stack>
            {/* chat header */}
            <Header />

            {/* Messages area with Timeline */}
            <Box
                sx={{
                    position: "fixed",
                    top: "100px",
                    left: 422,
                    right: 0,
                    bottom: "80px", // فضا برای footer
                    overflowY: "auto",
                    px: 2,
                }}
            >
                <Stack spacing={2} sx={{ pt: 2 }}>
                    {/* Timeline در بالای پیام‌ها */}
                    <Timeline text="Today" />
                    <Message />
                </Stack>
            </Box>

            {/* chat footer */}
            <Footer />
        </Stack>
    )
}

export default Conversation


// ..................................................................................


// "use client"

// import { Stack, Box } from "@mui/material"
// import Header from "./Header"
// import Footer from "./Footer"
// import Message from "./Message"
// import { Timeline } from "./MsgType"

// const Conversation = ({ onToggleContact }) => {
//     return (
//         <Stack>
//             {/* Chat header */}
//             <Header onToggleContact={onToggleContact} />

//             {/* Messages area with Timeline */}
//             <Box
//                 sx={{
//                     position: "fixed",
//                     top: "100px",
//                     left: 422,
//                     right: 320,
//                     bottom: "80px",
//                     overflowY: "auto",
//                     px: 2,
//                 }}
//             >
//                 <Stack spacing={2} sx={{ pt: 2 }}>
//                     {/* Timeline at the top of messages */}
//                     <Timeline text="Today" />
//                     <Message />
//                 </Stack>
//             </Box>

//             {/* Chat footer */}
//             <Footer />
//         </Stack>
//     )
// }

// export default Conversation
