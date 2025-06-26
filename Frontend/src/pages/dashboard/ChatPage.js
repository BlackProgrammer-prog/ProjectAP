import { useParams } from "react-router-dom";
import { Box, Stack } from "@mui/material";
import Conversation from "../../components/Conversation";
import { useTheme } from "@mui/material/styles";
import { ChatList } from "../../data";

const ChatPage = () => {
    const theme = useTheme();
    const { id } = useParams(); // دریافت ID مخاطب از URL
    const chat = ChatList.find((chat) => chat.id === id); // یافتن مخاطب بر اساس ID

    if (!chat) {
        return <div>مخاطب یافت نشد</div>;
    }

    return (
        <Stack direction={"row"}>
            {/* ناحیه اصلی مکالمه */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 30,
                    left: 420,
                    height: "100vh",
                    width: "calc(100vw - 420px)",
                    backgroundColor: theme.palette.mode === "light" ? "#F0F4FA" : theme.palette.background.paper,
                }}
            >
                <Conversation chatData={chat} /> {/* ارسال اطلاعات مخاطب به کامپوننت Conversation */}
            </Box>
        </Stack>
    );
};

export default ChatPage;