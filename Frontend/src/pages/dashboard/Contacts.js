import React, { useState } from 'react';
import { Box, Typography, Stack, Avatar, IconButton, Button, Divider, CircularProgress } from '@mui/material';
import { UserPlus, Trash } from 'phosphor-react';
import { useContacts } from '../../contexts/ContactsContext';
import AddContactDialog from './AddContactDialog';
import { faker } from '@faker-js/faker';

const ContactElement = ({ contact }) => {
    const { removeContact } = useContacts();

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
                '&:hover': {
                    boxShadow: (theme) => theme.shadows[4],
                }
            }}
        >
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={contact.profile?.avatar || faker.image.avatar()} />
                <Stack>
                    <Typography variant="subtitle1" fontWeight={600}>{contact.username}</Typography>
                    <Typography variant="body2" color={contact.status === 'online' ? 'primary.main' : 'text.secondary'}>
                        {contact.status || 'offline'}
                    </Typography>
                </Stack>
            </Stack>
            <IconButton onClick={() => removeContact(contact.email)} color="error">
                <Trash />
            </IconButton>
        </Stack>
    );
};


const Contacts = () => {
    const { contacts, isLoading, error } = useContacts();
    const [openDialog, setOpenDialog] = useState(false);
    
    const handleOpenDialog = () => setOpenDialog(true);
    const handleCloseDialog = () => setOpenDialog(false);

    return (
        <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">مخاطبین</Typography>
                <Button onClick={handleOpenDialog} startIcon={<UserPlus />}>
                    افزودن مخاطب
                </Button>
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
                            contacts.map((contact) => (
                                <ContactElement key={contact.user_id} contact={contact} />
                            ))
                        ) : (
                            <Typography textAlign="center" color="text.secondary">لیست مخاطبین شما خالی است.</Typography>
                        )}
                    </Stack>
                )}
            </Box>

            {openDialog && <AddContactDialog open={openDialog} handleClose={handleCloseDialog} />}
        </Box>
    );
};

export default Contacts;
