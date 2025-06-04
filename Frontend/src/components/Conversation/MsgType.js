"use client"

import { Box, Divider, IconButton, Menu, MenuItem, Stack, Typography, useTheme } from "@mui/material"
import {
    DotsThreeVertical,
    DownloadSimple,
    Image,
    ArrowBendUpLeft,
    ArrowRight,
    Star,
    SmileyWink,
    Flag,
    Trash,
    Copy,
} from "phosphor-react"
import { useState } from "react"

// Message options with icons
const Message_options = [
    {
        title: "Reply",
        icon: <ArrowBendUpLeft size={16} />,
        color: "#1976d2",
    },
    {
        title: "React to message",
        icon: <SmileyWink size={16} />,
        color: "#ff9800",
    },
    {
        title: "Forward message",
        icon: <ArrowRight size={16} />,
        color: "#4caf50",
    },
    {
        title: "Copy message",
        icon: <Copy size={16} />,
        color: "#9c27b0",
    },
    {
        title: "Star message",
        icon: <Star size={16} />,
        color: "#ffc107",
    },
    {
        title: "Report",
        icon: <Flag size={16} />,
        color: "#ff5722",
    },
    {
        title: "Delete message",
        icon: <Trash size={16} />,
        color: "#f44336",
    },
]

const MessageOption = ({ el }) => {
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const theme = useTheme()

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleMenuItemClick = (option) => {
        console.log(`Selected: ${option.title}`)
        handleClose()
    }

    return (
        <>
            <IconButton
                onClick={handleClick}
                size="small"
                sx={{
                    opacity: 0.7,
                    "&:hover": {
                        opacity: 1,
                        backgroundColor: "rgba(0,0,0,0.04)",
                    },
                }}
            >
                <DotsThreeVertical size={16} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        minWidth: 200,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        border: `1px solid ${theme.palette.divider}`,
                    },
                }}
            >
                <Stack spacing={0.5} py={1}>
                    {Message_options.map((option, index) => (
                        <MenuItem
                            key={index}
                            onClick={() => handleMenuItemClick(option)}
                            sx={{
                                mx: 1,
                                borderRadius: 1,
                                fontSize: "0.875rem",
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                py: 1,
                                "&:hover": {
                                    backgroundColor: theme.palette.action.hover,
                                    "& .menu-icon": {
                                        color: option.color,
                                    },
                                },
                            }}
                        >
                            <Box
                                className="menu-icon"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    display: "flex",
                                    alignItems: "center",
                                    transition: "color 0.2s ease",
                                }}
                            >
                                {option.icon}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {option.title}
                            </Typography>
                        </MenuItem>
                    ))}
                </Stack>
            </Menu>
        </>
    )
}

export const DocMsg = ({ el }) => {
    const theme = useTheme()
    return (
        <Stack direction={"row"} justifyContent={el.incoming ? "start" : "end"}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                <Box
                    p={1.5}
                    sx={{
                        backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
                        width: "max-content",
                        maxWidth: "70%",
                    }}
                    borderRadius={1.5}
                >
                    <Stack spacing={2}>
                        <Stack
                            p={2}
                            direction={"row"}
                            alignItems={"center"}
                            sx={{
                                backgroundColor: theme.palette.background.paper,
                                borderRadius: 1,
                            }}
                        >
                            <Image size={28} />
                            <Stack p={2}>
                                <Typography variant="caption">Abstract.png</Typography>
                            </Stack>
                            <Stack>
                                <IconButton>
                                    <DownloadSimple />
                                </IconButton>
                            </Stack>
                        </Stack>
                        <Typography
                            variant="body2"
                            sx={{
                                color: el.incoming ? theme.palette.text : "#fff",
                            }}
                        >
                            {el.message}
                        </Typography>
                    </Stack>
                </Box>
                {!el.incoming && <MessageOption el={el} />}
            </Stack>
        </Stack>
    )
}

export const LinkMsg = ({ el }) => {
    const theme = useTheme()
    return (
        <Stack direction={"row"} justifyContent={el.incoming ? "start" : "end"}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                {el.incoming && <MessageOption el={el} />}
                <Box
                    p={1.5}
                    sx={{
                        backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
                        width: "max-content",
                        maxWidth: "70%",
                    }}
                    borderRadius={1.5}
                >
                    <Stack spacing={2}>
                        <Stack
                            p={2}
                            spacing={3}
                            alignItems={"center"}
                            sx={{
                                backgroundColor: theme.palette.background.paper,
                                borderRadius: 1,
                            }}
                        >
                            <img
                                src={el.preview || "/placeholder.svg"}
                                alt={el.message}
                                style={{ maxHeight: 210, borderRadius: 1 }}
                            />
                        </Stack>
                    </Stack>
                </Box>
                {!el.incoming && <MessageOption el={el} />}
            </Stack>
        </Stack>
    )
}

export const ReplyMsg = ({ el }) => {
    const theme = useTheme()
    return (
        <Stack direction={"row"} justifyContent={el.incoming ? "start" : "end"}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                {el.incoming && <MessageOption el={el} />}
                <Box
                    p={1.5}
                    sx={{
                        backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
                        width: "max-content",
                        maxWidth: "70%",
                    }}
                    borderRadius={1.5}
                >
                    <Stack
                        spacing={2}
                        p={0.2}
                        alignItems={"center"}
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: 1.5,
                        }}
                    >
                        <Typography variant="body2" color={theme.palette.text}>
                            {el.message}
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color={el.incoming ? theme.palette.text : "#fff"}>
                        {el.reply}
                    </Typography>
                </Box>
                {!el.incoming && <MessageOption el={el} />}
            </Stack>
        </Stack>
    )
}

export const MediaMsg = ({ el }) => {
    const theme = useTheme()
    return (
        <Stack direction={"row"} justifyContent={el.incoming ? "start" : "end"}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                {el.incoming && <MessageOption el={el} />}
                <Box
                    p={1.5}
                    sx={{
                        backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
                        width: "max-content",
                        maxWidth: "70%",
                    }}
                >
                    <Stack>
                        <img src={el.img || "/placeholder.svg"} alt={el.message} style={{ maxWidth: 210, borderRadius: "10px" }} />
                        <Typography variant="body2" color={el.incoming ? theme.palette.text.primary : "#fff"}>
                            {el.message}
                        </Typography>
                    </Stack>
                </Box>
                {!el.incoming && <MessageOption el={el} />}
            </Stack>
        </Stack>
    )
}

export const TextMsg = ({ el }) => {
    const theme = useTheme()
    return (
        <Stack direction={"row"} justifyContent={el.incoming ? "start" : "end"}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
                {el.incoming && <MessageOption el={el} />}
                <Box
                    p={1.5}
                    sx={{
                        backgroundColor: el.incoming ? theme.palette.background.default : theme.palette.primary.main,
                        width: "max-content",
                        maxWidth: "70%",
                    }}
                    borderRadius={1.5}
                >
                    <Typography variant="body2" color={el.incoming ? theme.palette.text.primary : "#fff"}>
                        {el.message}
                    </Typography>
                </Box>
                {!el.incoming && <MessageOption el={el} />}
            </Stack>
        </Stack>
    )
}

export const Timeline = ({ text = "Today" }) => {
    return (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%", my: 3 }}>
            <Divider sx={{ flexGrow: 1 }} />
            <Typography
                variant="caption"
                sx={{
                    color: "#65676B",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    px: 2,
                }}
            >
                {text}
            </Typography>
            <Divider sx={{ flexGrow: 1 }} />
        </Stack>
    )
}


// .................................................................................

