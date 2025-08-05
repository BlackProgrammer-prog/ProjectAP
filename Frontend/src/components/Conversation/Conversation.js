import { useParams } from "react-router-dom";
import { ChatList } from "../../data";

const Conversation = ({ username, chatData, messages, onSend }) => {
    const { id } = useParams();
    const currentChat = ChatList.find(chat => chat.id === id);

    return (
        <Stack sx={{ height: "100vh", position: "relative" }}>
            <Header chatData={currentChat}  username={username} />

            {/* <Header name={chatData.name} img={chatData.img} /> */}



            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    pt: "100px",
                    pb: "80px",
                    px: 2,
                    backgroundColor: (theme) =>
                        theme.palette.mode === "light" ? "#F8FAFF" : theme.palette.background.paper,
                }}
            >
                <Stack spacing={3}>
                    <Timeline text="Today" />
                    {currentChat ? (
                        <Message messages={messages} />
                    ) : (
                        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
                            مخاطب مورد نظر یافت نشد
                        </Typography>
                    )}
                </Stack>
            </Box>

            <Footer username={username} onSend={onSend} />
        </Stack>
    );
};