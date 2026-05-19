import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Assuming this is a pre-configured axios instance

// Helper function to extract detailed error messages from the FastAPI backend
const getErrorMessage = (error) => {
  if (error.response?.data?.detail) {
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail.map(d => d.msg || 'Invalid input').join('; ');
    }
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};

const ManageProjects = () => {
    // State for the complete data tree
    const [departments, setDepartments] = useState([]);

    // States for Project creation form
    const [selectedDeptId, setSelectedDeptId] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');

    // States for Subproject1 creation form
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [subproject1Name, setSubproject1Name] = useState('');
    const [subproject1Desc, setSubproject1Desc] = useState('');

    // States for Subproject2 creation form
    const [selectedSub1Id, setSelectedSub1Id] = useState('');
    const [subproject2Name, setSubproject2Name] = useState('');
    const [subproject2Desc, setSubproject2Desc] = useState('');

    // Messages and loading state
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const deptRes = await api.get('/api/v1/department/get-all-departments');
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            showMessage('error', getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    // --- Form Submission Handlers (Create) ---
    const handleAddProject = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                department_id: parseInt(selectedDeptId, 10),
                name: projectName,
                description: projectDesc
            };
            await api.post('/api/v1/department/create-project', payload);
            showMessage('success', 'پروژه با موفقیت ایجاد شد.');
            setProjectName('');
            setProjectDesc('');
            fetchAllData(); 
        } catch (error) {
            showMessage('error', getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSubproject1 = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                project_id: parseInt(selectedProjectId, 10),
                name: subproject1Name,
                description: subproject1Desc,
            };
            await api.post('/api/v1/department/create-subproject1', payload);
            showMessage('success', 'زیرپروژه ۱ با موفقیت ایجاد شد.');
            setSubproject1Name('');
            setSubproject1Desc('');
            fetchAllData();
        } catch (error) {
            showMessage('error', getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSubproject2 = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // اصلاح نام کلید به sub_project1_id طبق ساختار بک‌اند
            const payload = {
                sub_project1_id: parseInt(selectedSub1Id, 10),
                name: subproject2Name,
                description: subproject2Desc,
            };
            await api.post('/api/v1/department/create-subproject2', payload);
            showMessage('success', 'زیرپروژه ۲ با موفقیت ایجاد شد.');
            setSubproject2Name('');
            setSubproject2Desc('');
            fetchAllData();
        } catch (error) {
            showMessage('error', getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    // --- Delete Handler ---
    const handleDelete = async (type, id, name) => {
        if (!window.confirm(`آیا از حذف ${type} به نام «${name}» اطمینان دارید؟`)) {
            return;
        }
        setIsLoading(true);
        try {
            await api.delete(`/api/v1/department/delete-${type}/${id}`);
            showMessage('success', `${type} با موفقیت حذف شد.`);
            fetchAllData();
        } catch (error) {
             showMessage('error', getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }

    // --- Data for dropdowns and display ---
    const allProjects = departments.flatMap(d => (d.projects || []).map(p => ({...p, departmentName: d.name })));
    const allSubprojects1 = allProjects.flatMap(p => (p.sub_projects1 || []).map(s1 => ({...s1, parentProjectName: p.name })));

    const selectedDeptObj = departments.find(d => d.id === parseInt(selectedDeptId, 10));
    const filteredProjects = selectedDeptObj?.projects || [];

    const selectedProjObj = allProjects.find(p => p.id === parseInt(selectedProjectId, 10));
    const filteredSubprojects1 = selectedProjObj?.sub_projects1 || [];

    const selectedSub1Obj = allSubprojects1.find(sp => sp.id === parseInt(selectedSub1Id, 10));
    const filteredSubprojects2 = selectedSub1Obj?.sub_projects2 || [];

    return (
        <div className="space-y-10 max-w-6xl mx-auto p-4">
            {message && (
                <div className={`p-4 rounded shadow-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'}`}>
                    {message.text}
                </div>
            )}

            {/* Department List & Deletion */}
            <div className="bg-white rounded-lg shadow-md border-t-4 border-gray-500 p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-700">دپارتمان‌ها</h3>
                {departments.length > 0 ? (
                    <ul className="space-y-2">
                        {departments.map(dept => (
                            <li key={dept.id} className="bg-gray-50 p-3 rounded shadow-sm border flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-gray-800">{dept.name}</span>
                                    {dept.description && <span className="block text-gray-500 text-xs mt-1">{dept.description}</span>}
                                </div>
                                <button
                                    onClick={() => handleDelete('department', dept.id, dept.name)}
                                    disabled={isLoading}
                                    className="bg-red-500 text-white px-3 py-1 text-xs font-bold rounded hover:bg-red-600 disabled:bg-gray-400"
                                >
                                    حذف
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                     <p className="text-sm text-gray-500 italic">دپارتمانی یافت نشد.</p>
                )}
            </div>

            {/* Project Card */}
            <div className="bg-white rounded-lg shadow-md border-t-4 border-blue-500 flex flex-col md:flex-row overflow-hidden">
                <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-l border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-blue-700">۱. ایجاد پروژه جدید</h3>
                    <form onSubmit={handleAddProject} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">انتخاب دپارتمان *</label>
                            <select value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)} required className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400">
                                <option value="">انتخاب دپارتمان...</option>
                                {departments.map(dept => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">نام پروژه *</label>
                            <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} required className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400"/>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">توضیحات</label>
                            <input type="text" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-400"/>
                        </div>
                        <button type="submit" disabled={isLoading || !selectedDeptId} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400">
                            {isLoading ? 'در حال ثبت...' : 'ثبت پروژه'}
                        </button>
                    </form>
                </div>
                <div className="p-6 md:w-1/2 bg-gray-50">
                    <h4 className="text-md font-bold mb-3 text-gray-700">پروژه‌های این دپارتمان</h4>
                    {!selectedDeptId ? (<p className="text-sm text-gray-500 italic">ابتدا یک دپارتمان انتخاب کنید.</p>) : filteredProjects.length > 0 ? (
                        <ul className="space-y-2">
                            {filteredProjects.map(p => (
                                <li key={p.id} className="bg-white p-3 rounded shadow-sm border flex justify-between items-center text-sm">
                                    <div>
                                        <span className="font-semibold text-blue-800">{p.name}</span>
                                        {p.description && <span className="block text-gray-500 text-xs mt-1">{p.description}</span>}
                                    </div>
                                    <button onClick={() => handleDelete('project', p.id, p.name)} disabled={isLoading} className="bg-red-500 text-white px-3 py-1 text-xs font-bold rounded hover:bg-red-600 disabled:bg-gray-400">حذف</button>
                                </li>
                            ))}
                        </ul>
                    ) : (<p className="text-sm text-gray-500 italic mt-2">هیچ پروژه‌ای یافت نشد.</p>)}
                </div>
            </div>

            {/* Subproject1 Card */}
            <div className="bg-white rounded-lg shadow-md border-t-4 border-green-500 flex flex-col md:flex-row overflow-hidden">
                <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-l border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-green-700">۲. ایجاد زیرپروژه ۱</h3>
                    <form onSubmit={handleAddSubproject1} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">پروژه والد *</label>
                            <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} required className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-green-400">
                                <option value="">انتخاب پروژه...</option>
                                {allProjects.map(proj => (<option key={proj.id} value={proj.id}>{proj.name} ({proj.departmentName})</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">نام زیرپروژه ۱ *</label>
                            <input type="text" value={subproject1Name} onChange={(e) => setSubproject1Name(e.target.value)} required className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-green-400"/>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">توضیحات</label>
                            <input type="text" value={subproject1Desc} onChange={(e) => setSubproject1Desc(e.target.value)} className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-green-400"/>
                        </div>
                        <button type="submit" disabled={isLoading || !selectedProjectId} className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:bg-gray-400">
                            {isLoading ? 'در حال ثبت...' : 'ثبت زیرپروژه ۱'}
                        </button>
                    </form>
                </div>
                <div className="p-6 md:w-1/2 bg-gray-50">
                    <h4 className="text-md font-bold mb-3 text-gray-700">زیرپروژه‌های (۱) این پروژه</h4>
                    {!selectedProjectId ? (<p className="text-sm text-gray-500 italic">ابتدا یک پروژه انتخاب کنید.</p>) : filteredSubprojects1.length > 0 ? (
                        <ul className="space-y-2">
                            {filteredSubprojects1.map(sp => (
                                <li key={sp.id} className="bg-white p-3 rounded shadow-sm border flex justify-between items-center text-sm">
                                    <div>
                                        <span className="font-semibold text-green-800">{sp.name}</span>
                                        {sp.description && <span className="block text-gray-500 text-xs mt-1">{sp.description}</span>}
                                    </div>
                                    <button onClick={() => handleDelete('subproject1', sp.id, sp.name)} disabled={isLoading} className="bg-red-500 text-white px-3 py-1 text-xs font-bold rounded hover:bg-red-600 disabled:bg-gray-400">حذف</button>
                                </li>
                            ))}
                        </ul>
                    ) : (<p className="text-sm text-gray-500 italic">هیچ زیرپروژه‌ای برای این پروژه ثبت نشده است.</p>)}
                </div>
            </div>

            {/* Subproject2 Card */}
            <div className="bg-white rounded-lg shadow-md border-t-4 border-purple-500 flex flex-col md:flex-row overflow-hidden">
                <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-l border-gray-200">
                    <h3 className="text-xl font-bold mb-4 text-purple-700">۳. ایجاد زیرپروژه ۲</h3>
                    <form onSubmit={handleAddSubproject2} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">زیرپروژه ۱ والد *</label>
                            <select value={selectedSub1Id} onChange={(e) => setSelectedSub1Id(e.target.value)} required className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-purple-400">
                                <option value="">انتخاب زیرپروژه ۱...</option>
                                {allSubprojects1.map(sub1 => (<option key={sub1.id} value={sub1.id}>{sub1.name} ({sub1.parentProjectName})</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">نام زیرپروژه ۲ *</label>
                            <input type="text" value={subproject2Name} onChange={(e) => setSubproject2Name(e.target.value)} required className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-purple-400"/>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 text-sm font-semibold">توضیحات</label>
                            <input type="text" value={subproject2Desc} onChange={(e) => setSubproject2Desc(e.target.value)} className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-purple-400"/>
                        </div>
                        <button type="submit" disabled={isLoading || !selectedSub1Id} className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:bg-gray-400">
                            {isLoading ? 'در حال ثبت...' : 'ثبت زیرپروژه ۲'}
                        </button>
                    </form>
                </div>
                <div className="p-6 md:w-1/2 bg-gray-50">
                    <h4 className="text-md font-bold mb-3 text-gray-700">زیرپروژه‌های (۲) این والد</h4>
                    {!selectedSub1Id ? (<p className="text-sm text-gray-500 italic">ابتدا زیرپروژه ۱ را انتخاب کنید.</p>) : filteredSubprojects2.length > 0 ? (
                        <ul className="space-y-2">
                            {filteredSubprojects2.map(ssp => (
                                <li key={ssp.id} className="bg-white p-3 rounded shadow-sm border flex justify-between items-center text-sm">
                                    <div>
                                        <span className="font-semibold text-purple-800">{ssp.name}</span>
                                        {ssp.description && <span className="block text-gray-500 text-xs mt-1">{ssp.description}</span>}
                                    </div>
                                     <button onClick={() => handleDelete('subproject2', ssp.id, ssp.name)} disabled={isLoading} className="bg-red-500 text-white px-3 py-1 text-xs font-bold rounded hover:bg-red-600 disabled:bg-gray-400">حذف</button>
                                </li>
                            ))}
                        </ul>
                    ) : (<p className="text-sm text-gray-500 italic">هیچ رکوردی برای این بخش ثبت نشده است.</p>)}
                </div>
            </div>

        </div>
    );
};

export default ManageProjects;
