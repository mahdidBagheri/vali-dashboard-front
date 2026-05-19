// src/pages/Admin/AddUserForm.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 

const AddUserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone_number: '', 
    password: '',
    role: 'regular_user', 
    departments_ids: [], 
    supervisors_ids: [], 
    subordinates_ids: [] 
  });
  
  const [departmentsList, setDepartmentsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // دریافت همزمان لیست دپارتمان‌ها و لیست کاربران
        const [deptResponse, usersResponse] = await Promise.all([
          api.get('/api/v1/department/get-all-departments'),
          api.get('/api/v1/user/get-all-users')
        ]);
        
        setDepartmentsList(deptResponse.data || []);
        setUsersList(usersResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // هندلر مشترک برای تمام فیلدهای چند انتخابی (دپارتمان، سرپرست، زیردست)
  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const selectedValues = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(parseInt(options[i].value, 10));
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: selectedValues
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // مقادیر در formData در حال حاضر به صورت آرایه‌ای از اعداد (integer) هستند
    const payload = { ...formData };

    try {
      const response = await api.post('/api/v1/user/create-user', payload);
      
      setMessage({ type: 'success', text: 'کاربر با موفقیت ایجاد شد!' });
      
      setFormData({
        name: '',
        surname: '',
        phone_number: '',
        password: '',
        role: 'regular_user',
        departments_ids: [],
        supervisors_ids: [],
        subordinates_ids: []
      });
      
    } catch (error) {
      console.error("Error creating user:", error);
      
      let errorMessage = "خطا در ایجاد کاربر. لطفاً اطلاعات وارد شده را بررسی کنید.";
      const detail = error.response?.data?.detail;

      if (detail) {
        if (Array.isArray(detail)) {
          errorMessage = detail.map(err => {
            const field = err.loc && err.loc.length > 1 ? err.loc[err.loc.length - 1] : '';
            return `${field ? `(${field}): ` : ''}${err.msg}`;
          }).join(' | ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-sm border border-gray-100 font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">ایجاد کاربر جدید</h2>
        <p className="text-gray-500 text-sm mt-2">اطلاعات زیر را برای افزودن کاربر جدید به سیستم تکمیل کنید.</p>
      </div>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">نام</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="مثال: علی"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">نام خانوادگی</label>
            <input 
              type="text" 
              name="surname" 
              value={formData.surname} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="مثال: محمدی"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">شماره تماس</label>
            <input 
              type="text" 
              name="phone_number" 
              value={formData.phone_number} 
              onChange={handleChange} 
              required 
              dir="ltr"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left"
              placeholder="09123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رمز عبور</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
              dir="ltr"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">نقش کاربر</label>
          <select 
            name="role" 
            value={formData.role} 
            onChange={handleChange} 
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
          >
            <option value="regular_user">کاربر عادی</option>
            <option value="admin">مدیر (Admin)</option>
            <option value="supervisor">سرپرست (Supervisor)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            دپارتمان‌ها <span className="text-gray-400 font-normal text-xs">(برای انتخاب چند مورد کلید Ctrl یا Cmd را نگه دارید)</span>
          </label>
          <select 
            multiple
            name="departments_ids" 
            value={formData.departments_ids} 
            onChange={handleMultiSelectChange} 
            required // اجباری برای ارسال موفقیت‌آمیز
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            size="3" 
          >
            {departmentsList.map(dept => (
              <option key={`dept-${dept.id}`} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              سرپرست‌ها <span className="text-gray-400 font-normal text-xs">(چند انتخابی)</span>
            </label>
            <select 
              multiple
              name="supervisors_ids" 
              value={formData.supervisors_ids} 
              onChange={handleMultiSelectChange} 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              size="4"
            >
              {usersList.map(user => (
                <option key={`sup-${user.id}`} value={user.id}>
                  {user.name} {user.surname}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              زیردست‌ها <span className="text-gray-400 font-normal text-xs">(چند انتخابی)</span>
            </label>
            <select 
              multiple
              name="subordinates_ids" 
              value={formData.subordinates_ids} 
              onChange={handleMultiSelectChange} 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              size="4"
            >
              {usersList.map(user => (
                <option key={`sub-${user.id}`} value={user.id}>
                  {user.name} {user.surname}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
              loading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                در حال ایجاد...
              </span>
            ) : 'ایجاد کاربر'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddUserForm;
