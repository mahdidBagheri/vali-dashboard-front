import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ManageProjects = () => {
    // === State مربوط به ساختار درختی کامل داده‌ها ===
    const [departments, setDepartments] = useState([]);

    // === State های مربوط به فرم ایجاد پروژه (Project) ===
    const [selectedDeptName, setSelectedDeptName] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');

    // === State های مربوط به فرم ایجاد زیرپروژه ۱ (Subproject1) ===
    const [selectedProjectName, setSelectedProjectName] = useState('');
    const [subproject1Name, setSubproject1Name] = useState('');
    const [subproject1Desc, setSubproject1Desc] = useState('');

    // === State های مربوط به فرم ایجاد زیرپروژه ۲ (Subproject2) ===
    const [selectedSub1Name, setSelectedSub1Name] = useState('');
    const [subproject2Name, setSubproject2Name] = useState('');
    const [subproject2Desc, setSubproject2Desc] = useState('');

    // === پیام‌ها و وضعیت لودینگ ===
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // دریافت داده‌های اولیه
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            // دریافت کل ساختار درختی از یک API
            const deptRes = await api.get('/api/v1/admin/get-all-departments');
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            showMessage('error', 'خطا در دریافت اطلاعات پایه.');
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    // --- استخراج داده‌های مسطح برای منوهای کشویی (Select) ---
    // تمام پروژه‌ها از همه دپارتمان‌ها
    const allProjects = departments.flatMap(d => d.projects || []);
    // تمام زیرپروژه‌های 1 از همه پروژه‌ها
    const allSubprojects1 = allProjects.flatMap(p => p.sub_projects1 || []);

    // --- فیلتر کردن داده‌ها برای نمایش در سمت راست کارت‌ها ---
    const selectedDeptObj = departments.find(d => d.name === selectedDeptName);
    const filteredProjects = selectedDeptObj?.projects || [];

    const selectedProjObj = allProjects.find(p => p.name === selectedProjectName);
    const filteredSubprojects1 = selectedProjObj?.sub_projects1 || [];

    const selectedSub1Obj = allSubprojects1.find(sp => sp.name === selectedSub1Name);
    const filteredSubprojects2 = selectedSub1Obj?.sub_projects2 || [];


    // --- توابع هندل کردن سابمیت فرم‌ها ---

    const handleAddProject = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                department_name: selectedDeptName,
                name: projectName,
                description: projectDesc
            };
            await api.post('/api/v1/admin/create-project', payload);
            
            showMessage('success', 'پروژه با موفقیت ایجاد شد.');
            setProjectName('');
            setProjectDesc('');
            fetchAllData(); 
        } catch (error) {
            showMessage('error', 'خطا در ایجاد پروژه.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSubproject1 = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                name: subproject1Name,
                description: subproject1Desc,
                // ارسال نام به جای آیدی، چرا که آیدی در پاسخ API موجود نیست
                project_name: selectedProjectName 
            };
            await api.post('/api/v1/admin/create-subproject1', payload);

            showMessage('success', 'زیرپروژه ۱ با موفقیت ایجاد شد.');
            setSubproject1Name('');
            setSubproject1Desc('');
            fetchAllData();
        } catch (error) {
            showMessage('error', 'خطا در ایجاد زیرپروژه ۱.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSubproject2 = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                name: subproject2Name,
                description: subproject2Desc,
                // ارسال نام به جای آیدی
                subproject_name: selectedSub1Name
            };
            await api.post('/api/v1/admin/create-subproject2', payload);

            showMessage('success', 'زیرپروژه ۲ با موفقیت ایجاد شد.');
            setSubproject2Name('');
            setSubproject2Desc('');
            fetchAllData();
        } catch (error) {
            showMessage('error', 'خطا در ایجاد زیرپروژه ۲.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-10 max-w-6xl mx-auto p-4">
            {message && (
                <div className={`p-4 rounded shadow-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'}`}>
                    {message.text}
                </div>
            )}

            {/* ردیف اول: پروژه (Project) */}
            <div className="bg-white rounded-lg shadow-md border-t-4 border-blue-500 flex flex-col md:flex-row overflow-hidden">
                <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-l border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-blue-700">۱. ایجاد پروژه جدید</h3>
                    <form onSubmit={handleAddProject} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">انتخاب دپارتمان *</label>
                            <select
                                value={selectedDeptName}
                                onChange={(e) => setSelectedDeptName(e.target.value)}
                                required
                                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">انتخاب دپارتمان...</option>
                                {departments.map(dept => (
                                    <option key={dept.name} value={dept.name}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">نام پروژه *</label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">توضیحات</label>
                            <input
                                type="text"
                                value={projectDesc}
                                onChange={(e) => setProjectDesc(e.target.value)}
                                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <button type="submit" disabled={isLoading || !selectedDeptName} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400">
                            ثبت پروژه
                        </button>
                    </form>
                </div>
                
                <div className="p-6 md:w-1/2 bg-gray-50">
                    <h4 className="text-md font-bold mb-3 text-gray-700">پروژه‌های این دپارتمان</h4>
                    {!selectedDeptName ? (
                        <p className="text-sm text-gray-500 italic">ابتدا یک دپارتمان انتخاب کنید.</p>
                    ) : filteredProjects.length > 0 ? (
                        <ul className="space-y-2">
                            {filteredProjects.map((p, index) => (
                                <li key={p.name || index} className="bg-white p-3 rounded shadow-sm border border-gray-200 text-sm">
                                    <span className="font-semibold text-blue-800">{p.name}</span>
                                    {p.description && <span className="block text-gray-500 text-xs mt-1">{p.description}</span>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic mt-2">هیچ پروژه‌ای یافت نشد.</p>
                    )}
                </div>
            </div>

            {/* ردیف دوم: زیرپروژه ۱ (Subproject1) */}
            <div className="bg-white rounded-lg shadow-md border-t-4 border-green-500 flex flex-col md:flex-row overflow-hidden">
                <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-l border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-green-700">۲. ایجاد زیرپروژه ۱</h3>
                    <form onSubmit={handleAddSubproject1} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">پروژه والد *</label>
                            <select
                                value={selectedProjectName}
                                onChange={(e) => setSelectedProjectName(e.target.value)}
                                required
                                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-green-400"
                            >
                                <option value="">انتخاب پروژه...</option>
                                {allProjects.map(proj => (
                                    <option key={proj.name} value={proj.name}>{proj.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">نام زیرپروژه ۱ *</label>
                            <input
                                type="text"
                                value={subproject1Name}
                                onChange={(e) => setSubproject1Name(e.target.value)}
                                required
                                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">توضیحات</label>
                            <input
                                type="text"
                                value={subproject1Desc}
                                onChange={(e) => setSubproject1Desc(e.target.value)}
                                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                        <button type="submit" disabled={isLoading || !selectedProjectName} className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:bg-gray-400">
                            ثبت زیرپروژه ۱
                        </button>
                    </form>
                </div>
                
                <div className="p-6 md:w-1/2 bg-gray-50">
                    <h4 className="text-md font-bold mb-3 text-gray-700">زیرپروژه‌های (۱) این پروژه</h4>
                    {!selectedProjectName ? (
                        <p className="text-sm text-gray-500 italic">ابتدا یک پروژه انتخاب کنید.</p>
                    ) : filteredSubprojects1.length > 0 ? (
                        <ul className="space-y-2">
                            {filteredSubprojects1.map((sp, index) => (
                                <li key={sp.name || index} className="bg-white p-3 rounded shadow-sm border border-gray-200 text-sm">
                                    <span className="font-semibold text-green-800">{sp.name}</span>
                                    {sp.description && <span className="block text-gray-500 text-xs mt-1">{sp.description}</span>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">هیچ زیرپروژه‌ای برای این پروژه ثبت نشده است.</p>
                    )}
                </div>
            </div>

            {/* ردیف سوم: زیرپروژه ۲ (Subproject2) */}
            <div className="bg-white rounded-lg shadow-md border-t-4 border-purple-500 flex flex-col md:flex-row overflow-hidden">
                <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-l border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-purple-700">۳. ایجاد زیرپروژه ۲</h3>
                    <form onSubmit={handleAddSubproject2} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">زیرپروژه ۱ والد *</label>
                            <select
                                value={selectedSub1Name}
                                onChange={(e) => setSelectedSub1Name(e.target.value)}
                                required
                                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-purple-400"
                            >
                                <option value="">انتخاب زیرپروژه ۱...</option>
                                {allSubprojects1.map(sub1 => (
                                    <option key={sub1.name} value={sub1.name}>{sub1.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">نام زیرپروژه ۲ *</label>
                            <input
                                type="text"
                                value={subproject2Name}
                                onChange={(e) => setSubproject2Name(e.target.value)}
                                required
                                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-purple-400"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">توضیحات</label>
                            <input
                                type="text"
                                value={subproject2Desc}
                                onChange={(e) => setSubproject2Desc(e.target.value)}
                                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-purple-400"
                            />
                        </div>
                        <button type="submit" disabled={isLoading || !selectedSub1Name} className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:bg-gray-400">
                            ثبت زیرپروژه ۲
                        </button>
                    </form>
                </div>
                
                <div className="p-6 md:w-1/2 bg-gray-50">
                    <h4 className="text-md font-bold mb-3 text-gray-700">زیرپروژه‌های (۲) این والد</h4>
                    {!selectedSub1Name ? (
                        <p className="text-sm text-gray-500 italic">ابتدا زیرپروژه ۱ را انتخاب کنید.</p>
                    ) : filteredSubprojects2.length > 0 ? (
                        <ul className="space-y-2">
                            {filteredSubprojects2.map((ssp, index) => (
                                <li key={ssp.name || index} className="bg-white p-3 rounded shadow-sm border border-gray-200 text-sm">
                                    <span className="font-semibold text-purple-800">{ssp.name}</span>
                                    {ssp.description && <span className="block text-gray-500 text-xs mt-1">{ssp.description}</span>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">هیچ رکوردی برای این بخش ثبت نشده است.</p>
                    )}
                </div>
            </div>

        </div>
    );
};

export default ManageProjects;
