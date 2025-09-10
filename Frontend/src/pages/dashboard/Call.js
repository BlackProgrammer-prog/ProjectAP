// import { alpha, Avatar, Badge, Box, Button, Divider, IconButton, InputBase, Stack, styled, Typography, useTheme } from '@mui/material';
// import { ArchiveBox, CircleDashed, MagnifyingGlass, Plus, Rows, Users } from 'phosphor-react';
// import React, { useState } from 'react';
// import { faker } from '@faker-js/faker';
// import { ChatList } from '../../data';
// import { Link } from "react-router-dom";
// import { PATH_DASHBOARD } from "../../routes/paths";
// import CreateGroup from './CreateGroup';


// const avatar = faker.image.avatar();


// const Search = styled("div")(({ theme }) => ({
//     position: 'relative',
//     borderRadius: 20,
//     backgroundColor: alpha(theme.palette.background.paper, 1),
//     marginRight: theme.spacing(2),
//     marginLeft: 0,
//     width: "100%",
//     display: 'flex',
//     alignItems: 'center',
// }));

// const SearchIconWrapper = styled('div')(({ theme }) => ({
//     padding: theme.spacing(0, 1),
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
// }));

// const StyledInputBase = styled(InputBase)(({ theme }) => ({
//     color: 'inherit',
//     padding: theme.spacing(1, 1, 1, 2),
//     width: "100%",
//     '& .MuiInputBase-input': {
//         paddingLeft: theme.spacing(2),
//     },
// }));

// const StyledBadge = styled(Badge)(({ theme }) => ({
//     '& .MuiBadge-badge': {
//         backgroundColor: '#44b700',
//         color: '#44b700',
//         boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
//         '&::after': {
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             width: '100%',
//             height: '100%',
//             borderRadius: '50%',
//             animation: 'ripple 1.2s infinite ease-in-out',
//             border: '1px solid currentColor',
//             content: '""',
//         },
//     },
//     '@keyframes ripple': {
//         '0%': { transform: 'scale(.8)', opacity: 1 },
//         '100%': { transform: 'scale(2.4)', opacity: 0 },
//     },
// }));


// const ChatElement = ({ id, name, msg, time, unread, img, online }) => {
//     const Theme = useTheme();
//     return (
//         <Link
//             to={PATH_DASHBOARD.general.chat(id)} // استفاده از تابع chat از PATH_DASHBOARD
//             style={{
//                 textDecoration: 'none',
//                 display: 'block',
//                 width: "100%"
//             }}
//         >
//             <Box
//                 sx={{
//                     width: "100%",
//                     height: 60,
//                     backgroundColor: Theme.palette.mode === "light" ? "#fff" : Theme.palette.background.paper,
//                     borderRadius: 1,
//                     '&:hover': {
//                         backgroundColor: Theme.palette.mode === "light" ? "#f5f5f5" : Theme.palette.action.hover,
//                         cursor: 'pointer'
//                     }
//                 }}
//                 p={2}
//             >
//                 <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
//                     <Stack direction={'row'} spacing={2}>
//                         {online ? (
//                             <StyledBadge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot">
//                                 <Avatar src={img || avatar} /> {/* استفاده از تصویر مخاطب اگر وجود دارد */}
//                             </StyledBadge>
//                         ) : (
//                             <Avatar src={img || avatar} />
//                         )}

//                         <Stack spacing={0.3}>
//                             <Typography variant='subtitle2'>{name}</Typography>
//                             <Typography variant='caption'>{msg}</Typography>
//                         </Stack>
//                     </Stack>
//                     <Stack spacing={2} alignItems={'center'}>
//                         <Typography sx={{ fontWeight: 600 }} variant='caption'>{time}</Typography>
//                         {unread > 0 && ( // فقط اگر پیام خوانده نشده وجود دارد نشان داده شود
//                             <Badge color='primary' badgeContent={unread}></Badge>
//                         )}
//                     </Stack>
//                 </Stack>
//             </Box>
//         </Link>
//     );
// };



// const Call = () => {
//     const Theme = useTheme();
//     const [openCall, setOpenCall] = useState(false)
//     const handleCloseCall = () => {
//         setOpenCall(false)
//     }
//     return (
//         <>
//             {/* Left */}
//             <Box
//                 sx={{
//                     position: 'absolute',
//                     width: 320,
//                     height: '100vh',
//                     top: 0,
//                     left: 100,
//                     backgroundColor: Theme.palette.mode === "light" ? '#F8FAFF' : Theme.palette.background.paper,
//                     boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
//                     borderRadius: '8px',
//                     zIndex: 1000
//                 }}
//             >
//                 <Stack sx={{ padding: 3 }} spacing={1}>
//                     <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
//                         <Typography variant='h5'>Call </Typography>
//                         <IconButton>
//                             {/* <CircleDashed /> */}

