import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api'; // در صورت نیاز تنظیم کنید
import { Calendar } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

const DailyTimeRegister = () => {
  const [entries, setEntries] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  
  const today = useRef(new DateObject({ calendar: persian, locale: persian_fa })).current;

  const [selectedDate, setSelectedDate] = useState(today);
  
  const [todayEntries, setTodayEntries] = useState([]);
  const [todayIsWorking, setTodayIsWorking] = useState(false);

  const [totalWorkTime, setTotalWorkTime] = useState('00:00');

  useEffect(() => {
    setEntries(todayEntries);
    setIsWorking(todayIsWorking);
  }, []);

  useEffect(() => {
    calculateTotalTime(entries);
    if (selectedDate.format() === today.format()) {
        setTodayEntries(entries);
        setTodayIsWorking(isWorking);
    }
  }, [entries, isWorking, selectedDate, today]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const calculateTotalTime = (data) => {
    let totalMinutes = 0;
    data.forEach(entry => {
      if (!entry.isRest && entry.startTime && entry.endTime) {
        try {
            const [startH, startM] = entry.startTime.split(':').map(Number);
            const [endH, endM] = entry.endTime.split(':').map(Number);
            let diff = (endH * 60 + endM) - (startH * 60 + startM);
            if (diff > 0) {
              totalMinutes += diff;
            }
        } catch(e) {
            console.error("Invalid time format", e);
        }
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    setTotalWorkTime(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    );
  };

  const fetchDummyDataForDate = (dateObj) => {
    const dummyData = [
      { id: 1, startTime: '08:00', endTime: '10:30', department: 'فنی', project: 'توسعه', subproject: 'فرانت‌اند', subsubproject: 'پنل ادمین', description: 'طراحی جدول', isRest: false },
      { id: 2, startTime: '10:30', endTime: '11:00', isRest: true },
      { id: 3, startTime: '11:00', endTime: '14:00', department: 'فنی', project: 'توسعه', subproject: 'بک‌اند', subsubproject: 'API', description: 'نوشتن سرویس ورود', isRest: false },
    ];
    setEntries(dummyData);
    setIsWorking(false); 
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date.format() === today.format()) {
      setEntries(todayEntries);
      setIsWorking(todayIsWorking);
    } else {
      fetchDummyDataForDate(date);
    }
  };

  const handleGoToToday = () => {
      handleDateChange(today);
  };

  const handleStart = () => {
    const newEntry = {
      id: Date.now(),
      startTime: getCurrentTime(),
      endTime: '',
      department: '',
      project: '',
      subproject: '',
      subsubproject: '',
      description: '',
      isRest: false
    };
    setEntries([...entries, newEntry]);
    setIsWorking(true);
  };

  const handleAction = (actionType) => {
    const currentTime = getCurrentTime();
    const updatedEntries = [...entries];
    const lastIndex = updatedEntries.length - 1;
    const lastEntry = updatedEntries[lastIndex];

    if (lastIndex >= 0 && !lastEntry.endTime) {
      updatedEntries[lastIndex].endTime = currentTime;
    }

    if (actionType === 'end') {
      setIsWorking(false);
      setEntries(updatedEntries);
    } else if (actionType === 'rest' || actionType === 'change') {
      updatedEntries.push({
        id: Date.now(),
        startTime: currentTime,
        endTime: '',
        department: actionType === 'change' ? lastEntry.department : '',
        project: actionType === 'change' ? lastEntry.project : '',
        subproject: actionType === 'change' ? lastEntry.subproject : '',
        subsubproject: actionType === 'change' ? lastEntry.subsubproject : '',
        description: actionType === 'change' ? lastEntry.description : '',
        isRest: actionType === 'rest'
      });
      setEntries(updatedEntries);
    }
  };

  const handleFieldEdit = (index, field, value) => {
    const updatedEntries = [...entries];
    updatedEntries[index][field] = value;

    if (field === 'endTime' && index < updatedEntries.length - 1) {
      updatedEntries[index + 1].startTime = value;
    }
    if (field === 'startTime' && index > 0) {
      updatedEntries[index - 1].endTime = value;
    }
    
    setEntries(updatedEntries);
  };

  const handleAddRow = () => {
      const newRow = {
          id: Date.now(),
          startTime: '00:00',
          endTime: '00:00',
          department: '',
          project: '',
          subproject: '',
          subsubproject: '',
          description: '',
          isRest: false
      };
      setEntries([...entries, newRow]);
  };

  const handleDeleteRow = (idToDelete) => {
      setEntries(entries.filter(entry => entry.id !== idToDelete));
  };

  const handleSubmitToServer = async () => {
    const apiDate = selectedDate.convert('gregorian').format('YYYY-MM-DD');
    const workEntries = entries.filter(e => e.endTime && e.startTime && !e.isRest);

    try {
      for (const entry of workEntries) {
        const payload = {
          date_: apiDate,
          start_time: entry.startTime,
          end_time: entry.endTime,
          type: 'normal',
          deduction_hours: 'PT0S',
          description: `دپارتمان: ${entry.department} | پروژه: ${entry.project} | زیرپروژه: ${entry.subproject} | زیرزیرپروژه: ${entry.subsubproject} | توضیحات: ${entry.description}`
        };
        console.log("Sending to server: ", payload);
      }
      alert('اطلاعات با موفقیت ثبت شد');
    } catch (error) {
      console.error('Error saving entries:', error);
      alert('خطا در ثبت اطلاعات');
    }
  };

  const currentEntry = entries[entries.length - 1];
  const isResting = currentEntry?.isRest && !currentEntry?.endTime;
  const isToday = selectedDate.format() === today.format();
  
  // شرط نمایش دکمه حذف و افزودن ردیف جدید:
  // یا امروز نیست، یا اگر امروز است کاربر روی دکمه "پایان" کلیک کرده باشد (!isWorking)
  const allowRowEdits = !isToday || (!isWorking && entries.length > 0);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 min-h-[500px]" dir="rtl">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-indigo-700">ثبت کارکرد روزانه</h2>
        <button 
          onClick={handleSubmitToServer}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          ذخیره تغییرات
        </button>
      </div>

      <div className="mb-4 text-center flex items-center justify-center gap-4">
        <h3 className="text-lg font-medium text-gray-800">
          جدول کارکرد تاریخ: <span className="text-indigo-600 font-bold">{selectedDate.format("dddd DD MMMM YYYY")}</span>
        </h3>
        {!isToday && (
            <button onClick={handleGoToToday} className="text-sm bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg hover:bg-blue-200">
                &larr; بیا به امروز
            </button>
        )}
      </div>

      {isToday && (
          <div className="mb-6 flex gap-4 justify-center">
            {!isWorking && !isResting && entries.length === 0 && (
              <button onClick={handleStart} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
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
                <button onClick={() => handleAction('change')} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
                  تغییر موضوع
                </button>
              </>
            )}
            {isResting && (
              <button onClick={() => handleAction('change')} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                پایان استراحت
              </button>
            )}
          </div>
      )}

      <div className="overflow-x-auto mb-8 border rounded-lg">
        <table className="w-full text-sm text-center text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
            <tr>
              <th className="px-4 py-3">شروع</th>
              <th className="px-4 py-3">پایان</th>
              <th className="px-4 py-3">دپارتمان</th>
              <th className="px-4 py-3">پروژه</th>
              <th className="px-4 py-3">زیرپروژه</th>
              <th className="px-4 py-3">زیرزیرپروژه</th>
              <th className="px-4 py-3">توضیحات</th>
              {allowRowEdits && <th className="px-4 py-3">عملیات</th>}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={allowRowEdits ? 8 : 7} className="py-8 text-gray-400">اطلاعاتی برای این تاریخ ثبت نشده است.</td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={entry.id} className={`border-b hover:bg-gray-50 ${entry.isRest ? 'bg-orange-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="time" value={entry.startTime} onChange={(e) => handleFieldEdit(index, 'startTime', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500"/>
                  </td>
                  <td className="px-4 py-3">
                    <input type="time" value={entry.endTime} onChange={(e) => handleFieldEdit(index, 'endTime', e.target.value)} disabled={isToday && !entry.endTime && isWorking} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 disabled:opacity-50" placeholder="..."/>
                  </td>
                  
                  {entry.isRest ? (
                    <td colSpan="5" className="px-4 py-3 text-orange-600 font-bold tracking-widest text-center">
                      --- زمان استراحت ---
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <input type="text" value={entry.department || ''} onChange={(e) => handleFieldEdit(index, 'department', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full" placeholder="..."/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={entry.project || ''} onChange={(e) => handleFieldEdit(index, 'project', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full" placeholder="..."/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={entry.subproject || ''} onChange={(e) => handleFieldEdit(index, 'subproject', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full" placeholder="..."/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={entry.subsubproject || ''} onChange={(e) => handleFieldEdit(index, 'subsubproject', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full" placeholder="..."/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="text" value={entry.description || ''} onChange={(e) => handleFieldEdit(index, 'description', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full min-w-[120px]" placeholder="..."/>
                      </td>
                    </>
                  )}

                  {allowRowEdits && (
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteRow(entry.id)} className="text-red-500 hover:text-red-700 font-bold">حذف</button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
          {entries.length > 0 && (
            <tfoot className="bg-indigo-50 border-t-2 border-indigo-100">
              <tr>
                <td colSpan={allowRowEdits ? 7 : 6} className="px-4 py-4 text-right font-bold text-indigo-800">
                  مجموع ساعات کاری مفید (بدون استراحت):
                </td>
                <td className="px-4 py-4 text-center font-bold text-xl text-indigo-700" dir="ltr">
                  {totalWorkTime}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {allowRowEdits && (
          <div className="flex justify-center mb-6">
              <button onClick={handleAddRow} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium transition">
                  + افزودن ردیف جدید
              </button>
          </div>
      )}

      <div className="flex flex-col items-center justify-center mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-gray-600 font-medium mb-4">برای مشاهده روزهای دیگر روی تقویم کلیک کنید</h3>
        <Calendar calendar={persian} locale={persian_fa} value={selectedDate} onChange={handleDateChange} className="shadow-lg rounded-xl"/>
      </div>
    </div>
  );
};

export default DailyTimeRegister;
