
import { useState } from "react"
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    TextField,
    Box,
    Stack,
    IconButton,
    Avatar,
    styled,
    useTheme,
    CircularProgress,
} from "@mui/material"
import {
    Add as AddIcon,
    KeyboardArrowDown,
    Mic,
    GraphicEq,
    Send as SendIcon,
} from "@mui/icons-material"
import { CaretLeft } from "phosphor-react"
import { useNavigate } from "react-router-dom"
import { sendPromptToGPT } from "./chatService"

const StyledTextField = styled(TextField)(({ theme }) => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "24px",
        backgroundColor: theme.palette.mode === "light" ? "#f5f5f5" : theme.palette.background.paper,
        border: "1px solid #e0e0e0",
        paddingLeft: "16px",
        paddingRight: "16px",
        "&:hover": {
            borderColor: "#bdbdbd",
        },
        "&.Mui-focused": {
            borderColor: "#9e9e9e",
        },
        "& fieldset": {
            border: "none",
        },
    },
    "& .MuiOutlinedInput-input": {
        padding: "16px 0",
        fontSize: "18px",
        paddingLeft: "80px",
        paddingRight: "80px",
    },
}))

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: "20px",
    textTransform: "none",
    fontWeight: 500,
    padding: "8px 16px",
}))

const PlusButton = styled(IconButton)(({ theme }) => ({
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    padding: "8px",
    borderRadius: "12px",
    "&:hover": {
        backgroundColor: theme.palette.action.hover,
    },
}))

const ChatGPT = () => {
    const theme = useTheme()
    const navigate = useNavigate()

    const [message, setMessage] = useState("")
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)

    const handleSend = async () => {
        if (!message.trim()) return

        const userMessage = { sender: "user", content: message }
        setMessages((prev) => [...prev, userMessage])
        setMessage("")
        setLoading(true)

        try {
            const reply = await sendPromptToGPT(message)
            const botMessage = { sender: "bot", content: reply }
            setMessages((prev) => [...prev, botMessage])
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { sender: "bot", content: "خطا در دریافت پاسخ از سرور." },
            ])
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                width: "90vw",
                backgroundColor: "#ffffff",
                position: "absolute",
                left: "110px",
            }}
        >
            {/* Header */}
            <AppBar
                position="static"
                elevation={0}
                sx={{
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #f0f0f0",
                }}
            >
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                color: "#000000",
                                fontWeight: 500,
                                fontSize: "18px",
                            }}
                        >
                            ChatGPT
                        </Typography>
                        <KeyboardArrowDown sx={{ color: "#666666", fontSize: "20px" }} />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <StyledButton
                            variant="outlined"
                            startIcon={<AddIcon />}
                            sx={{
                                backgroundColor: "#eff6ff", borderColor: "#bfdbfe",
                                color: "#1d4ed8",
                                "&:hover": {
                                    backgroundColor: "#dbeafe",
                                    borderColor: "#93c5fd",
                                },
                            }}
                        >
                            Get Plus
                        </StyledButton>

                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                backgroundColor: "#0d9488",
                                fontSize: "14px",
                                fontWeight: 600,
                            }}
                        >
                            M
                        </Avatar>
                        <IconButton onClick={() => navigate("/AI/state")}>
                            <CaretLeft size={25} />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "calc(100vh - 64px)",
                    padding: 4,
                    paddingBottom: 16,
                }}
            >
                <Stack spacing={4} sx={{ width: "100%", maxWidth: "800px" }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 400,
                            fontSize: { xs: "28px", md: "36px" },
                            color: "#000000",
                            textAlign: "center",
                        }}
                    >
                        What's on your mind today?
                    </Typography>

                    {/* Message history */}
                    <Stack spacing={2}>
                        {messages.map((msg, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                                    backgroundColor:
                                        msg.sender === "user" ? "#e0f2fe" : "#f3f4f6",
                                    padding: 2,
                                    borderRadius: "12px",
                                    maxWidth: "80%",
                                    fontSize: "16px",
                                }}
                            >
                                {msg.content}
                            </Box>
                        ))}
                        {loading && (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    color: "#999999",
                                }}
                            >
                                <CircularProgress size={16} />
                                <Typography variant="body2">در حال نوشتن...</Typography>
                            </Box>
                        )}
                    </Stack>

                    {/* Input Container */}
                    <Box sx={{ position: "relative", width: "100%" }}>
                        <StyledTextField
                            fullWidth
                            variant="outlined"
                            placeholder="Ask anything"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                        />

                        {/* Plus Button */}
                        <PlusButton>
                            <AddIcon sx={{ fontSize: "20px", color: "#666666" }} />
                        </PlusButton>

                        {/* Right Side Buttons */}
                        <Box
                            sx={{
                                position: "absolute",
                                right: "16px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                display: "flex",
                                gap: 1,
                            }}
                        >
                            <IconButton
                                sx={{
                                    padding: "8px",
                                    borderRadius: "12px",
                                    "&:hover": {
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                }}
                            >
                                <Mic sx={{ fontSize: "20px", color: "#666666" }} />
                            </IconButton>

                            <IconButton
                                sx={{
                                    padding: "8px",
                                    borderRadius: "12px",
                                    "&:hover": {
                                        backgroundColor: theme.palette.action.hover,
                                    },
                                }}
                                onClick={handleSend}
                            >
                                <SendIcon sx={{ fontSize: "20px", color: "#1d4ed8" }} />
                            </IconButton>
                        </Box>
                    </Box>
                </Stack>
            </Box>
        </Box>
    )
}

export default ChatGPT

// =============================================================