//                         </IconButton>
//                     </Stack>
//                     <Stack sx={{ width: "100%" }}>
//                         <Search>
//                             <SearchIconWrapper>
//                                 <MagnifyingGlass color='#709CE6' />
//                             </SearchIconWrapper>
//                             <StyledInputBase placeholder='Search...' />
//                         </Search>
//                     </Stack>
//                     <Stack spacing={2.5}>
//                         <Stack direction={'row'} alignItems={'center'} spacing={11.3} sx={{ paddingTop: 1, paddingLeft: 1 }}>
//                             {/* <ArchiveBox size={24} />
//                             <Button>Archived</Button> */}
//                             <Typography variant='subtitle2' component={Link}>
//                                 Create New Call
//                             </Typography>
//                             <IconButton onClick={() => {
//                                 setOpenCall(true)
//                             }}>
//                                 <Plus style={{ color: Theme.palette.primary.main }} />
//                             </IconButton>
//                         </Stack>
//                         <Divider />
//                     </Stack>
//                     <Stack direction={"column"} sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'scroll' }}>
//                         {/* <Stack spacing={2.4}>
//                             <Typography variant='subtitle2' sx={{ color: '#676767' }}>Pinned</Typography>
//                             {ChatList.filter((el) => el.pinned).map((el) => (
//                                 <ChatElement {...el} />
//                             ))}
//                         </Stack> */}
//                         <Stack spacing={2.4}>
//                             <Typography variant='subtitle2' sx={{ color: '#676767' }}>All Call</Typography>
//                             {/* {ChatList.filter((el) => !el.pinned).map((el) => (
//                                 <ChatElement {...el} />
//                             ))} */}
//                         </Stack>
//                     </Stack>
//                 </Stack>
//             </Box>

//             {/* .................................................... */}
//             {/* Right  */}
//         </>
//     )
// }

// export default Call

// ========================================================================

import { alpha, Box, Divider, IconButton, InputBase, Stack, styled, Typography, useTheme } from '@mui/material';
import { CaretLeft, MagnifyingGlass, PhoneCall } from 'phosphor-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CallLogElement } from '../../components/CallElement';
import StartCall from '../../Secctions/main/StartCall';
import { useAuth } from '../../Login/Component/Context/AuthContext';

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

const Call = () => {
    const Theme = useTheme();
    const navigate = useNavigate();
    const [openDialog, setOpenDialog] = useState(false);
    const handleCloseDialog = ()=>{
        setOpenDialog(false)
    }
    const { user } = useAuth();
    const myUserId = useMemo(() => (user && (user.user_id || user.id || user.userId)) || null, [user]);
    const [logs, setLogs] = useState([]);
    const [query, setQuery] = useState('');

    useEffect(() => {
        let abort = false;
        const fetchLogs = async () => {
            if (!myUserId) return;
            try {
                const resp = await fetch(`http://localhost:5000/call-logs?userId=${encodeURIComponent(String(myUserId))}&limit=100`);
                const data = await resp.json().catch(() => null);
                if (!abort && resp.ok && data && data.status === 'success') {
                    setLogs(Array.isArray(data.logs) ? data.logs : []);
                }
            } catch {}
        };
        fetchLogs();
        const id = setInterval(fetchLogs, 5000);
        return () => { abort = true; clearInterval(id); };
    }, [myUserId]);
    return (
        <>
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
                    zIndex: 1000
                }}
            >
                <Stack sx={{ padding: 3 }} spacing={1}>
                    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                        <Typography variant='h5'>Call Logs</Typography>
                        <IconButton onClick={() => navigate("/app")}>
                            <CaretLeft size={25} />
                        </IconButton>
                    </Stack>
                    <Stack sx={{ width: "100%" }}>
                        <Search>
                            <SearchIconWrapper>
                                <MagnifyingGlass color='#709CE6' />
                            </SearchIconWrapper>
                            <StyledInputBase placeholder='Search...' value={query} onChange={(e)=> setQuery(e.target.value)} />
                        </Search>
                    </Stack>
                    <Stack spacing={2.5}>
                        <Stack direction={'row'} alignItems={'center'} spacing={11.3} sx={{ paddingTop: 1, paddingLeft: 1 }}>
                            <Typography variant='subtitle2'>
                                Start new call
                            </Typography>
                            <Stack>
                                <IconButton style={{ marginLeft: 39 }} onClick={() => setOpenDialog(true)}>
                                    <PhoneCall style={{ color: Theme.palette.primary.main }} size={25} />
                                </IconButton>
                            </Stack>
                        </Stack>
                        <Divider />
                    </Stack>
                    <Stack direction={"column"} sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'scroll' }}>
                        <Stack spacing={2.4}>
                            {logs
                                .filter((l) => {
                                    if (!query) return true;
                                    const hay = `${l.from_user_id || ''} ${l.to_user_id || ''} ${l.call_type || ''} ${l.status || ''}`.toLowerCase();
                                    return hay.includes(String(query).toLowerCase());
                                })
                                .map((l) => {
                                    const incoming = String(l.to_user_id) === String(myUserId);
                                    const missed = String(l.status) === 'missed' || String(l.status) === 'rejected';
                                    const name = incoming ? (l.from_user_id || 'Unknown') : (l.to_user_id || 'Unknown');
                                    return (
                                        <CallLogElement
                                            key={l.call_id || `${l.id}`}
                                            id={l.id}
                                            name={String(name)}
                                            incoming={incoming}
                                            missed={missed}
                                            online={false}
                                        />
                                    );
                                })}
                        </Stack>
                    </Stack>
                </Stack>
            </Box>
            {openDialog && <StartCall  open={openDialog} handleClose={handleCloseDialog} />}
        </>
    );
};

export default Call;