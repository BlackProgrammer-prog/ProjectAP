// import React, { useState } from 'react';
// import './LoginRegister.css';
// import { FaUserAlt, FaLock } from "react-icons/fa";
// // import { MdEmail } from "react-icons/md";
// import { EnvelopeSimple, Lock, User } from 'phosphor-react';
// import backgroundImage from '../Login/Assist/background.jpg';
// const LoginRegister = () => {
//   const [action, setAction] = useState('');  // برای تنظیم تغییر حالت فرم

//   const registerLink = () => {
//     setAction('active');  // فعال کردن حالت ثبت‌نام
//   };

//   const loginLink = () => {
//     setAction('');  // فعال کردن حالت لاگین
//   };

//   return (
//   <div className={`wrapper ${action}`} style={{ backgroundImage: `url(${backgroundImage})` }}>
//     <div className="form-box login">
//       <form action="">
//         <h1>Login</h1>
//         <div className="input-box">
//           <input type="text" placeholder="Username" required />
//           <User className="icon" />
//         </div>
//         <div className="input-box">
//           <input type="password" placeholder="Password" required />
//           <Lock className="icon" />
//         </div>
//         <div className="remember-forgot">
//           <label>
//             <input type="checkbox" /> Remember me
//           </label>
//           <a href="#">Forgot password</a>
//         </div>
//         <button type="submit">Login</button>
//         <div className="register-link">
//           <p>Don't have an account? <a href="#" onClick={registerLink}>Register</a></p>
//         </div>
//       </form>
//     </div>
//     {/* ...................................................... */}
//     <div className="form-box register">
//       <form action="">
//         <h1>Registration</h1>
//         <div className="input-box">
//           <input type="text" placeholder="Username" required />
//           <FaUserAlt className="icon" />
//         </div>
//         <div className="input-box">
//           <input type="email" placeholder="Email" required />
//           {/* <MdEmail className="icon" /> */}
//           <EnvelopeSimple className='icon' />
//         </div>
//         <div className="input-box">
//           <input type="password" placeholder="Password" required />
//           <FaLock className="icon" />
//         </div>
//         <div className="remember-forgot">
//           <label>
//             <input type="checkbox" /> I agree to the terms & conditions
//           </label>
//         </div>
//         <button type="submit">Register</button>
//         <div className="register-link">
//           <p>Already have an account? <a href="#" onClick={loginLink}>Login</a></p>
//         </div>
//       </form>
//     </div>
//   </div>
//   );
// };

// export default LoginRegister;

// ===================================================

// import React, { useState } from 'react';
// import backgroundImage from './Assist/background.jpg';
// import {
//   Box,
//   Button,
//   Checkbox,
//   FormControlLabel,
//   IconButton,
//   InputAdornment,
//   Paper,
//   Stack,
//   TextField,
//   Typography,
//   Link
// } from '@mui/material';
// import { Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material';
// import { EnvelopeSimple } from 'phosphor-react';
// import { useNavigate } from 'react-router-dom';

// const LoginRegister = () => {
//   const navigate = useNavigate()
//   const [isLogin, setIsLogin] = useState(true);
//   const [showPassword, setShowPassword] = useState(false);

//   return (
//     <>
//       <Stack sx={{

//       }} >
//         <Box
//           sx={{
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center',
//             minHeight: '100vh',
//             backgroundImage: `url(${backgroundImage})`,
//             backgroundSize: 'cover',
//             backgroundPosition: 'center',
//             backgroundRepeat: 'no-repeat',
//             p: 2
//           }}
//         >
//           <Paper
//             elevation={3}
//             sx={{
//               p: 4,
//               width: '100%',
//               maxWidth: 400,
//               borderRadius: 2
//             }}
//           >
//             <Stack spacing={3}>
//               <Typography variant="h4" textAlign="center">
//                 {isLogin ? 'Login' : 'Register'}
//               </Typography>

//               <TextField
//                 label="Username"
//                 fullWidth
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Person />
//                     </InputAdornment>
//                   ),
//                 }}
//               />

//               {!isLogin && (
//                 <TextField
//                   label="Email"
//                   fullWidth
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <EnvelopeSimple size={20} />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//               )}

//               <TextField
//                 label="Password"
//                 type={showPassword ? 'text' : 'password'}
//                 fullWidth
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Lock />
//                     </InputAdornment>
//                   ),
//                   endAdornment: (
//                     <InputAdornment position="end">
//                       <IconButton
//                         onClick={() => setShowPassword(!showPassword)}
//                         edge="end"
//                       >
//                         {showPassword ? <VisibilityOff /> : <Visibility />}
//                       </IconButton>
//                     </InputAdornment>
//                   ),
//                 }}
//               />

//               {isLogin ? (
//                 <Stack direction="row" justifyContent="space-between">
//                   <FormControlLabel
//                     control={<Checkbox />}
//                     label="Remember me"
//                   />
//                   <Link href="#" variant="body2">
//                     Forgot password?
//                   </Link>
//                 </Stack>
//               ) : (
//                 <FormControlLabel
//                   control={<Checkbox />}
//                   label="I agree to the terms"
//                 />
//               )}

//               <Button

//                 variant="contained"
//                 size="large"
//                 fullWidth
//               >
//                 {isLogin ? 'Login' : 'Register'}
//               </Button>

//               <Typography textAlign="center">
//                 {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
//                 <Link
//                   href="#"
//                   onClick={() => setIsLogin(!isLogin)}
//                   sx={{ cursor: 'pointer' }}
//                 >
//                   {isLogin ? 'Register' : 'Login'}
//                 </Link>
//               </Typography>
//             </Stack>
//           </Paper>
//         </Box>
//       </Stack >
//     </>
//   );
// };

