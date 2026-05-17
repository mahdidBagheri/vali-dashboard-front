import React, { useState } from 'react';
import api from '../../services/api';
import TimesheetTable from './TimesheetTable'; 

const TimesheetEntry = () => {
  const [formData, setFormData] = useState({
    date_: '',
    start_time: '',
    project_name: '',
    description: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // استفاده از فرمت دقیق جدید (اضافه شدن ثانیه به زمان و تکمیل فیلدهای اجباری)
      const formattedTime = formData.start_time.length === 5 ? formData.start_time + ":00" : formData.start_time;

      const payload = {
          date_: formData.date_,
          start_time: formattedTime,
          end_time: formattedTime, // با توجه به فقدان فیلد پایان، مقدار را برابر شروع قرار میدهیم
          deduction_hours: "PT0S",
          type: "normal",
          description: formData.description,
          project_name: formData.project_name
      };

      await api.post('/api/v1/timesheet/create-timesheet-entry', payload);
      alert('Timesheet entry submitted successfully!');
      setFormData({ ...formData, start_time: '', project_name: '', description: '' });
    } catch (error) {
      console.error('Error submitting timesheet', error);
      alert('Failed to submit timesheet.');
    }
  };

  return (
    <div dir="rtl" className="max-w-7xl mx-auto p-3 sm:p-6 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
        ثبت و مدیریت کارکرد (Timesheet)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        <div className="lg:col-span-1">
          <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-100 lg:sticky lg:top-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-indigo-700 border-b pb-2">
              ثبت ساعت کاری جدید
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ (Date)</label>
                <input 
                  type="date" 
                  name="date_" 
                  value={formData.date_} 
                  onChange={handleChange} 
                  required 
                  className="w-full text-base sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شروع (Start Time)</label>
                <input 
                  type="time" 
                  name="start_time" 
                  value={formData.start_time} 
                  onChange={handleChange} 
                  required 
                  className="w-full text-base sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام پروژه (Project Name)</label>
                <input 
                  type="text" 
                  name="project_name" 
                  value={formData.project_name} 
                  onChange={handleChange} 
                  placeholder="e.g. MyProject"
                  className="w-full text-base sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات (Description)</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows="3"
                  placeholder="توضیحات و جزئیات فعالیت..."
                  className="w-full text-base sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white font-medium p-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm mt-2 sm:mt-4"
              >
                ثبت ساعت (Submit)
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl">
           <TimesheetTable />
        </div>

      </div>
    </div>
  );
};

export default TimesheetEntry;
