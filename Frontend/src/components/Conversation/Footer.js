"use client"

import { useState } from "react"
import { Box, Stack, styled, TextField, InputAdornment, useTheme, IconButton, Fab } from "@mui/material"
import { Smiley, LinkSimple, PaperPlaneTilt, Sticker, Camera, User, Image, File, Microphone } from "phosphor-react"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

const StyleInput = styled(TextField)(({ theme }) => ({
    "& .MuiInputBase-input": {
        paddingTop: "12px",
        paddingBottom: "12px",
    },
    "& .MuiFilledInput-root": {
        borderRadius: "16px",
        backgroundColor: theme.palette.mode === "light" ? "#f5f5f5" : theme.palette.background.paper,
    },
}))

const ActionButton = styled(Fab)(({ theme }) => ({
    position: "absolute",
    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
    transform: "scale(0)",
    "&.show": {
        transform: "scale(1)",
    },
    width: 48,
    height: 48,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
}))

const ChatInput = ({ setOpenPicker, openActions, setOpenActions, username, onSend }) => {
    const [message, setMessage] = useState("")
    const theme = useTheme()

    const handleSend = () => {
        if (!message.trim()) {
            return;
        }
        onSend(message); // ارسال پیام به والد
        setMessage(''); // پاک کردن فیلد
    }

    const handleActionClick = () => {
        setOpenActions((prev) => !prev)
    }

    return (
        <Box sx={{ position: "relative", width: "100%" }}>
            {/* Floating Action Buttons */}
            <Box sx={{ position: "absolute", bottom: "100%", left: 20, zIndex: 1000 }}>
                {Action.map((el, index) => (
                    <ActionButton
                        key={index}
                        className={openActions ? "show" : ""}
                        sx={{
                            backgroundColor: el.color,
                            color: "white",
                            left: -15, // Changed from 0 to -15px
                            bottom: `${(index + 1) * 60 - 20}px`, // Stack vertically with 60px spacing, moved 20px down
                            transitionDelay: openActions ? `${index * 100}ms` : `${(Action.length - index) * 50}ms`,
                            "&:hover": {
                                backgroundColor: el.color,
                                transform: "scale(1.1)",
                                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                            },
                        }}
                        size="small"
                        onClick={() => {
                            console.log(`Clicked ${el.title}`)
                            setOpenActions(false)
                        }}
                    >
                        {el.icon}
                    </ActionButton>
                ))}
            </Box>
          {/* input message  */}  
            <StyleInput
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSend()
                    }
                }}
                placeholder="Write a message..."
                variant="filled"
                InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconButton
                                onClick={handleActionClick}
                                sx={{
                                    color: openActions ? theme.palette.primary.main : theme.palette.text.secondary,
                                    transform: openActions ? "rotate(45deg)" : "rotate(0deg)",
                                    transition: "all 0.3s ease",
                                    position: "relative",
                                    top: "-5px", // Move 5px up
                                    left: "50%", // Center horizontally
                                    transform: `translateX(-50%) ${openActions ? "rotate(45deg)" : "rotate(0deg)"}`, // Combine centering and rotation
                                }}
                            >
                                <LinkSimple size={20} />
                            </IconButton>
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setOpenPicker((prev) => !prev)}>
                                <Smiley size={20} />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
        </Box>
    )
}

const Action = [
    {
        color: "#4da5fe",
        icon: <Image size={20} />,
        title: "Photo/Video",
    },
    {
        color: "#1b8cfe",
        icon: <Microphone size={20} />,
        title: "Stickers",
    },
    {
        color: "#0172e4",
        icon: <Camera size={20} />,
        title: "Image",
    },
    {
        color: "#0159b2",
        icon: <File size={20} />,
        title: "Document",
    },
    {
        color: "#013f7f",
        icon: <User size={20} />,
        title: "Contact",
    },
]

const Footer = ({ username, onSend }) => {
    const theme = useTheme()
    const [openPicker, setOpenPicker] = useState(false)
    const [openActions, setOpenActions] = useState(false)
    const [message, setMessage] = useState('')

    const handleSend = () => {
        if (!message.trim()) {
            return;
        }
        onSend(message); // ارسال پیام به والد
        setMessage(''); // پاک کردن فیلد
    }
    return (
        <Stack>
            <Box
                sx={{
                    width: "calc(100% - 40px)",
                    maxWidth: "1088px",
                    backgroundColor: theme.palette.mode === "light" ? "#F8FAFF" : theme.palette.background.paper,
                    boxShadow: "0px 0px 2px rgba(0,0,0,0.25)",
                    position: "fixed",
                    bottom: 0,
                    left: "420px",
                    padding: "16px",
                    zIndex: 10,
                    borderRadius: "16px 16px 0 0",
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Stack sx={{ width: "100%", position: "relative" }}>
                        {/* Emoji Picker */}
                        <Box
                            sx={{
                                display: openPicker ? "block" : "none",
                                position: "absolute",
                                bottom: "100%",
                                right: 0,
                                zIndex: 1000,
                                marginBottom: "8px",
                            }}
                        >
                            <Picker
                                theme={theme.palette.mode}
                                data={data}
                                onEmojiSelect={(emoji) => {
                                    console.log(emoji)
                                    setOpenPicker(false)
                                }}
                            />
                        </Box>

                        <ChatInput
                            username={username}
                            setOpenPicker={setOpenPicker}
                            openActions={openActions}
                            setOpenActions={setOpenActions}
                            onSend={onSend}
                        />
                    </Stack>

                    {/* Send Button */}
                    <IconButton
                        onClick={handleSend}
                        sx={{
                            backgroundColor: theme.palette.primary.main,
                            color: "white",
                            width: 48,
                            height: 48,
                            "&:hover": {
                                backgroundColor: theme.palette.primary.dark,
                            },
                        }}
                    >
                        <PaperPlaneTilt size={20} />
                    </IconButton>
                </Stack>
            </Box>

            {/* Backdrop to close actions when clicking outside */}
            {openActions && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999,
                    }}
                    onClick={() => setOpenActions(false)}
                />
            )}
        </Stack>
    )
}

export default Footer






// .................................................................
