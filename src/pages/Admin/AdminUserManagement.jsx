import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api'; // Your pre-configured axios instance

// --- Edit User Modal Component ---
const EditUserModal = ({ user, allUsers, allDepartments, onSave, onClose }) => {
  const [formData, setFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Hardcoded roles as they are likely static
  const allRoles = [
      { id: 'regular_user', name: 'کاربر عادی' },
      { id: 'department_supervisor', name: 'سرپرست دپارتمان' },
      { id: 'admin', name: 'ادمین' },
  ];

  useEffect(() => {
    // When the user prop is available, initialize the form data
    if (user) {
      setFormData({
        id: user.id,
        name: user.name || '',
        surname: user.surname || '',
        phone_number: user.phone_number || '',
        password: '', // Password should be empty by default for security
        role: user.role || 'regular_user',
        departments_ids: user.departments?.map(d => d.id) || [],
        supervisors_ids: user.supervisors?.map(s => s.id) || [],
        subordinates_ids: user.subordinates?.map(s => s.id) || [],
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const value = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(Number(options[i].value));
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Create a payload, omitting the password if it's empty
    const payload = { ...formData };
    if (!payload.password) {
      delete payload.password;
    }
    delete payload.id; // ID is in URL, not body

    await onSave(user.id, payload);
    setIsSaving(false);
  };
  
  // Render nothing if user data or form data isn't ready
  if (!user || !formData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-3">ویرایش کاربر: {user.name} {user.surname}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام خانوادگی</label>
              <input type="text" name="surname" value={formData.surname} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره تلفن</label>
              <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="برای عدم تغییر، خالی بگذارید" className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نقش</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                    {allRoles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
            </div>
             {/* Multi-Select for Departments */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">دپارتمان‌ها</label>
              <select multiple name="departments_ids" value={formData.departments_ids} onChange={handleMultiSelectChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm h-32">
                {allDepartments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            {/* Multi-Select for Supervisors */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">سرپرست‌ها</label>
              <select multiple name="supervisors_ids" value={formData.supervisors_ids} onChange={handleMultiSelectChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm h-32">
                {allUsers.filter(u => u.id !== user.id).map(sup => (
                  <option key={sup.id} value={sup.id}>{`${sup.name} ${sup.surname}`}</option>
                ))}
              </select>
            </div>
            {/* Multi-Select for Subordinates */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">زیردست‌ها</label>
              <select multiple name="subordinates_ids" value={formData.subordinates_ids} onChange={handleMultiSelectChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm h-32">
                 {allUsers.filter(u => u.id !== user.id).map(sub => (
                  <option key={sub.id} value={sub.id}>{`${sub.name} ${sub.surname}`}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              انصراف
            </button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
              {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Main User Management Component ---
const AdminUserManagement = () => {
  // --- State Variables ---
  const [users, setUsers] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // --- Data Fetching ---
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch both users and departments concurrently
      const [usersResponse, deptsResponse] = await Promise.all([
        api.get('/api/v1/user/get-all-users'),
        api.get('/api/v1/department/get-all-departments') // Assuming this endpoint exists
      ]);
      setUsers(usersResponse.data || []);
      setAllDepartments(deptsResponse.data || []);
    } catch (err) {
      setError('خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.');
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Event Handlers ---
  const handleDeleteUser = async (phoneNumber, userName) => {
    if (window.confirm(`آیا از حذف کاربر «${userName}» اطمینان دارید؟`)) {
      try {
        await api.delete('/api/v1/user/delete-user', {
          params: { phone_number: phoneNumber }
        });
        setUsers(users.filter(user => user.phone_number !== phoneNumber));
      } catch (err) {
        setError('خطا در حذف کاربر.');
        console.error('Failed to delete user:', err);
      }
    }
  };
  
  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsEditModalOpen(false);
  };
  
  const handleSaveUser = async (userId, updatedUserData) => {
    try {
        await api.put(`/api/v1/user/update-user/${userId}`, updatedUserData);
        await fetchData(); // Re-fetch all data to ensure consistency
        handleCloseModal();
    } catch (err) {
        setError('خطا در به‌روزرسانی کاربر.');
        console.error('Failed to update user:', err);
    }
  };

  // --- Search and Filtering ---
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowercasedFilter = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name?.toLowerCase().includes(lowercasedFilter) ||
      user.surname?.toLowerCase().includes(lowercasedFilter) ||
      user.phone_number?.includes(lowercasedFilter)
    );
  }, [users, searchTerm]);

  // --- Render Logic ---
  const renderUserRows = () => {
    if (filteredUsers.length === 0) {
      return (
        <tr>
          <td colSpan="7" className="p-6 text-center text-gray-500">کاربری یافت نشد.</td>
        </tr>
      );
    }

    return filteredUsers.map(user => (
      <tr key={user.id} className="bg-white border-b hover:bg-gray-50 text-right">
        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{`${user.name || ''} ${user.surname || ''}`}</td>
        <td className="px-6 py-4">{user.phone_number || '---'}</td>
        <td className="px-6 py-4">{user.role || '---'}</td>
        <td className="px-6 py-4">{user.departments?.length > 0 ? user.departments.map(d => d.name).join(', ') : '---'}</td>
        <td className="px-6 py-4 text-xs">{user.supervisors?.length > 0 ? user.supervisors.map(s => `${s.name} ${s.surname}`).join(', ') : '---'}</td>
        <td className="px-6 py-4 text-xs">{user.subordinates?.length > 0 ? user.subordinates.map(s => `${s.name} ${s.surname}`).join(', ') : '---'}</td>
        <td className="px-6 py-4 text-center space-x-2 whitespace-nowrap">
            <button onClick={() => handleOpenEditModal(user)} className="font-medium text-indigo-600 hover:text-indigo-800">ویرایش</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => handleDeleteUser(user.phone_number, `${user.name} ${user.surname}`)} className="font-medium text-red-600 hover:text-red-800">حذف</button>
        </td>
      </tr>
    ));
  };
  
  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-full" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">مدیریت کاربران</h1>
        </div>
        <div className="mb-4">
          <input type="text" placeholder="جستجو بر اساس نام، فامیلی یا شماره تلفن..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {isLoading ? <p className="p-6 text-center text-gray-500">در حال بارگذاری کاربران...</p> : error ? <p className="p-6 text-center text-red-500">{error}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 text-right">
                  <tr>
                    <th scope="col" className="px-6 py-3">نام کامل</th>
                    <th scope="col" className="px-6 py-3">شماره تلفن</th>
                    <th scope="col" className="px-6 py-3">نقش</th>
                    <th scope="col" className="px-6 py-3">دپارتمان‌ها</th>
                    <th scope="col" className="px-6 py-3">سرپرست‌ها</th>
                    <th scope="col" className="px-6 py-3">زیردست‌ها</th>
                    <th scope="col" className="px-6 py-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody>{renderUserRows()}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Render Modal */}
      {isEditModalOpen && (
        <EditUserModal 
          user={editingUser}
          allUsers={users}
          allDepartments={allDepartments}
          onSave={handleSaveUser}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AdminUserManagement;
