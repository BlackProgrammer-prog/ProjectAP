import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Slide, Stack, Typography, Box } from '@mui/material';

const Shortcuts = ({ open, handleClose }) => {
    const Transition = React.forwardRef(function Transition(props, ref) {
        return <Slide direction="up" ref={ref} {...props} />;
    });

    // تقسیم لیست به دو بخش: 8 آیتم برای سمت چپ و 9 آیتم برای سمت راست
    const leftList = [
        { key: 0, title: "Mark as unread", combination: ["Cmd", "Shift", "U"] },
        { key: 1, title: "Mute", combination: ["Cmd", "Shift", "M"] },
        { key: 2, title: "Archive Chat", combination: ["Cmd", "Shift", "E"] },
        { key: 3, title: "Delete Chat", combination: ["Cmd", "Shift", "D"] },
        { key: 4, title: "Pin Chat", combination: ["Cmd", "Shift", "P"] },
        { key: 5, title: "Search", combination: ["Cmd", "F"] },
        { key: 6, title: "Search Chat", combination: ["Cmd", "Shift", "F"] },
        { key: 7, title: "Next Chat", combination: ["Cmd", "N"] },
    ];

    const rightList = [
        { key: 8, title: "Next Step", combination: ["Ctrl", "Tab"] },
        { key: 9, title: "Previous Step", combination: ["Ctrl", "Shift", "Tab"] },
        { key: 10, title: "New Group", combination: ["Cmd", "Shift", "N"] },
        { key: 11, title: "Profile & About", combination: ["Cmd", "P"] },
        { key: 12, title: "Increase speed of voice message", combination: ["Shift", "."] },
        { key: 13, title: "Decrease speed of voice message", combination: ["Shift", ","] },
        { key: 14, title: "Settings", combination: ["Shift", "S"] },
        { key: 15, title: "Emoji Panel", combination: ["Cmd", "E"] },
        { key: 16, title: "Sticker Panel", combination: ["Cmd", "S"] },
    ];

    // کامپوننت برای نمایش هر آیتم
    const ShortcutItem = ({ title, combination }) => (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
                p: 1.5,
                minHeight: '56px',
                width: '100%',
                '&:hover': {
                    backgroundColor: 'action.hover',
                    borderRadius: 1
                }
            }}
        >
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    minWidth: 0,
                    pr: 2
                }}
            >
                {title}
            </Typography>
            <Stack direction="row" spacing={1}>
                {combination.map((el, i) => (
                    <Box
                        key={i}
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            bgcolor: 'action.selected',
                            borderRadius: 1,
                            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
                            fontSize: 12,
                            fontWeight: 500,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {el}
                    </Box>
                ))}
            </Stack>
        </Stack>
    );

    return (
        <Dialog
            fullWidth
            maxWidth="md"
            open={open}
            onClose={handleClose}
            keepMounted
            TransitionComponent={Transition}
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                    p: 2,
                    maxHeight: '80vh'
                }
            }}
        >
            <DialogTitle sx={{ pb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                    Keyboard Shortcuts
                </Typography>
            </DialogTitle>

            <DialogContent sx={{
                pt: 2,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <Box sx={{
                    display: 'flex',
                    flex: 1,
                    overflow: 'hidden'
                }}>
                    {/* ستون سمت چپ با 8 آیتم */}
                    <Box sx={{
                        width: '50%',
                        pr: 1.5,
                        overflowY: 'auto',
                        height: '100%'
                    }}>
                        <Stack spacing={1}>
                            {leftList.map((item) => (
                                <ShortcutItem
                                    key={item.key}
                                    title={item.title}
                                    combination={item.combination}
                                />
                            ))}
                        </Stack>
                    </Box>

                    {/* ستون سمت راست با 9 آیتم */}
                    <Box sx={{
                        width: '50%',
                        pl: 1.5,
                        overflowY: 'auto',
                        height: '100%',
                        borderLeft: '1px solid',
                        borderColor: 'divider'
                    }}>
                        <Stack spacing={1}>
                            {rightList.map((item) => (
                                <ShortcutItem
                                    key={item.key}
                                    title={item.title}
                                    combination={item.combination}
                                />
                            ))}
                        </Stack>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button
                    variant="contained"
                    onClick={handleClose}
                    sx={{
                        px: 4,
                        borderRadius: 1,
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: 'none'
                        }
                    }}
                >
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Shortcuts;