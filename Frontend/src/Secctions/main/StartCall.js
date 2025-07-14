import React from 'react'
import { alpha, Box, Dialog, DialogContent, DialogTitle, Divider, IconButton, InputBase, Stack, styled, Typography, useTheme } from '@mui/material';
import { CaretLeft, MagnifyingGlass, Phone, PhoneCall, Plus } from 'phosphor-react';
import { CallElement } from '../../components/CallElement';
import { MembersList } from '../../data';

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


const StartCall = ({ open, handleClose }) => {
    return (
        <Dialog fullWidth maxWidth='xs' open={open} onClose={handleClose}  >
            {/* Title */}
            <DialogTitle sx={{ p: 2 }}>
                Start Call
            </DialogTitle>
            {/* Content */}
            <DialogContent>
                <Stack spacing={2}>
                    <Stack sx={{ width: "100%" }}>
                        <Search>
                            <SearchIconWrapper>
                                <MagnifyingGlass color='#709CE6' />
                            </SearchIconWrapper>
                            <StyledInputBase placeholder='Search...' />
                        </Search>
                    </Stack>
                    {/* call list */}
                    {MembersList.map((el) => <CallElement  {...el} />)}
                </Stack>

            </DialogContent>
        </Dialog>
    )
}

export default StartCall