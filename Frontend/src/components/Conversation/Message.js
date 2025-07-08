// import { Box, Stack } from "@mui/material"
// import { Chat_History } from "../../data"
// import { TextMsg } from "./MsgType"

// const Message = () => {
//     return (
//         <Box p={3}>
//             <Stack spacing={3}>
//                 {Chat_History.map((el, index) => {
//                     switch (el.type) {
//                         case "divider":
//                             return null

//                         case "msg":
//                             switch (el.subtype) {
//                                 case "img":
//                                     //img  msg
//                                     break
//                                 case "doc":
//                                     //doc msg
//                                     break
//                                 case "link":
//                                     //link msg
//                                     break
//                                 case "reply":
//                                     // reply msg
//                                     break

//                                 default:
//                                     return <TextMsg key={index} el={el} />
//                             }
//                             break

//                         default:
//                             break
//                     }
//                     return null
//                 })}
//             </Stack>
//         </Box>
//     )
// }

// export default Message




//.................................................................MAIN


import { Stack } from "@mui/material"
import { Chat_History } from "../../data"
import { DocMsg, LinkMsg, MediaMsg, ReplyMsg, TextMsg } from "./MsgType"

const Message = () => {
    return (
        <Stack spacing={2}>
            {/* {Chat_History.map((el, index) => {
                switch (el.type) {
                    case "divider":
                        return null // دیوایدر را در index.js نمایش می‌دهیم

                    case "msg":
                        switch (el.subtype) {
                            case "img":
                                return <MediaMsg key={index} el={el} />

                            case "doc":
                                //doc msg
                                return <DocMsg key={index} el={el}/>
                            case "link":
                                //link msg
                                <LinkMsg key={index} el={el} />

                            // case "reply":
                            //     return <ReplyMsg key={index} el={el} />
                            //Add Reply in component MsgType coment shode

                            default:
                                return <TextMsg key={index} el={el} />
                        }
                        break

                    default:
                        break
                }
                return null
            })} */}
        </Stack>
    )
}

export default Message


// ........................................................................

// "use client"

// import { Stack } from "@mui/material"
// import { TextMsg, DocMsg, LinkMsg, MediaMsg, ReplyMsg } from "./MsgType"
// import { Chat_History } from "@/src/data"

// const Message = () => {
//   return (
//     <Stack spacing={2}>
//       {Chat_History.map((el, index) => {
//         switch (el.type) {
//           case "divider":
//             return null

//           case "msg":
//             switch (el.subtype) {
//               case "img":
//                 return <MediaMsg key={index} el={el} />

//               case "doc":
//                 return <DocMsg key={index} el={el} />

//               case "link":
//                 return <LinkMsg key={index} el={el} />

//               case "reply":
//                 return <ReplyMsg key={index} el={el} />

//               default:
//                 return <TextMsg key={index} el={el} />
//             }

//           default:
//             return null
//         }
//       })}
//     </Stack>
//   )
// }

// export default Message

