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
      path: "/",
      element: <DashboardLayout />,
      children: [
        { element: <Navigate to={DEFAULT_PATH} replace />, index: true },
        { path: "app", element: <GeneralApp /> },
        { path: "settings", element: <Settings /> },
        { path: "group", element: <GroupPage /> },
        { path: "call", element: <CallPage /> },
        { path: "AI", element: <ChatGPT /> },
        { path: "app/chat/:id", element: <ChatPage /> }, // اضافه کردن روت برای چت شخصی
        { path: "404", element: <Page404 /> },
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
    { path: "*", element: <Navigate to="/404" replace /> },
  ]);
}

const GeneralApp = Loadable(lazy(() => import("../pages/dashboard/GeneralApp")));
const Settings = Loadable(lazy(() => import("../pages/dashboard/Settings")));
const ChatPage = Loadable(lazy(() => import("../pages/dashboard/ChatPage")));
const CallPage = Loadable(lazy(() => import("../pages/dashboard/Call")));
const ChatGPT = Loadable(lazy(() => import("../components/AI/ChatGPTAPI")));
const Login = Loadable(lazy(() => import("../Login/LoginRegister")));
const GroupPage = Loadable(lazy(() => import("../pages/dashboard/Group")))
const Page404 = Loadable(lazy(() => import("../pages/Page404")));