// export default LoginRegister;

// =================================================
//
// import React, { useState } from 'react';
// import backgroundImage from './Assist/background.jpg';
// import {
//   Box,
//   Button,
//   Checkbox,
//   FormControlLabel,
//   IconButton,
//   InputAdornment,
//   Paper,
//   Stack,
//   TextField,
//   Typography,
//   Link
// } from '@mui/material';
// import { Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material';
// import { EnvelopeSimple } from 'phosphor-react';
// import { useNavigate } from 'react-router-dom';
//
// const LoginRegister = () => {
//   const navigate = useNavigate();
//   const [isLogin, setIsLogin] = useState(true);
//   const [showPassword, setShowPassword] = useState(false);
//
//   const handleSubmit = () => {
//     if (isLogin) {
//       // اگر در حالت لاگین هستیم، به صفحه چت منتقل می‌شویم
//       navigate('/app'); // یا هر مسیر دیگری که صفحه چت شما دارد
//     }
//     // اگر در حالت رجیستر هستیم، هیچ کاری انجام نمی‌دهیم
//   };
//
//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         minHeight: '100vh',
//         backgroundImage: `url(${backgroundImage})`,
//         backgroundSize: 'cover',
//         backgroundPosition: 'center',
//         backgroundRepeat: 'no-repeat',
//         p: 2
//       }}
//     >
//       <Paper
//         elevation={3}
//         sx={{
//           p: 4,
//           width: '100%',
//           maxWidth: 400,
//           borderRadius: 2
//         }}
//       >
//         <Stack spacing={3}>
//           <Typography variant="h4" textAlign="center">
//             {isLogin ? 'Login' : 'Register'}
//           </Typography>
//
//           <TextField
//             label="Username"
//             fullWidth
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <Person />
//                 </InputAdornment>
//               ),
//             }}
//           />
//
//           {!isLogin && (
//             <TextField
//               label="Email"
//               fullWidth
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <EnvelopeSimple size={20} />
//                   </InputAdornment>
//                 ),
//               }}
//             />
//           )}
//
//           <TextField
//             label="Password"
//             type={showPassword ? 'text' : 'password'}
//             fullWidth
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <Lock />
//                 </InputAdornment>
//               ),
//               endAdornment: (
//                 <InputAdornment position="end">
//                   <IconButton
//                     onClick={() => setShowPassword(!showPassword)}
//                     edge="end"
//                   >
//                     {showPassword ? <VisibilityOff /> : <Visibility />}
//                   </IconButton>
//                 </InputAdornment>
//               ),
//             }}
//           />
//
//           {isLogin ? (
//             <Stack direction="row" justifyContent="space-between">
//               <FormControlLabel
//                 control={<Checkbox />}
//                 label="Remember me"
//               />
//               <Link href="#" variant="body2">
//                 Forgot password?
//               </Link>
//             </Stack>
//           ) : (
//             <FormControlLabel
//               control={<Checkbox />}
//               label="I agree to the terms"
//             />
//           )}
//
//           <Button
//             variant="contained"
//             size="large"
//             fullWidth
//             onClick={handleSubmit}
//           >
//             {isLogin ? 'Login' : 'Register'}
//           </Button>
//
//           <Typography textAlign="center">
//             {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
//             <Link
//               href="#"
//               onClick={() => setIsLogin(!isLogin)}
//               sx={{ cursor: 'pointer' }}
//             >
//               {isLogin ? 'Register' : 'Login'}
//             </Link>
//           </Typography>
//         </Stack>
//       </Paper>
//     </Box>
//   );
// };
//
// export default LoginRegister;
//----------------------------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import backgroundImage from './Assist/background.jpg';
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Typography,
    Link
} from '@mui/material';
import { Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material';
import { EnvelopeSimple } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Component/Context/AuthContext'; // مسیر رو طبق ساختار خودت تنظیم کن


const LoginRegister = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { login, register, isAuthenticated, isLoading } = useAuth();

    const handleSubmit = () => {
        if (isLogin) {
            login(username, password);
        } else {
            register(username, email, password);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/app');
        }
    }, [isAuthenticated, navigate]);

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                p: 2
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    width: '100%',
                    maxWidth: 400,
                    borderRadius: 2
                }}
            >
                <Stack spacing={3}>
                    <Typography variant="h4" textAlign="center">
                        {isLogin ? 'Login' : 'Register'}
                    </Typography>

                    <TextField
                        label="Username"
                        fullWidth
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Person />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {!isLogin && (
                        <TextField
                            label="Email"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EnvelopeSimple size={20} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}

                    <TextField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {isLogin ? (
                        <Stack direction="row" justifyContent="space-between">
                            <FormControlLabel
                                control={<Checkbox />}
                                label="Remember me"
                            />
                            <Link href="#" variant="body2">
                                Forgot password?
                            </Link>
                        </Stack>
                    ) : (
                        <FormControlLabel
                            control={<Checkbox />}
                            label="I agree to the terms"
                        />
                    )}

                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleSubmit}disabled={isLoading}
                    >
                        {isLogin ? 'Login' : 'Register'}
                    </Button>

                    <Typography textAlign="center">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <Link
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setIsLogin(!isLogin);
                            }}
                            sx={{ cursor: 'pointer' }}
                        >
                            {isLogin ? 'Register' : 'Login'}
                        </Link>
                    </Typography>
                </Stack>
            </Paper>
        </Box>
    );
};

export default LoginRegister;