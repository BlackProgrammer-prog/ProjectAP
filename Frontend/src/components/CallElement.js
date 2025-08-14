// import { faker } from '@faker-js/faker'
// import { Avatar, Box, Stack, Typography, useTheme } from '@mui/material'
// import React from 'react'

// const CallLogElement = () => {
//     const Theme = useTheme()
//     return (
//         <>
//             <Box sx={{
//                 position:'fixed',
//                 width: 320,
//                 height: '550px',
//                 top: 220,
//                 left: 100,
//                 backgroundColor: Theme.palette.mode === "light" ? '#F8FAFF' : Theme.palette.background.paper,
//                 boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
//                 borderRadius: '0px 8px',
//             }}>
//                 <Stack sx={{
//                     position:'absolute',
//                     left:29
//                 }}>
//                     <Avatar style={{width:50 , height:50}} src={faker.image.avatar()} alt={faker.name.fullName()}/>
//                 </Stack>

//             </Box>
//         </>
//     )
// }

// const CallElement = () => {
//     return (
//         <div>CallElement</div>
//     )
// }

// export  { CallElement, CallLogElement }



// ==============================================================



import React, { useState } from "react";
import {
    Box,
    Badge,
    Stack,
    Avatar,
    Typography,
    IconButton,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import {
    ArrowDownLeft,
    ArrowUpRight,
    VideoCamera,
    Phone,
} from "phosphor-react";
import { useDispatch } from "react-redux";
import { faker } from "@faker-js/faker";
import StartCall from "../pages/dashboard/StartCall";
import { useNavigate } from "react-router-dom";
// import { StartAudioCall } from "../redux/slices/audioCall";
// import { StartVideoCall } from "../redux/slices/videoCall";
// import { AWS_S3_REGION, S3_BUCKET_NAME } from "../config";

const StyledChatBox = styled(Box)(({ theme }) => ({
    "&:hover": {
        cursor: "pointer",
    },
}));

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

const CallLogElement = ({ img, name, incoming, missed, online, id }) => {
    const theme = useTheme();

    return (
        <StyledChatBox
            sx={{
                width: "100%",

                borderRadius: 1,

                backgroundColor: theme.palette.background.paper,
            }}
            p={2}
        >
            <Stack
                direction="row"
                alignItems={"center"}
                justifyContent="space-between"
            >
                <Stack direction="row" spacing={2}>
                    {" "}
                    {online ? (
                        <StyledBadge
                            overlap="circular"
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            variant="dot"
                        >
                            <Avatar alt={faker.name.fullName()} src={faker.image.avatar()} />
                        </StyledBadge>
                    ) : (
                        <Avatar alt={faker.name.fullName()} src={faker.image.avatar()} />
                    )}
                    <Stack spacing={0.3}>
                        <Typography variant="subtitle2">{name}</Typography>
                        <Stack spacing={1} alignItems="center" direction={"row"}>
                            {incoming ? (
                                <ArrowDownLeft color={missed ? "red" : "green"} />
                            ) : (
                                <ArrowUpRight color={missed ? "red" : "green"} />
                            )}
                            <Typography variant="caption">Yesterday 21:24</Typography>
                        </Stack>
                    </Stack>
                </Stack>
                <Stack>
                    <IconButton style={{ width: 35, height: 35 }}>
                        <Phone color="green" />
                    </IconButton>
                    <IconButton style={{ width: 35, height: 35 }}>
                        <VideoCamera color="green" />
                    </IconButton>
                </Stack>
            </Stack>
        </StyledChatBox>
    );
};

const CallElement = ({ img, name, id, handleClose, online }) => {
    // const dispatch = useDispatch();
    const theme = useTheme();
    const navigate = useNavigate()
    const [showStartCall, setShowStartCall] = useState(false);

    const handleStartCallClick = () => {
        setShowStartCall(true);
    };

    return (
        <StyledChatBox
            sx={{
                width: "100%",

                borderRadius: 1,

                backgroundColor: theme.palette.background.paper
            }}
            p={2}
        >
            <Stack
                direction="row"
                alignItems={"center"}
                justifyContent="space-between"
            >
                <Stack direction="row" spacing={2}>
                    {online ? (
                        <StyledBadge
                            overlap="circular"
                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                            variant="dot"
                        >
                            <Avatar alt={faker.name.fullName()} src={faker.image.avatar()} />
                        </StyledBadge>
                    ) : (
                        <Avatar alt={faker.name.fullName()} src={faker.image.avatar()} />
                    )}
                    <Stack spacing={0.3} alignItems="center" direction={"row"}>
                        <Typography variant="subtitle2">{faker.name.fullName()}</Typography>
                    </Stack>
                </Stack>
                <Stack direction={"row"} spacing={2} alignItems={"center"}>
                    <IconButton
                    // onClick={() => {
                    //     dispatch(StartAudioCall(id));
                    //     handleClose();
                    // }}
                    >
                        <Phone color="green" />
                        {/* style={{ color: theme.palette.primary.main }} */}
                    </IconButton>

                    <IconButton
                        onClick={()=> navigate('/video-call')}
                    >
                        <VideoCamera style={{ color: theme.palette.primary.main }} />
                    </IconButton>
                </Stack>
            </Stack>
            {showStartCall && <StartCall />}
        </StyledChatBox>
    );
};

export { CallLogElement, CallElement };


// ============================================
