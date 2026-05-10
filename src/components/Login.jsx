import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// مطمئن شوید مسیرهای زیر بر اساس ساختار پوشه‌های شما درست باشند
import api from '../services/api'; 
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    // در بک‌اند FastAPI لاگین با نام username دریافت می‌شود، اما ما از کاربر شماره موبایل می‌گیریم
    const [username, setUsername] = useState(''); 
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const { login } = useContext(AuthContext); // فرض بر این است که تابع login توکن را در State و localStorage ذخیره می‌کند

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // آماده‌سازی دقیق دیتای فرم مطابق با نیاز Swagger و OAuth2PasswordRequestForm در FastAPI
        const formData = new URLSearchParams();
        formData.append('grant_type', 'password');
        formData.append('username', username); // شماره موبایل
        formData.append('password', password);
        formData.append('scope', '');
        formData.append('client_id', 'string');
        formData.append('client_secret', 'string');

        try {
            const response = await api.post('/api/v1/login', formData, {
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            localStorage.setItem('token', response.data.access_token);


            // استخراج توکن از پاسخ بک‌اند
            const { access_token } = response.data;

            // ۱. لاگین کردن کاربر در کانتکست (ذخیره توکن)
            if (login) {
                login(access_token);
            } else {
                // فال‌بک در صورتی که تابع login در کانتکست پیاده‌سازی نشده باشد
                localStorage.setItem('token', access_token);
            }

            // ۲. دیکد کردن توکن برای دریافت نقش کاربر
            const decodedToken = jwtDecode(access_token);
            const userRole = decodedToken.role; // توجه: مطمئن شوید نام فیلد نقش در پی‌لود توکن بک‌اند 'role' است

            // ۳. هدایت کاربر بر اساس نقش
            if (userRole === 'admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard'); // مسیر دشبورد کاربری
            }

        } catch (err) {
            console.error('خطای ورود:', err);
            if (err.response) {
                // خطاهایی که بک‌اند برمی‌گرداند (مثل 401 یا 422)
                setError(
                    typeof err.response.data.detail === 'string' 
                        ? err.response.data.detail 
                        : 'نام کاربری (شماره موبایل) یا رمز عبور اشتباه است.'
                );
            } else {
                // خطای شبکه یا در دسترس نبودن سرور
                setError('خطا در برقراری ارتباط با سرور. لطفاً وضعیت اینترنت یا سرور را بررسی کنید.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4" dir="rtl">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    ورود به سیستم
                </h2>
                
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            شماره موبایل
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="مثال: 09123456789"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            رمز عبور
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="رمز عبور خود را وارد کنید"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left"
                            dir="ltr"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2 px-4 rounded text-white transition-colors duration-200 ${
                            isLoading 
                                ? 'bg-blue-300 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isLoading ? 'در حال ورود...' : 'ورود'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
