import React, { createContext, useContext, useState, useEffect } from 'react';
import webSocketService from "../Services/WebSocketService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        // اتصال به WebSocket هنگام لود اپلیکیشن
        webSocketService.connect();

        // بازیابی وضعیت کاربر از localStorage
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
            setIsAuthenticated(true);
            console.log('User restored from localStorage:', JSON.parse(storedUser));
            console.log('Token restored from localStorage:', storedToken);
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
        console.log('Login response received:', response);
        
        if (response.status === 'success') {
            const userData = {
                id: response.user.id,
                username: response.user.username,
                email: response.user.email,
                role: response.user.role
            };

            setUser(userData);
            setToken(response.token);
            setIsAuthenticated(true);

            // ذخیره در localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', response.token);
            
            console.log('Login successful! User:', userData);
            console.log('JWT Token stored:', response.token);
        } else {
            // مدیریت خطاهای لاگین
            console.error('Login failed:', response.message);
            console.log('Full error response:', response);
            alert(`Login failed: ${response.message}`);
        }
    };

    const handleRegisterResponse = (response) => {
        console.log('Register response received:', response);
        
        if (response.status === 'success') {
            console.log('Registration successful! Server response:', response);
            alert('Registration successful! You can now login.');
            // بعد از ثبت نام موفق، کاربر باید به صفحه لاگین برگردد
            // این کار در LoginRegister.jsx انجام می‌شود
        } else {
            console.error('Registration failed:', response.message);
            console.log('Full error response:', response);
            alert(`Registration failed: ${response.message}`);
        }
    };

    const login = (email, password) => {
        console.log('Attempting login with email:', email);
        webSocketService.send({
            type: 'login',
            email: email,  // تغییر از username به email
            password: password
        });
    };

    const register = (username, email, password) => {
        console.log('Attempting registration with username:', username, 'email:', email);
        webSocketService.send({
            type: 'register',
            username: username,
            email: email,
            password: password
        });
    };

    const logout = () => {
        console.log('User logging out...');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        console.log('User logged out and localStorage cleared');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
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