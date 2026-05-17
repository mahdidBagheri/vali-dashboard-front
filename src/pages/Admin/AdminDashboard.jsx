import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AddUserForm from './AddUserForm';
import ManageDepartments from './ManageDepartments';
import ManageProjects from './ManageProjects';
// 1. IMPORT THE NEW COMPONENT
import AdminUserManagement from './AdminUserManagement'; // Make sure this path is correct

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('addUser');
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100 dir-rtl">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="p-4 text-center text-xl font-bold border-b border-gray-700">
                    پنل مدیریت
                </div>
                <div className="flex-1 p-4">
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => setActiveTab('addUser')}
                                className={`w-full text-right px-4 py-2 rounded ${
                                    activeTab === 'addUser' ? 'bg-blue-600' : 'hover:bg-gray-700'
                                }`}
                            >
                                اضافه کردن کاربر
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('manageUsers')}
                                className={`w-full text-right px-4 py-2 rounded ${
                                    activeTab === 'manageUsers' ? 'bg-blue-600' : 'hover:bg-gray-700'
                                }`}
                            >
                                مدیریت کاربران
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('manageDepartments')}
                                className={`w-full text-right px-4 py-2 rounded ${
                                    activeTab === 'manageDepartments' ? 'bg-blue-600' : 'hover:bg-gray-700'
                                }`}
                            >
                                مدیریت دپارتمان‌ها
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('manageProjects')}
                                className={`w-full text-right px-4 py-2 rounded ${
                                    activeTab === 'manageProjects' ? 'bg-blue-600' : 'hover:bg-gray-700'
                                }`}
                            >
                                مدیریت پروژه‌ها
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white shadow p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {activeTab === 'addUser' && 'اضافه کردن کاربر جدید'}
                        {activeTab === 'manageUsers' && 'مدیریت کاربران'}
                        {activeTab === 'manageDepartments' && 'مدیریت دپارتمان‌ها'}
                        {activeTab === 'manageProjects' && 'مدیریت پروژه‌ها'}
                    </h2>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
                    >
                        خروج از حساب
                    </button>
                </header>

                {/* Content Area */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'addUser' && <AddUserForm />}
                    
                    {/* 2. REPLACE THE PLACEHOLDER DIV WITH THE COMPONENT */}
                    {activeTab === 'manageUsers' && <AdminUserManagement />}

                    {activeTab === 'manageDepartments' && <ManageDepartments />}
                    {activeTab === 'manageProjects' && <ManageProjects />}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
