import {
  Box,
  Fab,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Camera,
  File,
  Image,
  LinkSimple,
  PaperPlaneTilt,
  Smiley,
  Sticker,
  Microphone,
  MicrophoneSlash,
} from "phosphor-react";
import { useTheme, styled } from "@mui/material/styles";
import React from "react";
import { useSearchParams } from "react-router-dom";
import useResponsive from "../../hooks/useResponsive";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const StyledInput = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-input": {
    paddingTop: "12px !important",
    paddingBottom: "12px !important",
  },
}));

const Actions = [
  {
    color: "#4da5fe",
    icon: <Image size={24} />,
    y: 102,
    title: "Photo/Video",
  },
  {
    color: "#1b8cfe",
    icon: <Sticker size={24} />,
    y: 172,
    title: "Stickers",
  },
  {
    color: "#0172e4",
    icon: <Camera size={24} />,
    y: 242,
    title: "Image",
  },
  {
    color: "#0159b2",
    icon: <File size={24} />,
    y: 312,
    title: "Document",
  },
  {
    color: "#013f7f",
    icon: <Microphone size={24} />,
    y: 382,
    title: "Microphone",
  },
];

const ChatInput = ({ openPicker, setOpenPicker, value, onChange, onKeyDown }) => {
  const [openActions, setOpenActions] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const recognitionRef = React.useRef(null);
  const baseTextRef = React.useRef("");
  const hasRequestedMediaRef = React.useRef(false);

  const stopRecognition = React.useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      try { recognitionRef.current.abort && recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const ensureMicPermission = React.useCallback(async () => {
    if (hasRequestedMediaRef.current) return true;
    try {
      const isLocalhost = typeof window !== 'undefined' && (/^(localhost|127\.0\.0\.1|\[::1\])$/i).test(window.location.hostname);
      const isSecure = typeof window !== 'undefined' && (window.isSecureContext || isLocalhost);
      if (!isSecure) {
        alert("برای استفاده از میکروفون، برنامه باید روی HTTPS یا localhost اجرا شود.");
        return false;
      }
      if (!navigator?.mediaDevices?.getUserMedia) return true; // skip if not available
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      try { (stream.getTracks() || []).forEach(t => t.stop()); } catch {}
      hasRequestedMediaRef.current = true;
      return true;
    } catch (err) {
      try { console.error('Microphone permission error:', err); } catch {}
      alert("دسترسی به میکروفون رد شد یا در دسترس نیست. لطفاً اجازه دسترسی را فعال کنید.");
      return false;
    }
  }, []);

  const toggleMic = React.useCallback(async () => {
    try {
      // 1) Always try to request mic permission first to trigger browser prompt
      const allowed = await ensureMicPermission();
      if (!allowed) return;

      // 2) Then check speech recognition availability
      const RecognitionCtor = (typeof window !== 'undefined') && (window.webkitSpeechRecognition || window.SpeechRecognition);
      if (!RecognitionCtor) {
        alert("تبدیل گفتار به متن در این مرورگر پشتیبانی نمی‌شود. Chrome/Edge پیشنهاد می‌شود.");
        return;
      }

      if (!isListening) {
        baseTextRef.current = value || "";
        const recognition = new RecognitionCtor();
        recognition.lang = 'fa-IR';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => setIsListening(true);
        recognition.onerror = (e) => { try { console.warn('Speech error:', e?.error || e); } catch {}; stopRecognition(); };
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = (result[0] && result[0].transcript) ? result[0].transcript : "";
            if (result.isFinal) final += transcript;
            else interim += transcript;
          }
          const merged = (baseTextRef.current + (final || interim ? (baseTextRef.current ? " " : "") + (final || interim) : "")).trim();
          onChange && onChange(merged);
          if (final) baseTextRef.current = merged;
        };
        try { recognition.start(); } catch {}
        recognitionRef.current = recognition;
      } else {
        stopRecognition();
      }
    } catch {}
  }, [isListening, value, onChange, ensureMicPermission, stopRecognition]);

  React.useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  return (
    <StyledInput
      fullWidth
      placeholder="Write a message..."
      variant="filled"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      onKeyDown={onKeyDown}
      InputProps={{
        disableUnderline: true,
        startAdornment: (
          <Stack sx={{ width: "max-content" }}>
            <Stack
              sx={{
                position: "relative",
                display: openActions ? "inline-block" : "none",
              }}
            >
              {Actions.map((el) => (
                <Tooltip placement="right" title={el.title}>
                  <Fab
                    onClick={() => {
                      setOpenActions(!openActions);
                    }}
                    sx={{
                      position: "absolute",
                      top: -el.y,
                      backgroundColor: el.color,
                    }}
                    aria-label="add"
                  >
                    {el.icon}
                  </Fab>
                </Tooltip>
              ))}
            </Stack>

            <InputAdornment>
              <IconButton
                onClick={() => {
                  setOpenActions(!openActions);
                }}
              >
                <LinkSimple />
              </IconButton>
            </InputAdornment>
          </Stack>
        ),
        endAdornment: (
          <Stack sx={{ position: "relative" }}>
            <InputAdornment>
              <IconButton
                onClick={() => {
                  setOpenPicker(!openPicker);
                }}
              >
                <Smiley />
              </IconButton>
              <IconButton onClick={toggleMic}>
                {isListening ? <MicrophoneSlash /> : <Microphone />}
              </IconButton>
            </InputAdornment>
          </Stack>
        ),
      }}
    />
  );
};

const Footer = ({ onSend, disabled = false }) => {
  const theme = useTheme();

  const isMobile = useResponsive("between", "md", "xs", "sm");

  const [searchParams] = useSearchParams();

  const [openPicker, setOpenPicker] = React.useState(false);
  const [text, setText] = React.useState("");

  const attemptSend = React.useCallback(() => {
    const value = (text || "").trim();
    if (!value || !onSend || disabled) return;
    onSend(value);
    setText("");
  }, [text, onSend, disabled]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      attemptSend();
    }
  };
  return (
    <Box>
      <Box
        p={isMobile ? 1 : 2}
        width={"100%"}
        sx={{
          backgroundColor:
            theme.palette.mode === "light"
              ? "#F8FAFF"
              : theme.palette.background,
          boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
          position: "fixed",
          bottom: 0,
          left: "420px",
          width: "calc(100vw - 420px)",
          zIndex: 10,
        }}
      >
        <Stack direction="row" alignItems={"center"} spacing={isMobile ? 1 : 3}>
          <Stack sx={{ width: "100%" }}>
            <Box
              style={{
                zIndex: 10,
                position: "fixed",
                display: openPicker ? "inline" : "none",
                bottom: 81,
                right: isMobile
                  ? 20
                  : searchParams.get("open") === "true"
                  ? 420
                  : 100,
              }}
            >
              <Picker
                theme={theme.palette.mode}
                data={data}
                onEmojiSelect={console.log}
              />
            </Box>
            {/* Chat Input */}
            <ChatInput
              openPicker={openPicker}
              setOpenPicker={setOpenPicker}
              value={text}
              onChange={setText}
              onKeyDown={handleKeyDown}
            />
          </Stack>
          <Box
            sx={{
              height: 48,
              width: 48,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 1.5,
            }}
          >
            <Stack
              sx={{ height: "100%" }}
              alignItems={"center"}
              justifyContent="center"
            >
              <IconButton onClick={attemptSend} disabled={disabled}>
                <PaperPlaneTilt color="#ffffff" />
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default Footer;
