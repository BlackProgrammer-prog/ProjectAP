import React, { createContext, useContext, useState, useEffect } from 'react';
import webSocketService from "../Services/WebSocketService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [onRegisterSuccessCallback, setOnRegisterSuccessCallback] = useState(null);

    const handleWebSocketMessage = (rawData) => {
        let response;
        try {
            response = JSON.parse(rawData);
        } catch (error) {
            return; // Not a JSON message for auth, ignore it
        }

        // --- AUTHENTICATION LOGIC ---
        if (response.token && response.user) { // Login success
            setIsLoading(false);
            console.log('🧠 Auth Handler: Identified as LOGIN SUCCESS.');
            handleLoginSuccess(response);
        } else if (response.status === 'success' && !response.token) { // Register success
             setIsLoading(false);
            console.log('🧠 Auth Handler: Identified as REGISTER SUCCESS.');
            handleRegisterSuccess(response);
        } else if (response.status === 'error' && (response.message.includes('ورود') || response.message.includes('ثبت نام') || response.message.includes('Login') || response.message.includes('Registration'))) {
             setIsLoading(false);
            console.log('🧠 Auth Handler: Identified as AUTH FAILURE response.');
            handleFailure(response);
        }
    };

    const handleLoginSuccess = (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        setToken(response.token);
        setIsAuthenticated(true);
        alert('ورود با موفقیت انجام شد!');
    };

    const handleRegisterSuccess = (response) => {
        const message = response.message || 'ثبت نام با موفقیت انجام شد! اکنون می‌توانید وارد شوید.';
        alert(message);
        if (onRegisterSuccessCallback) {
            onRegisterSuccessCallback();
        }
    };

    const handleFailure = (response) => {
        const errorMessage = response.message || 'یک خطای احراز هویت رخ داده است.';
        alert(`خطا: ${errorMessage}`);
        logout();
    };

    useEffect(() => {
        if (!webSocketService.socket || webSocketService.socket.readyState === WebSocket.CLOSED) {
            webSocketService.connect();
        }
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
            setIsAuthenticated(true);
        }
        setIsLoading(false);

        // ** Use the new addGeneralListener **
        const cleanupListener = webSocketService.addGeneralListener(handleWebSocketMessage);
        return () => {
            cleanupListener(); // Cleanup on unmount
        };
    }, [onRegisterSuccessCallback]);

    const login = (email, password) => {
        setIsLoading(true);
        webSocketService.send({ type: 'login', email, password });
    };

    const register = (username, email, password) => {
        setIsLoading(true);
        webSocketService.send({ type: 'register', username, email, password });
    };

    const logout = () => {
        if (user || token || isAuthenticated) {
            setUser(null);
            setToken(null);
            setIsAuthenticated(false);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    };
    
    const setOnRegisterSuccess = (callback) => {
        setOnRegisterSuccessCallback(() => callback);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout, setOnRegisterSuccess }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
