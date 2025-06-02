import React, { useState } from 'react';
import './LoginRegister.css';
import { FaUserAlt, FaLock } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const LoginRegister = () => {
    const [action, setAction] = useState('');  // برای تنظیم تغییر حالت فرم

    const registerLink = () => {
        setAction('active');  // فعال کردن حالت ثبت‌نام
    };

    const loginLink = () => {
        setAction('');  // فعال کردن حالت لاگین
    };

    return (
        <div className={`wrapper ${action}`}>
            <div className="form-box login">
                <form action="">
                    <h1>Login</h1>
                    <div className="input-box">
                        <input type="text" placeholder="Username" required />
                        <FaUserAlt className="icon" />
                    </div>
                    <div className="input-box">
                        <input type="password" placeholder="Password" required />
                        <FaLock className="icon" />
                    </div>
                    <div className="remember-forgot">
                        <label>
                            <input type="checkbox" /> Remember me
                        </label>
                        <a href="#">Forgot password</a>
                    </div>
                    <button type="submit">Login</button>
                    <div className="register-link">
                        <p>Don't have an account? <a href="#" onClick={registerLink}>Register</a></p>
                    </div>
                </form>
            </div>
            {/* ...................................................... */}
            <div className="form-box register">
                <form action="">
                    <h1>Registration</h1>
                    <div className="input-box">
                        <input type="text" placeholder="Username" required />
                        <FaUserAlt className="icon" />
                    </div>
                    <div className="input-box">
                        <input type="email" placeholder="Email" required />
                        <MdEmail className="icon" />
                    </div>
                    <div className="input-box">
                        <input type="password" placeholder="Password" required />
                        <FaLock className="icon" />
                    </div>
                    <div className="remember-forgot">
                        <label>
                            <input type="checkbox" /> I agree to the terms & conditions
                        </label>
                    </div>
                    <button type="submit">Register</button>
                    <div className="register-link">
                        <p>Already have an account? <a href="#" onClick={loginLink}>Login</a></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginRegister;
