import React from 'react';
import { Dialog, DialogTitle, DialogContent, Stack, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QRCode from 'react-qr-code';

const QREmailDialog = ({ open, onClose, email }) => {
    const value = typeof email === 'string' ? email : '';
    return (
        <Dialog open={!!open} onClose={onClose} maxWidth="xs" fullWidth>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pr: 1 }}>
                <DialogTitle sx={{ pb: 0 }}>QR ایمیل من</DialogTitle>
                <IconButton onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
            </Stack>
            <DialogContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                <Stack alignItems="center" spacing={2}>
                    <QRCode value={value || 'no-email'} size={220} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} />
                    <Typography variant="body2" color="text.secondary">{value || '—'}</Typography>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default QREmailDialog;



