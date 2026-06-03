import React, { useState, useEffect } from 'react';
// Adjust the import path to your api service based on your project structure
import api from '../../services/api';

const PERSIAN_MONTHS = [
    { id: 1, name: 'فروردین (Farvardin)', days: 31, startMonth: 3, startDay: 21 }, // Approx mapping to 2026
    { id: 2, name: 'اردیبهشت (Ordibehesht)', days: 31, startMonth: 4, startDay: 21 },
    { id: 3, name: 'خرداد (Khordad)', days: 31, startMonth: 5, startDay: 22 },
    { id: 4, name: 'تیر (Tir)', days: 31, startMonth: 6, startDay: 22 },
    { id: 5, name: 'مرداد (Mordad)', days: 31, startMonth: 7, startDay: 23 },
    { id: 6, name: 'شهریور (Shahrivar)', days: 31, startMonth: 8, startDay: 23 },
    { id: 7, name: 'مهر (Mehr)', days: 30, startMonth: 9, startDay: 23 },
    { id: 8, name: 'آبان (Aban)', days: 30, startMonth: 10, startDay: 23 },
    { id: 9, name: 'آذر (Azar)', days: 30, startMonth: 11, startDay: 22 },
    { id: 10, name: 'دی (Dey)', days: 30, startMonth: 12, startDay: 22 },
    { id: 11, name: 'بهمن (Bahman)', days: 30, startMonth: 1, startDay: 21, nextYear: true },
    { id: 12, name: 'اسفند (Esfand)', days: 29, startMonth: 2, startDay: 20, nextYear: true }
];

