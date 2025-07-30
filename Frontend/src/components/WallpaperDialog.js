import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Button,
    Box,
    Typography,
    useTheme
} from '@mui/material';
import { X } from 'phosphor-react';

// تصاویر والپیپر (شما می‌توانید این‌ها را با تصاویر خود جایگزین کنید)
import Wallpaper1 from '../Wallpaper/OIP1.jpeg';
import Wallpaper2 from '../Wallpaper/OIP2.jpeg';
import Wallpaper3 from '../Wallpaper/OIP3.jpeg';
import Wallpaper4 from '../Wallpaper/OIP.jpeg';
import Wallpaper5 from '../Wallpaper/defult.png';

const wallpapers = [

    { id: 'wallpaper0', name: 'Default    ', image: Wallpaper5 },
    { id: 'wallpaper1', name: 'Wallpaper 1', image: Wallpaper1 },
    { id: 'wallpaper2', name: 'Wallpaper 2', image: Wallpaper2 },
    { id: 'wallpaper3', name: 'Wallpaper 3', image: Wallpaper3 },
    { id: 'wallpaper4', name: 'Wallpaper 4', image: Wallpaper4 },
];

const WallpaperDialog = ({ open, onClose, onSelectWallpaper }) => {
    const theme = useTheme();
    const [selectedWallpaper, setSelectedWallpaper] = useState(wallpapers[0]);

    useEffect(() => {
        const savedWallpaper = localStorage.getItem('chatWallpaper');
        if (savedWallpaper) {
            const found = wallpapers.find(w => w.id === JSON.parse(savedWallpaper).id);
            if (found) setSelectedWallpaper(found);
        }
    }, [open]);

    const handleApply = () => {
        if (selectedWallpaper) {
            localStorage.setItem('chatWallpaper', JSON.stringify(selectedWallpaper));
            onSelectWallpaper(selectedWallpaper);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            sx={{
                '& .MuiDialog-paper': {
                    borderRadius: '12px',
                    padding: '16px'
                }
            }}
        >
            <DialogTitle sx={{
                padding: '16px 16px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Typography variant="h6" fontWeight="600">
                    Chat Wallpaper
                </Typography>
                <Box
                    onClick={onClose}
                    sx={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <X size={20} />
                </Box>
            </DialogTitle>

            <DialogContent sx={{ padding: '16px' }}>
                <Typography variant="body1" sx={{ marginBottom: '16px' }}>
                    Choose a wallpaper for your chat background
                </Typography>

                <Grid container spacing={2}>
                    {wallpapers.map((wallpaper) => (
                        <Grid item xs={4} key={wallpaper.id}>
                            <Box
                                onClick={() => setSelectedWallpaper(wallpaper)}
                                sx={{
                                    height: '120px',
                                    backgroundImage: `url(${wallpaper.image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: '8px',
                                    border: selectedWallpaper?.id === wallpaper.id
                                        ? `3px solid ${theme.palette.primary.main}`
                                        : '1px solid #e0e0e0',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        transform: 'scale(1.02)',
                                        transition: 'transform 0.2s'
                                    }
                                }}
                            />
                            <Typography
                                variant="body2"
                                align="center"
                                sx={{ marginTop: '8px' }}
                            >
                                {wallpaper.name}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>

            <DialogActions sx={{
                padding: '16px',
                justifyContent: 'space-between'
            }}>
                <Button
                    onClick={onClose}
                    sx={{
                        borderRadius: '8px',
                        padding: '8px 24px',
                        textTransform: 'none'
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleApply}
                    disabled={!selectedWallpaper}
                    sx={{
                        borderRadius: '8px',
                        padding: '8px 24px',
                        textTransform: 'none'
                    }}
                >
                    Apply Wallpaper
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WallpaperDialog;