import React, {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';
import webSocketService from "../Services/WebSocketService";
import { clearAllPrivateChatsForCurrentUser } from '../../../utils/chatStorage';

const AuthContext = createContext();
const HEARTBEAT_INTERVAL = 3000; // 3 ثانیه
const HEARTBEAT_TIMEOUT = 10000; // 10 ثانیه برای timeout
// پس از 5 ضربان پیاپیِ بی‌پاسخ، کاربر لاگ‌اوت شود
const MISSED_HEARTBEATS_LIMIT = 5;
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [token, setToken] = useState(null);
    const [onRegisterSuccessCallback, setOnRegisterSuccessCallback] = useState(null);

    const lastHeartbeatResponseRef = useRef(Date.now());
    const heartbeatTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const missedBeatsRef = useRef(0);
    const tokenRef = useRef(null);
    const isAuthenticatedRef = useRef(false);
    const registerPendingRef = useRef(false);



    const logout = useCallback(() => {
        if (isAuthenticated && token) {
            webSocketService.send({
                type: "logout",
                token: token
            });
        }

        // پاک کردن تایمرها
        clearInterval(heartbeatIntervalRef.current);
        clearTimeout(heartbeatTimeoutRef.current);

        // کدهای موجود برای پاک کردن state و localStorage
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        try {
            // Remove all private chat caches for current user (email-based prefix)
            clearAllPrivateChatsForCurrentUser();
            // Remove PV cache
            localStorage.removeItem('PV');
            // Remove auth
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } catch (e) {
            console.error('Failed to cleanup localStorage on logout:', e);
        }
    }, [isAuthenticated, token]);



    const updateAvatar = useCallback((file) => {
        if (!token) {
            console.error("❌ Cannot update avatar: User not authenticated.");
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            webSocketService.send({
                type: "update_avatar",
                token: token,
                filename: file.name,
                avatar_data: reader.result
            });
        };
        reader.onerror = error => {
            console.error("❌ Error reading file for avatar update:", error);
            alert("خطا در پردازش فایل. لطفا دوباره تلاش کنید.");
        };
    }, [token]);

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

    const sendHeartbeat = useCallback(() => {
        if (isAuthenticatedRef.current && tokenRef.current) {
            console.log('❤️ Heartbeat sent at:', new Date().toISOString()); // این خط اضافه شد
            // شمارش ضربان‌های بی‌پاسخ؛ اگر پاسخ نیامده باشد، شمارنده افزایش می‌یابد
            missedBeatsRef.current += 1;
            console.log('⏱️ missed heartbeats =', missedBeatsRef.current);
            if (missedBeatsRef.current >= MISSED_HEARTBEATS_LIMIT) {
                console.error('Heartbeat: missed 5 consecutive responses. Logging out.');
                logout();
                return;
            }

            webSocketService.send({
                type: "heartbeat",
                token: tokenRef.current
            });

            // تنظیم timeout فقط برای مانیتورینگ؛ خروج صرفاً با 5 ضربانِ بی
            // پیاپیِ بی
            // پاسخ انجام می
            // شود
            clearTimeout(heartbeatTimeoutRef.current);
            heartbeatTimeoutRef.current = setTimeout(() => {
                if (Date.now() - lastHeartbeatResponseRef.current > HEARTBEAT_TIMEOUT) {
                    console.warn('Heartbeat timeout window passed without ack. Waiting for consecutive-miss logic.');
                }
            }, HEARTBEAT_TIMEOUT);
        }
    }, [logout]);
    const handleHeartbeatResponse = useCallback((response) => {
        const isHeartbeatAck = response?.type === 'heartbeat_ack' || response?.type === 'heartbeat_response' || (response?.type && String(response.type).includes('heartbeat'));
        if (isHeartbeatAck) {
            lastHeartbeatResponseRef.current = Date.now();
            missedBeatsRef.current = 0; // ریست شمارنده پس از دریافت پاسخ
            clearTimeout(heartbeatTimeoutRef.current);
            console.log('🫀 Heartbeat response at:', new Date().toISOString());
        }
    }, []);


    const handleWebSocketMessage = useCallback((rawData) => {
        let response;
        try { response = JSON.parse(rawData); } catch (error) { return; }

        // --- *** THE DEFINITIVE FIX IS HERE *** ---
        // 1. Changed the condition to check for `avatarUrl` property instead of `type`.
        if (response.status === 'success' && response.hasOwnProperty('avatarUrl')) {
            console.log('✅ Avatar update response received. Relative URL:', response.avatarUrl);
            alert(response.message || 'تصویر پروفایل با موفقیت به‌روزرسانی شد.');
            
            // 2. Prepend the user-specified local file path.
            const backendBasePath = 'http://localhost:8080/';
            const fullAvatarUrl = backendBasePath + response.avatarUrl;
            console.log('Constructed full avatar URL:', fullAvatarUrl);
            
            // Use functional update to guarantee access to the latest state.
            setUser(currentUser => {
                if (!currentUser) return null; // Safety check
                const updatedUser = { 
                    ...currentUser, 
                    profile: { 
                        ...currentUser.profile, 
                        avatarUrl: fullAvatarUrl // Use the newly constructed full URL
                    } 
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('✅ User state and localStorage successfully updated with new avatar.');
                return updatedUser;
            });
        }
        else if (response.token && response.user) {
            setIsLoading(false); handleLoginSuccess(response);
        } else if (registerPendingRef.current && response.status === 'success' && !response.token) {
            registerPendingRef.current = false;
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
            setIsLoading(false);
            if (registerPendingRef.current) registerPendingRef.current = false;
            handleFailure(response);
        }
        handleHeartbeatResponse(response);
    }, [handleHeartbeatResponse]);


    // به‌روزرسانی useEffect برای تنظیم تایمر heartbeat
    useEffect(() => {
        if (isAuthenticated) {
            // مقداردهی اولیه برای جلوگیری از لاگ‌اوت اشتباهی
            lastHeartbeatResponseRef.current = Date.now();
            missedBeatsRef.current = 0;
            // شروع تایمر heartbeat
            heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

            // پاک کردن تایمر هنگام unmount
            return () => {
                clearInterval(heartbeatIntervalRef.current);
                clearTimeout(heartbeatTimeoutRef.current);
            };
        }
    }, [isAuthenticated]);

    // Sync refs for stable callbacks
    useEffect(() => {
        tokenRef.current = token;
        isAuthenticatedRef.current = isAuthenticated;
    }, [token, isAuthenticated]);


    const handleLoginSuccess = (response) => {
        localStorage.setItem('token', response.token);
        let JSONUSER = response.user;
        let JsonProFile = JSONUSER.profile
        const URLUP = JsonProFile.avatarUrl;
        if (URLUP !== null || URLUP !== "") {
            const AddSUB_URL = 'http://localhost:8080/';
            JsonProFile.avatarUrl = AddSUB_URL + URLUP;
            JSONUSER.profile = JsonProFile;
        }
        localStorage.setItem('user', JSON.stringify(JSONUSER));
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
        setIsLoading(true);
        registerPendingRef.current = true;
        webSocketService.send({ type: 'register', username, email, password });
    };

    // const logout = () => {
    //     if (user || token) {
    //         setUser(null); setToken(null); setIsAuthenticated(false);
    //         localStorage.removeItem('user'); localStorage.removeItem('token');
    //     }
    // };


// به‌روزرسانی تابع logout

    const setOnRegisterSuccess = useCallback((callback) => {
        setOnRegisterSuccessCallback(() => callback);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout, setOnRegisterSuccess, updateUser, setNotificationStatus, changePassword, updateAvatar }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