const AdminMonitorHours = () => {
    const [activeTab, setActiveTab] = useState('users');

    // Selection States
    const [usersList, setUsersList] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(3); // Default Khordad
    const baseYear = 2026; 

    // Data States
    const [monthlyData, setMonthlyData] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/api/v1/user/get-all-users');
                setUsersList(response.data || []);
            } catch (err) {
                console.error("Error fetching users:", err);
            }
        };
        fetchUsers();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setMonthlyData([]);
        setExpandedRows({});
        setError(null);
    };

    const toggleRow = (date) => {
        setExpandedRows(prev => ({ ...prev, [date]: !prev[date] }));
    };

    // Helper to get Gregorian dates for a given Persian month approximation
    const generateMonthDates = (monthId) => {
        const monthInfo = PERSIAN_MONTHS.find(m => m.id === monthId);
        const dates = [];
        let currentMonth = monthInfo.startMonth;
        let currentDay = monthInfo.startDay;
        let currentYear = monthInfo.nextYear ? baseYear + 1 : baseYear;

        for (let i = 0; i < monthInfo.days; i++) {
            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
            dates.push(dateStr);
            
            // Basic date increment logic (simplified for standard 30/31 day months)
            const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
            currentDay++;
            if (currentDay > daysInCurrentMonth) {
                currentDay = 1;
                currentMonth++;
                if (currentMonth > 12) {
                    currentMonth = 1;
                    currentYear++;
                }
            }
        }
        return dates;
    };

    const handleFetchReport = async (e) => {
        if (e) e.preventDefault();
        
        if (activeTab === 'users' && !selectedUserId) {
            setError('لطفا ابتدا یک کاربر را انتخاب کنید.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setMonthlyData([]);
        setExpandedRows({});
        
        const dates = generateMonthDates(selectedMonth);

        try {
            // Fetch data for all days in the month concurrently
            const requests = dates.map(async (date) => {
                try {
                    const response = await api.get('/api/v1/timesheet/get-timesheet-by-date', {
                        params: { 
                            input_date: date,
                            user_id: selectedUserId // Assuming the API needs to know which user
                        }
                    });
                    
                    const dayData = response.data || [];
                    // Calculate total hours for the day
                    const totalHours = dayData.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);
                    
                    return {
                        date,
                        totalHours,
                        details: dayData
                    };
                } catch (err) {
                    return { date, totalHours: 0, details: [] }; // Return empty day on error for that specific date
                }
            });

            const results = await Promise.all(requests);
            setMonthlyData(results);
        } catch (err) {
            console.error('Error fetching monthly data:', err);
            setError('خطا در دریافت اطلاعات. لطفا مجدداً تلاش کنید.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md" dir="rtl">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
                نظارت بر ساعات کارکرد
            </h3>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => handleTabChange('users')}
                    className={`py-2 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                        activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    گزارش کاربران
                </button>
                <button
                    onClick={() => handleTabChange('projects')}
                    className={`py-2 px-6 font-medium text-sm focus:outline-none transition-colors duration-200 ${
                        activeTab === 'projects' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    گزارش پروژه‌ها
                </button>
            </div>
            
            {/* Filter Controls */}
            <div className="mb-6 flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-md border border-gray-100">
                {activeTab === 'users' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">کاربر</label>
                        <select 
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md shadow-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">انتخاب کاربر...</option>
                            {usersList.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.first_name ? `${user.first_name} ${user.last_name}` : user.username || user.email}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ماه</label>
                    <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="p-2 border border-gray-300 rounded-md shadow-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {PERSIAN_MONTHS.map((month) => (
                            <option key={month.id} value={month.id}>{month.name}</option>
                        ))}
                    </select>
                </div>

                <button 
                    onClick={handleFetchReport} 
                    disabled={isLoading || (activeTab === 'users' && !selectedUserId)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
                >
                    {isLoading ? 'در حال بارگذاری...' : 'مشاهده گزارش'}
                </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* Users Tab Content */}
            {activeTab === 'users' && monthlyData.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-gray-600 border border-gray-200">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 text-right">
                            <tr>
                                <th className="px-6 py-3 border-b">تاریخ</th>
                                <th className="px-6 py-3 border-b">مجموع ساعات</th>
                                <th className="px-6 py-3 border-b text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.map((dayData) => (
                                <React.Fragment key={dayData.date}>
                                    <tr className="bg-white border-b hover:bg-gray-50 text-right">
                                        <td className="px-6 py-4" dir="ltr">{dayData.date}</td>
                                        <td className="px-6 py-4 font-bold text-blue-600">{dayData.totalHours}</td>
                                        <td className="px-6 py-4 text-center">
                                            {dayData.details.length > 0 ? (
                                                <button 
                                                    onClick={() => toggleRow(dayData.date)}
                                                    className="text-blue-500 hover:text-blue-700 font-medium"
                                                >
                                                    {expandedRows[dayData.date] ? 'بستن جزئیات ▲' : 'مشاهده جزئیات ▼'}
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                    
                                    {/* Expanded Details Row */}
                                    {expandedRows[dayData.date] && dayData.details.length > 0 && (
                                        <tr className="bg-gray-50 border-b">
                                            <td colSpan="3" className="px-6 py-4">
                                                <table className="w-full text-sm text-gray-600 bg-white border border-gray-200 shadow-inner rounded">
                                                    <thead className="bg-gray-100 text-xs text-right text-gray-700 uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 border-b">پروژه</th>
                                                            <th className="px-4 py-2 border-b">زیر پروژه</th>
                                                            <th className="px-4 py-2 border-b">زیرِ زیر پروژه</th>
                                                            <th className="px-4 py-2 border-b">ساعت</th>
                                                            <th className="px-4 py-2 border-b">توضیحات</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dayData.details.map((detail, idx) => (
                                                            <tr key={idx} className="border-b text-right hover:bg-gray-50">
                                                                <td className="px-4 py-2">{detail.project_name || '-'}</td>
                                                                <td className="px-4 py-2">{detail.subproject_name || '-'}</td>
                                                                <td className="px-4 py-2">{detail.subsubproject_name || '-'}</td>
                                                                <td className="px-4 py-2 text-blue-600 font-medium">{detail.hours || '0'}</td>
                                                                <td className="px-4 py-2">{detail.description || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Projects Tab Content */}
            {activeTab === 'projects' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center text-gray-600">
                    <p>جدول گزارش پروژه‌ها در اینجا قرار می‌گیرد.</p>
                </div>
            )}
        </div>
    );
};

export default AdminMonitorHours;
