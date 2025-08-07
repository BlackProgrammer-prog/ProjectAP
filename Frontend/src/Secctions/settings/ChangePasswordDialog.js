import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Stack, IconButton, InputAdornment, Alert
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../Login/Component/Context/AuthContext';

const ChangePasswordDialog = ({ open, handleClose }) => {
    // This function will be created in AuthContext
    const { changePassword } = useAuth(); 
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('رمز عبور جدید و تکرار آن یکسان نیستند.');
            return;
        }

        if (newPassword.length < 6) {
            setError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
            return;
        }

        // Call the function from context
        changePassword(oldPassword, newPassword);
        
        // Close the dialog after submission
        // The context will show an alert for success or failure
        handleClose();
        // Reset fields
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
            <form onSubmit={handleSubmit}>
                <DialogTitle>تغییر رمز عبور</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField
                            label="رمز عبور فعلی"
                            type={showOldPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowOldPassword(!showOldPassword)} edge="end">
                                            {showOldPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="رمز عبور جدید"
                            type={showNewPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="تکرار رمز عبور جدید"
                            type={showNewPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose}>انصراف</Button>
                    <Button type="submit" variant="contained">ذخیره تغییرات</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ChangePasswordDialog;
