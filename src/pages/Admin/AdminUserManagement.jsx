import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api'; // Your pre-configured axios instance

const AdminUserManagement = () => {
  // --- State Variables ---
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Data Fetching ---
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/user/get-all-users');
      setUsers(response.data || []);
    } catch (err) {
      setError('خطا در دریافت لیست کاربران. لطفاً دوباره تلاش کنید.');
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Event Handlers ---
  const handleDeleteUser = async (phoneNumber, userName) => {
    if (window.confirm(`آیا از حذف کاربر «${userName}» اطمینان دارید؟`)) {
      try {
        await api.delete('/api/v1/user/delete-user', {
          params: { phone_number: phoneNumber }
        });
        
        // Refresh the list by removing the deleted user from state
        setUsers(users.filter(user => user.phone_number !== phoneNumber));
      } catch (err) {
        setError('خطا در حذف کاربر.');
        console.error('Failed to delete user:', err);
      }
    }
  };

  // --- Search and Filtering ---
  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
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
          <td colSpan="7" className="p-6 text-center text-gray-500">
            کاربری یافت نشد.
          </td>
        </tr>
      );
    }

    return filteredUsers.map(user => (
      <tr key={user.id} className="bg-white border-b hover:bg-gray-50 text-right">
        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
          {`${user.name || ''} ${user.surname || ''}`}
        </td>
        <td className="px-6 py-4">{user.phone_number || '---'}</td>
        <td className="px-6 py-4">{user.role || '---'}</td>
        
        {/* Updated to map through department objects */}
        <td className="px-6 py-4">
          {user.departments?.length > 0 
            ? user.departments.map(d => d.name).join(', ') 
            : '---'}
        </td>

        {/* Added supervisors display */}
        <td className="px-6 py-4 text-xs">
          {user.supervisors?.length > 0 
            ? user.supervisors.map(s => `${s.name} ${s.surname}`).join(', ') 
            : '---'}
        </td>

        {/* Added subordinates display */}
        <td className="px-6 py-4 text-xs">
          {user.subordinates?.length > 0 
            ? user.subordinates.map(s => `${s.name} ${s.surname}`).join(', ') 
            : '---'}
        </td>

        <td className="px-6 py-4 text-center">
          <button 
            onClick={() => handleDeleteUser(user.phone_number, `${user.name} ${user.surname}`)} 
            className="font-medium text-red-600 hover:text-red-800"
          >
            حذف
          </button>
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

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="جستجو بر اساس نام، فامیلی یا شماره تلفن..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <p className="p-6 text-center text-gray-500">در حال بارگذاری کاربران...</p>
          ) : error ? (
            <p className="p-6 text-center text-red-500">{error}</p>
          ) : (
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
                <tbody>
                  {renderUserRows()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
