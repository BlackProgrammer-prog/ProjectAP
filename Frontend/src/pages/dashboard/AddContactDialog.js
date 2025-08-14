import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Stack, TextField, InputAdornment, List, ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Button, Box } from '@mui/material';
import { MagnifyingGlass } from 'phosphor-react';
import { useContacts } from '../../contexts/ContactsContext';

const AddContactDialog = ({ open, handleClose }) => {
    const { searchResults, searchUsers, addContact, setSearchResults } = useContacts();
    const [query, setQuery] = useState("");
    const [searchTimeout, setSearchTimeout] = useState(null);

    const handleSearchChange = (event) => {
        const newQuery = event.target.value;
        setQuery(newQuery);

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        setSearchTimeout(setTimeout(() => {
            searchUsers(newQuery);
        }, 500)); // Debounce time of 500ms
    };
    
    const handleAddContact = (email) => {
        addContact(email);
        handleCloseDialog();
    }
    
    const handleCloseDialog = () => {
        setQuery("");
        setSearchResults([]); // Clear search results on close
        if (searchTimeout) clearTimeout(searchTimeout);
        handleClose();
    }

    return (
        <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="xs" sx={{ p: 2 }}>
            <DialogTitle>افزودن مخاطب جدید</DialogTitle>
            <DialogContent>
                <Stack spacing={2} pt={1}>
                    <TextField
                        fullWidth
                        value={query}
                        placeholder="جست‌وجو با ایمیل یا نام کاربری..."
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <MagnifyingGlass />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Box sx={{ minHeight: 200, maxHeight: '50vh', overflowY: 'auto' }}>
                        <List>
                            {searchResults.length > 0 ? (
                                searchResults.map((user) => (
                                    <ListItem key={user.user_id} sx={{ justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <ListItemAvatar>
                                                <Avatar src={user.profile?.avatarUrl} />
                                            </ListItemAvatar>
                                            <ListItemText primary={user.username} secondary={user.email} />
                                        </Box>
                                        <Button size="small" variant="outlined" onClick={() => handleAddContact(user.email)}>افزودن</Button>
                                    </ListItem>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ pt: 4 }}>
                                    برای یافتن کاربر، جست‌وجو کنید.
                                </Typography>
                            )}
                        </List>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default AddContactDialog;
