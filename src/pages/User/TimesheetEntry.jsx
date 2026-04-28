import React, { useState } from 'react';
import api from '../../services/api';
import TimesheetTable from './TimesheetTable'; // Importing the table component

const TimesheetEntry = () => {
  // Exact state from your original file
  const [formData, setFormData] = useState({
    date_: '',
    start_time: '',
    end_time: '',
    type: 'normal',
    deduction_hours: 'PT0S', // ISO 8601 duration
    description: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/user/create-timesheet-entry', formData);
      alert('Timesheet entry submitted successfully!');
      // Optional: clear form after submit
      setFormData({ ...formData, start_time: '', end_time: '', description: '' });
    } catch (error) {
      console.error('Error submitting timesheet', error);
      alert('Failed to submit timesheet.');
    }
  };

  return (
    <div dir="rtl" className="max-w-7xl mx-auto p-4 sm:p-6 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">ثبت و مدیریت کارکرد (Timesheet)</h1>

      {/* Grid Layout: Form on the right (1 column), Table on the left (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- SUBMIT HOURS FORM --- */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 sticky top-6">
            <h2 className="text-xl font-bold mb-6 text-indigo-700 border-b pb-2">ثبت ساعت کاری جدید</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ (Date)</label>
                <input 
                  type="date" 
                  name="date_" 
                  value={formData.date_} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                />
              </div>
              
              <div className="flex space-x-4 space-x-reverse">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">شروع (Start)</label>
                  <input 
                    type="time" 
                    name="start_time" 
                    value={formData.start_time} 
                    onChange={handleChange} 
                    required 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">پایان (End)</label>
                  <input 
                    type="time" 
                    name="end_time" 
                    value={formData.end_time} 
                    onChange={handleChange} 
                    required 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع (Type)</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="normal">عادی (Normal)</option>
                  <option value="mission">ماموریت (Mission)</option>
                  <option value="vacation">مرخصی (Vacation)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">کسورات زمانی (Deduction)</label>
                <input 
                  type="text" 
                  name="deduction_hours" 
                  value={formData.deduction_hours} 
                  onChange={handleChange} 
                  placeholder="e.g. PT0S"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  dir="ltr"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white font-medium p-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm mt-2"
              >
                ثبت ساعت (Submit)
              </button>
            </form>
          </div>
        </div>

        {/* --- MONTHLY TIMESHEET TABLE --- */}
        <div className="lg:col-span-2">
          {/* We import and render the table component here */}
          <TimesheetTable />
        </div>

      </div>
    </div>
  );
};

export default TimesheetEntry;
