// DeepSeekAPI.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Card,
    TextField,
    IconButton,
    Stack,
    Typography,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { sendPromptToGPT } from '../chatgpt/chatService'; // <-- your helper
import { CaretLeft } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';

export default function DeepSeekAPI() {
    const [messages, setMessages] = useState([]);   // {sender: 'user' | 'bot', text: string}[]
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);
    const navigate = useNavigate()

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const prompt = input.trim();
        if (!prompt) return;

        // 1. Push user message instantly
        setMessages((prev) => [...prev, { sender: 'user', text: prompt }]);
        setInput('');
        setLoading(true);

        try {
            // 2. Call OpenAI
            const answer = await sendPromptToGPT(prompt);
            setMessages((prev) => [...prev, { sender: 'bot', text: answer }]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { sender: 'bot', text: '⚠️ Error: ' + err.message },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                position: 'absolute',
                height: '100vh',
                width: '90vw',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#ffffff',
                left: '110px'
            }}
        >
            {/* Header */}
            <Box sx={{ textAlign: 'center', py: 3 }}>
                <Stack sx={{
                    position: 'absolute',
                    left: '15px'
                }}>
                    <IconButton onClick={() => navigate("/AI/state")}>
                        <CaretLeft size={25} />
                    </IconButton>
                </Stack>
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
                    <AutoAwesomeIcon sx={{ color: '#4f46e5', fontSize: 36 }} />
                    <Typography variant="h4" fontWeight={700} color="#111827">
                        DeepSeek
                    </Typography>
                </Stack>
                <Typography variant="h6" color="text.secondary" mt={1}>
                    How can I help you today?
                </Typography>
            </Box>

            {/* Chat area (hidden until first message) */}
            {messages.length > 0 && (
                <Stack
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        px: { xs: 2, md: 4 },
                        py: 2,
                    }}
                    spacing={2}
                >
                    {messages.map((msg, idx) => (
                        <Box
                            key={idx}
                            alignSelf={msg.sender === 'user' ? 'flex-end' : 'flex-start'}
                            maxWidth="70%"
                            sx={{
                                borderRadius: 3,
                                px: 2,
                                py: 1,
                                bgcolor:
                                    msg.sender === 'user'
                                        ? '#e0e7ff'
                                        : '#f3f4f6',
                                color: '#111827',
                                border: '1px solid #e5e7eb',
                            }}
                        >
                            <Typography fontSize="0.95rem">{msg.text}</Typography>
                        </Box>
                    ))}

                    {loading && (
                        <Box alignSelf="flex-start" sx={{ px: 2, py: 1 }}>
                            <CircularProgress size={20} />
                        </Box>
                    )}
                    <div ref={endRef} />
                </Stack>
            )}

            {/* Input card */}
            <Box sx={{ px: { xs: 2, md: 4 }, pb: 3 }}>
                <Card
                    elevation={1}
                    sx={{
                        borderRadius: 3,
                        border: '1px solid #e5e7eb',
                        bgcolor: '#ffffff',
                    }}
                >
                    <TextField
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={6}
                        placeholder="Message DeepSeek"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        variant="standard"
                        InputProps={{
                            disableUnderline: true,
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleSend}
                                        disabled={!input.trim() || loading}
                                        sx={{ color: '#4f46e5' }}
                                    >
                                        <SendIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                            sx: { px: 2, py: 1.5, fontSize: '1rem', color: '#111827' },
                        }}
                        sx={{ textarea: { resize: 'none' } }}
                    />
                </Card>
            </Box>
        </Box>
    );
}

// ==================================================


// // DeepSeekAPI.jsx

// import React, { useState } from 'react';
// import {
//     Box,
//     Card,
//     TextField,
//     Button,
//     Stack,
//     Typography,
//     InputAdornment,
//     IconButton,
// } from '@mui/material';
// import SendIcon from '@mui/icons-material/Send';
// import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// const DeepSeekAPI = () => {
//     const [message, setMessage] = useState('');

//     const handleSend = () => {
//         if (!message.trim()) return;
//         console.log('Send:', message);
//         setMessage('');
//     };

//     return (
//         <Box
//             sx={{
//                 height: '100vh',
//                 width: '90vw',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 backgroundColor: '#ffffff',
//                 position:'absolute',
//                 left:'110px'
//             }}
//         >
//             <Stack alignItems="center" spacing={4} maxWidth={700} width="90%">
//                 {/* Logo + Title */}
//                 <Stack direction="row" alignItems="center" spacing={1}>
//                     <AutoAwesomeIcon sx={{ fontSize: 40, color: '#4f46e5' }} />
//                     <Typography variant="h4" fontWeight={700} color="#111827">
//                         DeepSeek
//                     </Typography>
//                 </Stack>

//                 <Typography variant="h6" color="text.secondary">
//                     How can I help you today?
//                 </Typography>

//                 {/* Chat Card */}
//                 <Card
//                     elevation={1}
//                     sx={{
//                         width: '100%',
//                         p: 2,
//                         borderRadius: 3,
//                         backgroundColor: '#ffffff',
//                         border: '1px solid #e5e7eb',
//                     }}
//                 >
//                     <TextField
//                         fullWidth
//                         multiline
//                         minRows={3}
//                         maxRows={6}
//                         placeholder="Message DeepSeek"
//                         value={message}
//                         onChange={(e) => setMessage(e.target.value)}
//                         onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
//                         variant="standard"
//                         InputProps={{
//                             disableUnderline: true,
//                             endAdornment: (
//                                 <InputAdornment position="end">
//                                     <IconButton
//                                         onClick={handleSend}
//                                         sx={{ color: '#4f46e5' }}
//                                         aria-label="send"
//                                     >
//                                         <SendIcon />
//                                     </IconButton>
//                                 </InputAdornment>
//                             ),
//                             sx: { px: 1, py: 1, fontSize: '1rem', color: '#111827' },
//                         }}
//                         sx={{ textarea: { resize: 'none' } }}
//                     />
//                 </Card>

//                 {/* Footer Buttons */}
//                 <Stack direction="row" spacing={2}>
//                     <Button
//                         variant="outlined"
//                         size="small"
//                         sx={{
//                             borderColor: '#d1d5db',
//                             color: '#374151',
//                             textTransform: 'none',
//                             fontSize: '0.75rem',
//                             borderRadius: 2,
//                         }}
//                     >
//                         DeepThink (R1)
//                     </Button>
//                     <Button
//                         variant="outlined"
//                         size="small"
//                         sx={{
//                             borderColor: '#d1d5db',
//                             color: '#374151',
//                             textTransform: 'none',
//                             fontSize: '0.75rem',
//                             borderRadius: 2,
//                         }}
//                     >
//                         Search
//                     </Button>
//                 </Stack>
//             </Stack>
//         </Box>
//     );
// };

// export default DeepSeekAPI;