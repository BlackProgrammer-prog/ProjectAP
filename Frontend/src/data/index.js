import { faker } from "@faker-js/faker";
import {
  ChatCircleDots,
  Gear,
  GearSix,
  Phone,
  SignOut,
  User,
  Users,
} from "phosphor-react";
import { useNavigate } from "react-router-dom";
import { loadPrivateChat } from "../utils/chatStorage";

// const navigate = useNavigate()

const Profile_Menu = [
  {
    title: "Profile",
    icon: <User />,
  },
  {
    title: "Settings",
    icon: <Gear />,
  },
  {
    title: "LogOut",
    icon: <SignOut />,
    // onclick: navigate('Login-Register')
  },
];


const Nav_Buttons = [
  {
    index: 0,
    icon: <ChatCircleDots />,
  },

  {
    index: 1,
    icon: <Users />,
  },
  {
    index: 2,
    icon: <Phone />,
  },
];

const Nav_Setting = [
  {
    index: 3,
    icon: <GearSix />,
  },
];

// تابع برای دریافت آخرین پیام از چت خصوصی هر کاربر
const getLastMessage = (username) => {
  try {
    const privateChat = loadPrivateChat(username);
    if (privateChat && privateChat.length > 0) {
      const lastMessage = privateChat[privateChat.length - 1];
      return lastMessage.message || "No messages yet";
    }
  } catch (error) {
    console.error("Error loading last message:", error);
  }
  return "No messages yet";
};

const ChatList = [
  {
    id: 0,
    username: "parham",
    img: faker.image.avatar(),
    name: "parham",
    msg: getLastMessage("parham"),
    // time: "9:36",
    unread: 0,
    pinned: true,
    online: true,
  },
  {
    id: 1,
    username: "mmd",
    img: faker.image.avatar(),
    name: "mmd",
    msg: getLastMessage("mmd"),
    // time: "12:02",
    unread: 2,
    pinned: true,
    online: false,
  },
  {
    id: 2,
    username: "mahdi",
    img: faker.image.avatar(),
    name: "mahdi",
    msg: getLastMessage("mahdi"),
    // time: "10:35",
    unread: 3,
    pinned: false,
    online: true,
  },
  {
    id: 3,
    username: "meysam",
    img: faker.image.avatar(),
    name: "meysam",
    msg: getLastMessage("meysam"),
    // time: "04:00",
    unread: 0,
    pinned: false,
    online: true,
  },
  {
    id: 4,
    username: "misagh",
    img: faker.image.avatar(),
    name: "misagh",
    msg: getLastMessage("misagh"),
    // time: "08:42",
    unread: 0,
    pinned: false,
    online: false,
  },
  {
    id: 5,
    username: "jdhjkchd",
    img: faker.image.avatar(),
    name: "jdhjkchd",
    msg: getLastMessage("jdhjkchd"),
    // time: "08:42",
    unread: 0,
    pinned: false,
    online: false,
  },
  {
    id: 6,
    username: "jdjkh",
    img: faker.image.avatar(),
    name: "jdjkh",
    msg: getLastMessage("jdjkh"),
    // time: "08:42",
    unread: 0,
    pinned: false,
    online: false,
  },
  {
    id: 7,
    username: "cgfcf",
    img: faker.image.avatar(),
    name: "cgfcf",
    msg: getLastMessage("cgfcf"),
    // time: "08:42",
    unread: 0,
    pinned: false,
    online: false,
  },
];

// const ChatList = [
//   {
//     id: 0,
//     img: faker.image.avatar(),
//     name: "meysam",
//     msg: "سلام علی جون خوبی؟",
//     time: "9:36",
//     unread: 0,
//     pinned: true,
//     online: true,
//     messages: [
//       {
//         id: 1,
//         type: "msg",
//         message: "سلام علی جون خوبی؟",
//         incoming: true,
//         outgoing: false,
//         time: "9:36",
//       },
//       {
//         id: 2,
//         type: "msg",
//         message: "سلام! خوبم ممنون تو چطوری؟",
//         incoming: false,
//         outgoing: true,
//         time: "9:38",
//       },
//     ],
//   },
//   {
//     id: 1,
//     img: faker.image.avatar(),
//     name: "Parham",
//     msg: "سلام اقا علی ممنون تو خوبی؟",
//     time: "12:02",
//     unread: 2,
//     pinned: true,
//     online: false,
//     messages: [
//       {
//         id: 1,
//         type: "msg",
//         message: "سلام اقا علی ممنون تو خوبی؟",
//         incoming: true,
//         outgoing: false,
//         time: "12:02",
//       },
//     ],
//   },
// ];


