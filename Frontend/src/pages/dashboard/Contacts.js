import React, { useState, useCallback } from 'react';
import { Box, Typography, Stack, Avatar, IconButton, Button, Divider, CircularProgress } from '@mui/material';
import { UserPlus, Trash } from 'phosphor-react';
import { useContacts } from '../../contexts/ContactsContext';
import AddContactDialog from './AddContactDialog';
import { faker } from '@faker-js/faker';
import webSocketService from '../../Login/Component/Services/WebSocketService';
import { useAuth } from '../../Login/Component/Context/AuthContext';
import { loadPV, getStoredEmails } from '../../utils/pvStorage';
import { resolveAvatarUrl } from '../../utils/resolveAvatarUrl';
import QREmailDialog from './QREmailDialog';
import QRScanDialog from './QRScanDialog';

const ContactElement = ({ contact, onClick }) => {
    const { removeContact } = useContacts();

    // --- THE FIX IS HERE ---
    // 1. Determine online status from numeric value.
    const isOnline = contact.status === 1;

    // Avatar from PV by matching email/username/customUrl
    const pv = loadPV();
    const pvMatch = (pv || []).find((p) =>
        (contact?.email && p?.email === contact.email) ||
        (contact?.username && p?.username === contact.username) ||
        (contact?.customUrl && p?.customUrl === contact.customUrl)
    );
    const avatarSrc = resolveAvatarUrl(pvMatch?.avatarUrl) || faker.image.avatar();

    return (
        <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
                p: 1.5,
                backgroundColor: (theme) => theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: (theme) => theme.shadows[1],
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': { boxShadow: (theme) => theme.shadows[4] }
            }}
            onClick={onClick}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={avatarSrc} />
                <Stack>
                    {/* 2. Display username, but fallback to email if it doesn't exist. */}
                    <Typography variant="subtitle1" fontWeight={600}>
                        {contact.username || contact.email}
                    </Typography>
                    {/* 3. Display text status based on the isOnline boolean. */}
                    <Typography variant="body2" color={isOnline ? 'primary.main' : 'text.secondary'}>
                        {isOnline ? 'Online' : 'Offline'}
                    </Typography>
                </Stack>
            </Stack>
            <IconButton onClick={(e) => { e.stopPropagation(); removeContact(contact.email); }} color="error">
                <Trash />
            </IconButton>
        </Stack>
    );
};


const Contacts = () => {
    const { contacts, isLoading, error } = useContacts();
    const { token, isAuthenticated, user } = useAuth();
    const [openDialog, setOpenDialog] = useState(false);
    const [openQR, setOpenQR] = useState(false);
    const [openScan, setOpenScan] = useState(false);
    
    const handleOpenDialog = () => setOpenDialog(true);
    const handleCloseDialog = () => setOpenDialog(false);
    const handleOpenQR = () => setOpenQR(true);
    const handleCloseQR = () => setOpenQR(false);
    const handleOpenScan = () => setOpenScan(true);
    const handleCloseScan = () => setOpenScan(false);

    const handleContactClick = useCallback((contact) => {
        if (!isAuthenticated || !token) return;
        const email = contact?.email || contact?.username; // fallback if email missing in list
        if (!email) return;
        webSocketService.send({ type: 'get_profile', token, email });
        // پس از کلیک روی مخاطب، لیست ایمیل های PV را به عنوان open_chats به سرور بفرست
        try {
            const emails = getStoredEmails();
            if (Array.isArray(emails)) {
                webSocketService.send({ type: 'update_open_chats', token, open_chats: emails });
            }
        } catch {}
    }, [isAuthenticated, token]);

    return (
        <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">مخاطبین</Typography>
                <Stack direction="row" spacing={1}>
                    <Button onClick={handleOpenScan} variant="contained" color="primary">
                        اسکن QR مخاطب
                    </Button>
                    <Button onClick={handleOpenQR} variant="outlined">
                        نمایش QR ایمیل من
                    </Button>
                    <Button onClick={handleOpenDialog} startIcon={<UserPlus />}>
                        افزودن مخاطب
                    </Button>
                </Stack>
            </Stack>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {isLoading ? (
                    <Stack justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
                        <CircularProgress />
                    </Stack>
                ) : error ? (
                    <Typography color="error" textAlign="center">{error}</Typography>
                ) : (
                    <Stack spacing={2}>
                        {contacts.length > 0 ? (
                            contacts.map((contact, index) => (
                                <ContactElement
                                    key={contact.user_id || contact.email || index}
                                    contact={contact}
                                    onClick={() => handleContactClick(contact)}
                                />
                            ))
                        ) : (
                            <Typography textAlign="center" color="text.secondary">لیست مخاطبین شما خالی است.</Typography>
                        )}
                    </Stack>
                )}
            </Box>

            {openDialog && <AddContactDialog open={openDialog} handleClose={handleCloseDialog} />}
            {openQR && (
                <QREmailDialog
                    open={openQR}
                    onClose={handleCloseQR}
                    email={(user && (user.email || user.username)) || ''}
                />
            )}
            {openScan && (
                <QRScanDialog
                    open={openScan}
                    onClose={handleCloseScan}
                />
            )}
        </Box>
    );
};

export default Contacts;
