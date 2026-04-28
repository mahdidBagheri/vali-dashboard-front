import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // در صورت نیاز تنظیم کنید
import { Calendar } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

const DailyTimeRegister = () => {
  const [entries, setEntries] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  
  // تاریخ انتخاب شده در تقویم (پیش‌فرض: امروز)
  const [selectedDate, setSelectedDate] = useState(
    new DateObject({ calendar: persian, locale: persian_fa })
  );
  
  // مجموع ساعات کاری
  const [totalWorkTime, setTotalWorkTime] = useState('00:00');

  // آپدیت کردن مجموع زمان هر بار که رکوردها تغییر می‌کنند
  useEffect(() => {
    calculateTotalTime(entries);
  }, [entries]);

  // دریافت زمان فعلی سیستم
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  // محاسبه مجموع زمان کار (بدون استراحت‌ها)
  const calculateTotalTime = (data) => {
    let totalMinutes = 0;
    
    data.forEach(entry => {
      if (entry.subject !== 'استراحت' && entry.startTime && entry.endTime) {
        const [startH, startM] = entry.startTime.split(':').map(Number);
        const [endH, endM] = entry.endTime.split(':').map(Number);
        
        let diff = (endH * 60 + endM) - (startH * 60 + startM);
        if (diff > 0) {
          totalMinutes += diff;
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setTotalWorkTime(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    );
  };

  // شبیه‌ساز دریافت اطلاعات از سرور بر اساس تاریخ
  const fetchDummyDataForDate = (dateObj) => {
    // در واقعیت اینجا با axios به سرور ریکوئست می‌زنید
    // api.get(`/api/timesheet?date=${dateObj.format("YYYY/MM/DD")}`)
    
    const formattedDate = dateObj.format("YYYY/MM/DD");
    console.log(`Fetching data for: ${formattedDate}`);
    
    // دیتای تستی
    const dummyData = [
      { id: 1, startTime: '08:00', endTime: '10:30', subject: 'توسعه فرانت‌اند' },
      { id: 2, startTime: '10:30', endTime: '11:00', subject: 'استراحت' },
      { id: 3, startTime: '11:00', endTime: '14:00', subject: 'جلسه با تیم' },
    ];

    // اگر تاریخ امروز بود، جدول خالی باشد تا کاربر بتواند ثبت کند (یا دیتای واقعی امروز لود شود)
    const today = new DateObject({ calendar: persian }).format("YYYY/MM/DD");
    
    if (formattedDate === today) {
      setEntries([]);
      setIsWorking(false);
    } else {
      setEntries(dummyData);
      setIsWorking(false);
    }
  };

  // تغییر تاریخ در تقویم
  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchDummyDataForDate(date);
  };

  const handleStart = (subject = 'عادی') => {
    const newEntry = {
      id: Date.now(),
      startTime: getCurrentTime(),
      endTime: '',
      subject: subject,
    };
    setEntries([...entries, newEntry]);
    setIsWorking(true);
  };

  const handleAction = (actionType, newSubject = '') => {
    const currentTime = getCurrentTime();
    const updatedEntries = [...entries];
    const lastIndex = updatedEntries.length - 1;

    if (lastIndex >= 0 && !updatedEntries[lastIndex].endTime) {
      updatedEntries[lastIndex].endTime = currentTime;
    }

    if (actionType === 'end') {
      setIsWorking(false);
      setEntries(updatedEntries);
    } else if (actionType === 'rest') {
      updatedEntries.push({
        id: Date.now(),
        startTime: currentTime,
        endTime: '',
        subject: 'استراحت',
      });
      setEntries(updatedEntries);
    } else if (actionType === 'change') {
      updatedEntries.push({
        id: Date.now(),
        startTime: currentTime,
        endTime: '',
        subject: newSubject,
      });
      setEntries(updatedEntries);
    }
  };

  const handleTimeEdit = (index, field, value) => {
    const updatedEntries = [...entries];
    updatedEntries[index][field] = value;

    // آپدیت کردن خودکار ردیف‌های قبلی و بعدی در صورت تغییر ساعت
    if (field === 'endTime' && index < updatedEntries.length - 1) {
      updatedEntries[index + 1].startTime = value;
    }
    if (field === 'startTime' && index > 0) {
      updatedEntries[index - 1].endTime = value;
    }

    setEntries(updatedEntries);
  };

  const handleSubjectEdit = (index, value) => {
    const updatedEntries = [...entries];
    updatedEntries[index].subject = value;
    setEntries(updatedEntries);
  };

  const handleSubmitToServer = async () => {
    const apiDate = selectedDate.convert('gregorian').format('YYYY-MM-DD');
    const workEntries = entries.filter(e => e.endTime !== '' && e.subject !== 'استراحت');

    try {
      for (const entry of workEntries) {
        const payload = {
          date_: apiDate,
          start_time: entry.startTime,
          end_time: entry.endTime,
          type: 'normal',
          deduction_hours: 'PT0S',
          description: entry.subject
        };
        // await api.post('/api/v1/user/create-timesheet-entry', payload);
        console.log("Sending to server: ", payload);
      }
      alert('اطلاعات با موفقیت ثبت شد');
    } catch (error) {
      console.error('Error saving entries:', error);
      alert('خطا در ثبت اطلاعات');
    }
  };

  const currentEntry = entries[entries.length - 1];
  const isResting = currentEntry?.subject === 'استراحت' && !currentEntry?.endTime;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 min-h-[500px]" dir="rtl">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-indigo-700">ثبت کارکرد روزانه</h2>
        <button 
          onClick={handleSubmitToServer}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          ذخیره تغییرات و ارسال به سرور
        </button>
      </div>

      {/* نمایش تاریخ انتخاب شده */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-medium text-gray-800">
          جدول کارکرد تاریخ: <span className="text-indigo-600 font-bold">{selectedDate.format("dddd DD MMMM YYYY")}</span>
        </h3>
      </div>

      {/* دکمه‌های عملیاتی */}
      <div className="mb-6 flex gap-4 justify-center">
        {!isWorking && !isResting && entries.length === 0 && (
          <button onClick={() => handleStart('عادی')} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            شروع کار
          </button>
        )}

        {isWorking && !isResting && (
          <>
            <button onClick={() => handleAction('end')} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600">
              پایان کار
            </button>
            <button onClick={() => handleAction('rest')} className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600">
              استراحت
            </button>
            <button onClick={() => handleAction('change', 'موضوع جدید')} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
              تغییر موضوع
            </button>
          </>
        )}

        {isResting && (
          <button onClick={() => handleAction('change', 'عادی')} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
            پایان استراحت و ادامه کار
          </button>
        )}
      </div>

      {/* جدول کارکرد */}
      <div className="overflow-x-auto mb-8 border rounded-lg">
        <table className="w-full text-sm text-center text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
            <tr>
              <th className="px-4 py-3">ردیف</th>
              <th className="px-4 py-3">شروع</th>
              <th className="px-4 py-3">پایان</th>
              <th className="px-4 py-3">موضوع فعالیت</th>
              <th className="px-4 py-3">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-gray-400">اطلاعاتی برای این تاریخ ثبت نشده است.</td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={entry.id} className={`border-b hover:bg-gray-50 ${entry.subject === 'استراحت' ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{index + 1}</td>
                  <td className="px-4 py-3">
                    <input 
                      type="time" 
                      value={entry.startTime}
                      onChange={(e) => handleTimeEdit(index, 'startTime', e.target.value)}
                      className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="time" 
                      value={entry.endTime}
                      onChange={(e) => handleTimeEdit(index, 'endTime', e.target.value)}
                      disabled={!entry.endTime && isWorking}
                      className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 disabled:opacity-50"
                      placeholder="در حال انجام..."
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input 
                      type="text"
                      value={entry.subject}
                      onChange={(e) => handleSubjectEdit(index, e.target.value)}
                      className={`bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full ${entry.subject === 'استراحت' ? 'text-orange-600 font-bold' : ''}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {!entry.endTime ? (
                      <span className="text-green-600 font-semibold text-xs bg-green-100 px-2 py-1 rounded-full">در جریان</span>
                    ) : (
                      <span className="text-gray-500 font-semibold text-xs bg-gray-200 px-2 py-1 rounded-full">پایان یافته</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* نمایش مجموع ساعات کاری */}
          {entries.length > 0 && (
            <tfoot className="bg-indigo-50 border-t-2 border-indigo-100">
              <tr>
                <td colSpan="3" className="px-4 py-4 text-right font-bold text-indigo-800">
                  مجموع ساعات کاری مفید (بدون استراحت):
                </td>
                <td colSpan="2" className="px-4 py-4 text-center font-bold text-xl text-indigo-700" dir="ltr">
                  {totalWorkTime}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* تقویم جلالی */}
      <div className="flex flex-col items-center justify-center mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-gray-600 font-medium mb-4">برای مشاهده کارکرد روزهای دیگر روی تقویم کلیک کنید</h3>
        <Calendar
          calendar={persian}
          locale={persian_fa}
          value={selectedDate}
          onChange={handleDateChange}
          className="shadow-lg rounded-xl"
        />
      </div>
    </div>
  );
};

export default DailyTimeRegister;
