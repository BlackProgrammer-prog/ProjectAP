import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import webSocketService from "../Services/WebSocketService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [onRegisterSuccessCallback, setOnRegisterSuccessCallback] = useState(null);
    
    const changePassword = useCallback((currentPassword, newPassword) => {
        if (!token) {
            console.error("❌ Cannot change password: User not authenticated.");
            return;
        }
        webSocketService.send({
            type: "change_password",
            token: token,
            current_password: currentPassword,
            new_password: newPassword
        });
    }, [token]);

    const setNotificationStatus = useCallback((enabled) => {
        if (!user || !token) {
            console.error("❌ Cannot update notifications: User not authenticated.");
            return;
        }
        const newUser = { ...user, settings: { ...user.settings, notificationsEnabled: enabled } };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        webSocketService.send({ type: "set_notification_status", token: token, enabled: enabled });
    }, [user, token]);

    const updateUser = useCallback((updates) => {
        if (!user || !token) return;
        const newUser = {
            ...user,
            profile: { ...user.profile, ...(updates.profile_json || {}) },
            settings: { ...user.settings, ...(updates.settings_json || {}) },
        };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        webSocketService.send({ type: "update_user_info", token: token, ...updates });
    }, [user, token]);

    const handleWebSocketMessage = useCallback((rawData) => {
        let response;
        try { response = JSON.parse(rawData); } catch (error) { return; }

        if (response.token && response.user) {
            setIsLoading(false); handleLoginSuccess(response);
        } else if (response.status === 'success' && !response.token) {
            setIsLoading(false); handleRegisterSuccess(response);
        } else if (response.type === 'change_password_response') {
            if (response.status === 'success') {
                alert('رمز عبور با موفقیت تغییر کرد.');
            } else {
                alert(`خطا در تغییر رمز عبور: ${response.message}`);
            }
        } else if (response.type === 'update_user_info_response' || response.type === 'set_notification_status_response') {
            if(response.status === 'success') {
                console.log(`✅ Server confirmed update for: ${response.type}`);
            } else {
                 console.error(`❌ Server failed update for: ${response.type}. Reason: ${response.message}`);
            }
        } else if (response.status === 'error' && (response.message?.includes('ورود') || response.message?.includes('ثبت نام'))) {
            setIsLoading(false); handleFailure(response);
        }
    }, [setOnRegisterSuccessCallback]);

    const handleLoginSuccess = (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user); setToken(response.token); setIsAuthenticated(true);
        alert('ورود با موفقیت انجام شد!');
    };

    const handleRegisterSuccess = (response) => {
        const message = response.message || 'ثبت نام با موفقیت انجام شد!';
        alert(message);
        if (onRegisterSuccessCallback) onRegisterSuccessCallback();
    };

    const handleFailure = (response) => {
        alert(`خطا: ${response.message || 'یک خطای احراز هویت رخ داده است.'}`);
        logout();
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
                setIsAuthenticated(true);
            } catch (e) { localStorage.clear(); }
        }
        setIsLoading(false);
        const cleanupListener = webSocketService.addGeneralListener(handleWebSocketMessage);
        return () => cleanupListener();
    }, [handleWebSocketMessage]);

    const login = (email, password) => {
        setIsLoading(true); webSocketService.send({ type: 'login', email, password });
    };

    const register = (username, email, password) => {
        setIsLoading(true); webSocketService.send({ type: 'register', username, email, password });
    };

    const logout = () => {
        if (user || token) {
            setUser(null); setToken(null); setIsAuthenticated(false);
            localStorage.removeItem('user'); localStorage.removeItem('token');
        }
    };
    
    const setOnRegisterSuccess = (callback) => {
        setOnRegisterSuccessCallback(() => callback);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout, setOnRegisterSuccess, updateUser, setNotificationStatus, changePassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
