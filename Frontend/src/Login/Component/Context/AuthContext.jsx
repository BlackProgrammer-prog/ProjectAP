import React, { createContext, useContext, useState, useEffect } from 'react';
import webSocketService from "../Services/WebSocketService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // اتصال به WebSocket هنگام لود اپلیکیشن
        webSocketService.connect();

        // بازیابی وضعیت کاربر از localStorage
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }

        setIsLoading(false);

        // اضافه کردن listener برای پاسخ‌های لاگین
        const cleanupLoginListener = webSocketService.addListener('login_response', handleLoginResponse);
        const cleanupRegisterListener = webSocketService.addListener('register_response', handleRegisterResponse);

        return () => {
            cleanupLoginListener();
            cleanupRegisterListener();
        };
    }, []);

    const handleLoginResponse = (response) => {
        if (response.status === 'success') {
            const userData = {
                id: response.user.id,
                username: response.user.username,
                role: response.user.role
            };

            setUser(userData);
            setIsAuthenticated(true);

            // ذخیره در localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', response.token);
        } else {
            // مدیریت خطاهای لاگین
            console.error('Login failed:', response.message);
            alert(`Login failed: ${response.message}`);
        }
    };

    const handleRegisterResponse = (response) => {
        if (response.status === 'success') {
            alert('Registration successful! You can now login.');
        } else {
            console.error('Registration failed:', response.message);
            alert(`Registration failed: ${response.message}`);
        }
    };

    const login = (username, password) => {
        webSocketService.send({
            type: 'login',
            username,
            password
        });
    };

    const register = (username, email, password) => {
        webSocketService.send({
            type: 'register',
            username,
            email,
            password
        });
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                isLoading,
                login,
                register,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);