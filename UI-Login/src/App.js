import React from 'react';
// import { AuthProvider } from './context/AuthContext';
import {AuthProvider} from "./Component/Context/AuthContext";
// import LoginRegister from './components/LoginRegister/LoginRegister';
import LoginRegister from "./Component/LoginRegister";
import './App.css';

function App() {
    return (
        <AuthProvider>
            <div className="App">
                <LoginRegister />
            </div>
        </AuthProvider>
    );
}

export default App;