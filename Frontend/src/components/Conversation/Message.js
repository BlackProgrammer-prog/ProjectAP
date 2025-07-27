




//.................................................................MAIN


import { Stack } from "@mui/material"
import { DocMsg, LinkMsg, MediaMsg, ReplyMsg, TextMsg } from "./MsgType"

const Message = ({ messages, onDeleteMessage }) => {
    return (
        <Stack spacing={2}>
            {messages && messages.map((el, index) => {
                switch (el.type) {
                    case "divider":
                        return null; // دیوایدر را در index.js نمایش می‌دهیم

                    case "msg":
                        switch (el.subtype) {
                            case "img":
                                return <MediaMsg key={el.id || index} el={el} onDeleteMessage={onDeleteMessage} />

                            case "doc":
                                //doc msg
                                return <DocMsg key={el.id || index} el={el} onDeleteMessage={onDeleteMessage} />
                            case "link":
                                //link msg
                                return <LinkMsg key={el.id || index} el={el} onDeleteMessage={onDeleteMessage} />

                            // case "reply":
                            //     return <ReplyMsg key={el.id || index} el={el} onDeleteMessage={onDeleteMessage} />
                            //Add Reply in component MsgType coment shode

                            default:
                                return <TextMsg key={el.id || index} el={el} onDeleteMessage={onDeleteMessage} />
                        }
                        break

                    default:
                        break
                }
                return null
            })}
        </Stack>
    )
}

export default Message

