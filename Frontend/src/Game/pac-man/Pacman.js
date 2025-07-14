import React from 'react'
import { Avatar, Box, Divider, IconButton, Stack, Switch, useTheme, Menu, MenuItem, Typography } from "@mui/material";

const Pacman = () => {
    return (

        <Stack sx={{ position: 'absolute', left:'100px' }}>
            <iframe
                src="http://localhost:5173/"
                width="1418px"
                height="735px"
                title="External Site"
                style={{
                    borderRadius: '10px'
                }}
            />
        </Stack>



    )
}

export default Pacman