// routes
import Router from "./routes";
// theme
import ThemeProvider from './theme';
// components
import ThemeSettings from './components/settings';
import {AuthProvider} from "./Login/Component/Context/AuthContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
          <ThemeSettings>
              {" "}
              <Router />{" "}
          </ThemeSettings>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
