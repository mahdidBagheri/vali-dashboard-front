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
    departments: [], 
    supervisor_phone_number: ''
  });
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // دریافت لیست دپارتمان‌ها در زمان لود کامپوننت با API جدید
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // آدرس جدید API جایگزین شد
        const response = await api.get('/api/v1/department/get-all-departments');
        setDepartmentsList(response.data || []);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDepartmentChange = (e) => {
    const options = e.target.options;
    const selectedDepartments = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedDepartments.push(options[i].value);
      }
    }
    setFormData((prev) => ({
      ...prev,
      departments: selectedDepartments
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      ...formData,
      supervisor_phone_number: formData.supervisor_phone_number
        ? formData.supervisor_phone_number.split(',').map(item => item.trim())
        : []
    };

    try {
      const response = await api.post('/api/v1/user/create-user', payload);
      
      setMessage({ type: 'success', text: 'کاربر با موفقیت ایجاد شد!' });
      
      setFormData({
        name: '',
        surname: '',
        phone_number: '',
        password: '',
        role: 'regular_user',
        departments: [],
        supervisor_phone_number: ''
      });
      
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error.response?.data?.detail || "خطا در ایجاد کاربر. لطفاً اطلاعات وارد شده را بررسی کنید.";
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
            name="departments" 
            value={formData.departments} 
            onChange={handleDepartmentChange} 
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            size="4" 
          >
            {departmentsList.map(dept => (
              <option key={dept.name} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            شماره تماس سرپرست‌ها <span className="text-gray-400 font-normal text-xs">(با کاما جدا کنید)</span>
          </label>
          <input 
            type="text" 
            name="supervisor_phone_number" 
            value={formData.supervisor_phone_number} 
            onChange={handleChange} 
            dir="ltr"
            placeholder="09123456789, 09987654321" 
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-left"
          />
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
