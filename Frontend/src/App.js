// routes
import Router from "./routes";
// theme
import ThemeProvider from './theme';
// components
import ThemeSettings from './components/settings';
import {AuthProvider} from "./Login/Component/Context/AuthContext";
import { VideoCallProvider } from './contexts/VideoCallContext';
import VideoCallOverlay from './components/VideoCallOverlay.jsx';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VideoCallProvider>
          <ThemeSettings>
              {" "}
              <Router />{" "}
              <VideoCallOverlay />
          </ThemeSettings>
        </VideoCallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
