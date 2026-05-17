import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ManageDepartments = () => {
    // State های مربوط به فرم
    const [departmentName, setDepartmentName] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // State های مربوط به لیست دپارتمان‌ها
    const [departments, setDepartments] = useState([]);
    const [isFetching, setIsFetching] = useState(true);

    // تابع دریافت لیست دپارتمان‌ها
    const fetchDepartments = async () => {
        setIsFetching(true);
        try {
            // به‌روزرسانی مسیر API
            const response = await api.get('/api/v1/department/get-all-departments');
            setDepartments(response.data);
        } catch (error) {
            console.error("Error fetching departments:", error);
            setMessage({ type: 'error', text: 'خطا در دریافت لیست دپارتمان‌ها.' });
        } finally {
            setIsFetching(false);
        }
    };

    // دریافت داده‌ها هنگام لود شدن کامپوننت
    useEffect(() => {
        fetchDepartments();
    }, []);

    // تابع افزودن دپارتمان جدید
    const handleAddDepartment = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const payload = {
                name: departmentName,
                description: description || ""
            };
            
            // به‌روزرسانی مسیر API
            await api.post('/api/v1/department/create-department', payload);
            
            setMessage({ type: 'success', text: 'دپارتمان با موفقیت اضافه شد.' });
            setDepartmentName('');
            setDescription('');
            
            // بروزرسانی لیست دپارتمان‌ها پس از ثبت موفق
            fetchDepartments();
        } catch (error) {
            console.error("Error creating department:", error);
            // جلوگیری از خطای React child object در صورت آرایه بودن ارور
            let errorDetail = error.response?.data?.detail;
            if (typeof errorDetail !== 'string') {
                errorDetail = JSON.stringify(errorDetail);
            }
            setMessage({ type: 'error', text: errorDetail || 'خطا در افزودن دپارتمان.' });
        } finally {
            setIsLoading(false);
        }
    };

    // تابع حذف دپارتمان (جدید)
    const handleDeleteDepartment = async (id) => {
        if (!window.confirm("آیا از حذف این دپارتمان اطمینان دارید؟")) {
            return;
        }
        
        setMessage(null);
        try {
            await api.delete(`/api/v1/department/delete-department/${id}`);
            setMessage({ type: 'success', text: 'دپارتمان با موفقیت حذف شد.' });
            
            // بروزرسانی لیست
            fetchDepartments();
        } catch (error) {
            console.error("Error deleting department:", error);
            let errorDetail = error.response?.data?.detail;
            if (typeof errorDetail !== 'string') {
                errorDetail = JSON.stringify(errorDetail);
            }
            setMessage({ type: 'error', text: errorDetail || 'خطا در حذف دپارتمان.' });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* بخش فرم اضافه کردن دپارتمان */}
            <div className="bg-white p-6 rounded shadow-md h-fit">
                <h3 className="text-lg font-bold mb-4">اضافه کردن دپارتمان جدید</h3>
                
                {message && (
                    <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleAddDepartment} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-1">نام دپارتمان *</label>
                        <input
                            type="text"
                            value={departmentName}
                            onChange={(e) => setDepartmentName(e.target.value)}
                            required
                            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="مثال: منابع انسانی"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-gray-700 mb-1">توضیحات دپارتمان</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="توضیحات مربوط به این دپارتمان..."
                            rows="3"
                        ></textarea>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full p-2 rounded text-white transition-colors ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isLoading ? 'در حال ثبت...' : 'ثبت دپارتمان'}
                    </button>
                </form>
            </div>

            {/* بخش نمایش لیست دپارتمان‌ها */}
            <div className="bg-white p-6 rounded shadow-md">
                <h3 className="text-lg font-bold mb-4">لیست دپارتمان‌ها</h3>
                {isFetching ? (
                    <div className="text-center py-4 text-gray-500">در حال دریافت اطلاعات...</div>
                ) : departments.length > 0 ? (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {departments.map((dept) => (
                            <div key={dept.id} className="border p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-gray-800">{dept.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${dept.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {dept.is_active ? 'فعال' : 'غیرفعال'}
                                        </span>
                                        <button 
                                            onClick={() => handleDeleteDepartment(dept.id)}
                                            className="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
                                            title="حذف دپارتمان"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </div>
                                {dept.description && (
                                    <p className="text-sm text-gray-600 mb-3">{dept.description}</p>
                                )}
                                <div className="text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                                    تعداد پروژه‌ها: {dept.projects ? dept.projects.length : 0}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded border border-dashed">
                        هیچ دپارتمانی یافت نشد.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageDepartments;