const CallList = [
  {
    id: 0,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
    incoming: true,
    missed: false,
  },
  {
    id: 1,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
    incoming: false,
    missed: true,
  },
  {
    id: 2,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
    incoming: true,
    missed: true,
  },
  {
    id: 3,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
    incoming: false,
    missed: false,
  },
  {
    id: 4,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
    incoming: true,
    missed: false,
  },
  {
    id: 5,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
    incoming: false,
    missed: false,
  },
  {
    id: 6,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
    incoming: true,
    missed: false,
  },
  {
    id: 7,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
    incoming: false,
    missed: false,
  },
  {
    id: 8,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
    incoming: true,
    missed: false,
  },
  {
    id: 9,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
    incoming: false,
    missed: false,
  },
  {
    id: 10,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
    incoming: true,
    missed: false,
  },
  {
    id: 11,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
    incoming: false,
    missed: false,
  },
  {
    id: 12,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
    incoming: true,
    missed: false,
  },
];




const MembersList = [
  {
    id: 0,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 1,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 2,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
  },
  {
    id: 3,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 4,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
  },
  {
    id: 5,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 6,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 7,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 8,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 9,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
  },
  {
    id: 10,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 11,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 12,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: false,
  },
  {
    id: 13,
    img: faker.image.avatar(),
    name: faker.name.firstName(),
    online: true,
  },

]

// ایجاد timestamp های واقعی برای پیام‌ها
const createTimestamp = (hours, minutes) => {
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now.toISOString();
};

const Chat_History = [
  {
    id: "msg_1",
    type: "msg",
    message: "Hi 👋🏻, How are ya ?",
    incoming: true,
    outgoing: false,
    timestamp: createTimestamp(9, 30),
    sender: "other",
  },
  {
    id: "msg_2",
    type: "msg",
    message: "Hi 👋 Panda, not bad, u ?",
    incoming: false,
    outgoing: true,
    timestamp: createTimestamp(9, 32),
    sender: "me",
    reactions: {
      heart: ["other"],
      thumbsUp: ["other", "me"]
    }
  },
  {
    id: "msg_3",
    type: "msg",
    message: "Can you send me an abstract image?",
    incoming: false,
    outgoing: true,
    timestamp: createTimestamp(9, 35),
    sender: "me",
  },
  {
    id: "msg_4",
    type: "msg",
    message: "Ya sure, sending you a pic",
    incoming: true,
    outgoing: false,
    timestamp: createTimestamp(9, 40),
    sender: "other",
  },
  {
    id: "msg_5",
    type: "msg",
    subtype: "img",
    message: "Here You Go",
    img: faker.image.abstract(),
    incoming: true,
    outgoing: false,
    timestamp: createTimestamp(9, 42),
    sender: "other",
  },
  {
    id: "msg_6",
    type: "msg",
    message: "Can you please send this in file format?",
    incoming: false,
    outgoing: true,
    timestamp: createTimestamp(10, 15),
    sender: "me",
  },
  {
    id: "msg_7",
    type: "msg",
    subtype: "doc",
    message: "Yes sure, here you go.",
    incoming: true,
    outgoing: false,
    timestamp: createTimestamp(10, 20),
    sender: "other",
  },
  {
    id: "msg_8",
    type: "msg",
    subtype: "link",
    preview: faker.image.cats(),
    message: "Yep, I can also do that",
    incoming: true,
    outgoing: false,
    timestamp: createTimestamp(10, 25),
    sender: "other",
  },
  {
    id: "msg_9",
    type: "msg",
    subtype: "reply",
    reply: "This is a reply",
    message: "Yep, I can also do that",
    incoming: false,
    outgoing: true,
    timestamp: createTimestamp(10, 30),
    sender: "me",
  },
];

const Message_options = [
  {
    title: "Reply",
  },
  {
    title: "React to message",
  },
  {
    title: "Forward message",
  },
  {
    title: "Star message",
  },
  {
    title: "Report",
  },
  {
    title: "Delete Message",
  },
];

export {
  Profile_Menu,
  Nav_Setting,
  Nav_Buttons,
  ChatList,
  Chat_History,
  Message_options,
  CallList,
  MembersList
};

