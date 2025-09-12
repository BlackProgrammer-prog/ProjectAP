// import { Suspense, lazy } from "react";
// import { Navigate, useRoutes } from "react-router-dom";

// // layouts
// import DashboardLayout from "../layouts/dashboard";

// // config
// import { DEFAULT_PATH } from "../config";
// import LoadingScreen from "../components/LoadingScreen";

// const Loadable = (Component) => (props) => {
//   return (
//     <Suspense fallback={<LoadingScreen />}>
//       <Component {...props} />
//     </Suspense>
//   );
// };

// export default function Router() {
//   return useRoutes([
//     {
//       path: "/",
//       element: <DashboardLayout />,
//       children: [
//         { element: <Navigate to={DEFAULT_PATH} replace />, index: true },
//         { path: "app", element: <GeneralApp /> },

//         { path: "404", element: <Page404 /> },
//         { path: "*", element: <Navigate to="/404" replace /> },
//       ],
//     },
//     { path: "*", element: <Navigate to="/404" replace /> },
//   ]);
// }

// const GeneralApp = Loadable(
//   lazy(() => import("../pages/dashboard/GeneralApp")),
// );
// const Page404 = Loadable(lazy(() => import("../pages/Page404")));


//-----------------------------------------------------------------

import { Suspense, lazy } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import DashboardLayout from "../layouts/dashboard";
import { DEFAULT_PATH } from "../config";
import LoadingScreen from "../components/LoadingScreen";

const Loadable = (Component) => (props) => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Component {...props} />
    </Suspense>
  );
};

export default function Router() {
  return useRoutes([
    {
      path: "/Login-Register",
      element: <Login />,
    },
    {
      path: "/",
      element: <DashboardLayout />,
      children: [
        { element: <Navigate to={DEFAULT_PATH} replace />, index: true },
        { path: "Login-Register", element: <Login /> },
        { path: "app", element: <GeneralApp /> },
        { path: "app/group/:groupId", element: <GroupChatPage /> },
        // { path: "game", element: <TicTocToe/> },
        { path: "settings", element: <Settings /> },
        { path: "group", element: <GroupPage /> },
        { path: "call", element: <CallPage /> },
        {path:"contacts" , element: <ContactsPage />},
        { path: "games", element: <Game /> },
        { path: "video-call", element: <Videocall /> },
        { path: "profile", element: <Profile /> },
        { path: "AI/state", element: <AIState /> },
        { path: "chatgpt", element: <ChatGPT /> },
        { path: "deepseek", element: <DeepSeek /> },
        { path: "gemini", element: <Gemini /> },
        { path: "tictactoe", element: <TicTocToe /> },
        { path: "pacman", element: <Pacman /> },
        { path: "chess", element: <Chess /> },
        { path: "services", element: <Services /> },

        { path: "Calculate", element: <Calculate/> },
        { path: "Calender",  element: <Calender/> },
        { path: "Coin",      element: <Coin/> },
        { path: "Compiler",  element: <Compiler/> },
        { path: "Robot",     element: <Robot/> },
        { path: "Weather",   element: <Weather/> },

        { path: "app/chat/:username", element: <ChatPage /> }, // اضافه کردن روت برای چت شخصی
        { path: "404", element: <Page404 /> },
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
    { path: "*", element: <Navigate to="/404" replace /> },
  ]);
}

const GeneralApp = Loadable(lazy(() => import("../pages/dashboard/GeneralApp")));
const Settings = Loadable(lazy(() => import("../pages/dashboard/Settings")));

const Calculate = Loadable(lazy(() => import("../services/calculater/Calc")));
const Calender = Loadable(lazy(() => import("../services/calender/Calender")));
const Coin = Loadable(lazy(() => import("../services/coin/Coin")));
const Compiler = Loadable(lazy(() => import("../services/compiler/Compiler")));
const Robot = Loadable(lazy(() => import("../services/robot/Robot")));
const Weather = Loadable(lazy(() => import("../services/weather/Weather")));

const ChatPage = Loadable(lazy(() => import("../pages/dashboard/ChatPage")));
const CallPage = Loadable(lazy(() => import("../pages/dashboard/Call")));
const ContactsPage = Loadable(lazy(() => import("../pages/dashboard/Contacts")));
const Videocall = Loadable(lazy(() => import("../pages/dashboard/StartCall")));
const AIState = Loadable(lazy(() => import("../AI/stateAI")));
const ChatGPT = Loadable(lazy(() => import("../AI/chatgpt/ChatGPTAPI")));
const Gemini = Loadable(lazy(() => import("../AI/copilot/CopilotAPI")));
const DeepSeek = Loadable(lazy(() => import("../AI/deepseek/DeepSeekAPI")));
const TicTocToe = Loadable(lazy(() => import("../Game/tic-toc-toe/TicTocToe")));
const Chess = Loadable(lazy(() => import("../Game/chess/Chess")));
const Pacman = Loadable(lazy(() => import("../Game/pac-man/Pacman")));
const Game = Loadable(lazy(() => import("../Game/GameState/index")))
const Login = Loadable(lazy(() => import("../Login/LoginRegister")));
const Profile = Loadable(lazy(() => import("../layouts/dashboard/Profile")));
const Services = Loadable(lazy(() => import("../services/state/ServiceState")));
const GroupPage = Loadable(lazy(() => import("../pages/dashboard/Group")))
const GroupChatPage = Loadable(lazy(() => import("../pages/dashboard/GroupChatPage")))
const Page404 = Loadable(lazy(() => import("../pages/Page404")));