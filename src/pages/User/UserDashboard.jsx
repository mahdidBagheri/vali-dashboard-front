import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DailyTimeRegister from './DailyTimeRegister';
import { AuthContext } from '../../context/AuthContext'; // مسیر ایمپورت را بر اساس ساختار پوشه خود تنظیم کنید

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const { logout } = useContext(AuthContext); // دریافت تابع خروج از کانتکست
  const navigate = useNavigate();

  const handleLogout = () => {
    if (logout) {
      logout(); // پاک کردن توکن از state و localStorage
    } else {
      localStorage.removeItem('token'); // پشتیبان در صورت عدم وجود تابع در کانتکست
    }
    navigate('/login'); // هدایت به صفحه لاگین
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section with Title and Logout Button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">داشبورد کاربر</h1>
          
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm"
          >
            خروج از حساب
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 font-medium text-sm focus:outline-none ${
              activeTab === 'daily'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('daily')}
          >
            ثبت کارکرد روزانه
          </button>
          
          <button
            className={`py-3 px-6 font-medium text-sm focus:outline-none ${
              activeTab === 'reports'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('reports')}
          >
            گزارش‌ها
          </button>
          {/* Add more tabs here as needed */}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm">
          {activeTab === 'daily' && <DailyTimeRegister />}
          {activeTab === 'reports' && <div className="p-6">محتوای گزارش‌ها...</div>}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
