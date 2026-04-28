import React, { useState } from 'react';
import  DailyTimeRegister  from './DailyTimeRegister';

const UserDashboard = () => {
  // Set the default active tab
  const [activeTab, setActiveTab] = useState('daily');

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">داشبورد کاربر</h1>
        
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
