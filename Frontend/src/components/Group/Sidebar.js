import React, { useEffect, useState, useCallback, useRef } from 'react';
import { alpha, Avatar, Box, Divider, IconButton, InputBase, Stack, styled, Typography, useTheme } from '@mui/material';
import { CaretLeft, MagnifyingGlass, Plus } from 'phosphor-react';
import { faker } from '@faker-js/faker';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import webSocketService from '../../Login/Component/Services/WebSocketService';
import { loadGroups, upsertGroup } from '../../utils/groupStorage';
import CreateGroup from '../../pages/dashboard/CreateGroup';

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

const GroupSidebar = () => {
    const Theme = useTheme();
    const navigate = useNavigate();
    const { token, user, isAuthenticated } = useAuth();
    const [openDialog, setOpenDialog] = useState(false);
    const [groups, setGroups] = useState(() => loadGroups());
    const requestedMyGroupsRef = useRef(new Set());

    const handleCloseDialog = () => setOpenDialog(false);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.storageArea === localStorage && e.key === 'GROUPS') {
                setGroups(loadGroups());
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !token || !user?.email) return;
        webSocketService.send({ type: 'get_user_groups_by_email', token, email: user.email });
    }, [isAuthenticated, token, user]);

    const handleWs = useCallback((raw) => {
        let data;
        try { data = JSON.parse(raw); } catch { return; }
        if (!data) return;
        if (data.type === 'get_user_groups_by_email_response' || Array.isArray(data.group_ids)) {
            if (data.status === 'success' && Array.isArray(data.group_ids)) {
                (data.group_ids || []).forEach((gid) => {
                    try {
                        const key = String(gid);
                        requestedMyGroupsRef.current.add(key);
                        if (token && (typeof gid === 'string' || typeof gid === 'number')) {
                            webSocketService.send({ type: 'get_group_info', token, group_id: gid });
                        }
                    } catch {}
                });
            }
            return;
        }
        if (data.type === 'get_group_info_response' || (data.status === 'success' && data.group && (data.group.id || data.group.custom_url))) {
            if (data.status === 'success' && data.group) {
                const key = String(data.group.id ?? data.group.custom_url);
                // Block invited-only groups from being upserted here
                const pendingInvites = (() => {
                    try { return new Set((JSON.parse(localStorage.getItem('PENDING_INVITES') || '[]') || []).map(String)); } catch { return new Set(); }
                })();
                if (!requestedMyGroupsRef.current.has(key)) return;
                if (pendingInvites.has(key)) return;
                upsertGroup(data.group);
                setGroups(loadGroups());
            }
            return;
        }
        if ((data.type === 'join_group_response' || data.type === 'join_group') && data.status === 'success') {
            // refresh my groups after successful join
            try { if (token && user?.email) webSocketService.send({ type: 'get_user_groups_by_email', token, email: user.email }); } catch {}
            return;
        }
    }, [token]);

    useEffect(() => {
        if (!isAuthenticated) return;
        const off = webSocketService.addGeneralListener(handleWs);
        return () => off && off();
    }, [isAuthenticated, handleWs]);

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
                        <Typography variant='h5'>Groups</Typography>
                        <IconButton onClick={() => navigate("/app")}>
                            <CaretLeft size={25} />
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
                        <Stack direction={'row'} alignItems={'center'} spacing={11.3} sx={{ paddingTop: 1, paddingLeft: 1 }}>
                            <Typography variant='subtitle2'>
                                Create New Group
                            </Typography>
                            <IconButton style={{ marginLeft: 100 }} onClick={() => setOpenDialog(true)}>
                                <Plus style={{ color: Theme.palette.primary.main }} />
                            </IconButton>
                        </Stack>
                        <Divider />
                    </Stack>
                    <Stack direction={"column"} sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'scroll' }}>
                        <Stack spacing={2.4}>
                            <Typography variant='subtitle2' sx={{ color: '#676767' }}>All Groups</Typography>
                            {groups.map((g) => (
                                <Link
                                    key={g.id}
                                    to={`/app/group/${g.custom_url || g.id}`}
                                    style={{ textDecoration: 'none', display: 'block', width: '100%' }}
                                >
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: 60,
                                            backgroundColor: Theme.palette.mode === 'light' ? '#fff' : Theme.palette.background.paper,
                                            borderRadius: 1,
                                            '&:hover': { backgroundColor: Theme.palette.mode === 'light' ? '#f5f5f5' : Theme.palette.action.hover, cursor: 'pointer' }
                                        }}
                                        p={2}
                                    >
                                        <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'}>
                                            <Stack direction={'row'} spacing={2}>
                                                <Avatar src={g.profile_image || avatar} />
                                                <Stack spacing={0.3}>
                                                    <Typography variant='subtitle2'>{g.name}</Typography>
                                                    <Typography variant='caption'>Group</Typography>
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </Link>
                            ))}
                        </Stack>
                    </Stack>
                </Stack>
            </Box>

            {openDialog && <CreateGroup open={openDialog} handleClose={handleCloseDialog} />}
        </>
    );
};

export default GroupSidebar;




