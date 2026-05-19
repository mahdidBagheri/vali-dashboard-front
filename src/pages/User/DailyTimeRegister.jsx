import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api'; 
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
  const [isSaving, setIsSaving] = useState(false);

  const lastSavedEntriesRef = useRef([]);

  useEffect(() => {
    setEntries(todayEntries);
    setIsWorking(todayIsWorking);
    lastSavedEntriesRef.current = JSON.parse(JSON.stringify(todayEntries));
  }, []);

  useEffect(() => {
    calculateTotalTime(entries);
    if (selectedDate.format() === today.format()) {
        setTodayEntries(entries);
        setTodayIsWorking(isWorking);
    }
  }, [entries, isWorking, selectedDate, today]);

  const getCurrentISOTime = () => {
    const now = new Date();
    return now.toISOString().split('T')[1]; 
  };

  const calculateTotalTime = (data) => {
    let totalMinutes = 0;
    data.forEach(entry => {
      if (!entry.isRest && entry.startTime && entry.endTime) {
        try {
            const [startH, startM] = toEnglishDigits(entry.startTime).split(':').map(Number);
            const [endH, endM] = toEnglishDigits(entry.endTime).split(':').map(Number);
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
    const dummyData = [];
    setEntries(dummyData);
    setIsWorking(false); 
    lastSavedEntriesRef.current = JSON.parse(JSON.stringify(dummyData));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date.format() === today.format()) {
      setEntries(todayEntries);
      setIsWorking(todayIsWorking);
      lastSavedEntriesRef.current = JSON.parse(JSON.stringify(todayEntries));
    } else {
      fetchDummyDataForDate(date);
    }
  };

  const handleGoToToday = () => {
      handleDateChange(today);
  };

  const toEnglishDigits = (str) => {
    return str ? str.toString().replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) : "";
  };

  const getApiDate = () => {
    if (selectedDate && typeof selectedDate.toDate === 'function') {
      const jsDate = selectedDate.toDate(); 
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, '0');
      const day = String(jsDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return toEnglishDigits(selectedDate);
  };

  const createEntryApi = async (dateStr, startTimeZ) => {
    const payload = {
      date_: dateStr,
      start_time: startTimeZ
    };
    const response = await api.post('/api/v1/timesheet/create-timesheet-entry', payload);
    return response.data; 
  };

  const updateEntryApi = async (entry) => {
    const payload = {
      date_: getApiDate(),
      start_time: entry.startTime ? `${entry.startTime}:00.000Z` : "00:00:00.000Z",
      end_time: entry.endTime ? `${entry.endTime}:00.000Z` : "00:00:00.000Z",
      deduction_hours: "PT0S",
      type: entry.isRest ? "rest" : "normal",
      // حتماً عدد ارسال شود، اما مقدار پیش‌فرض 0 خواهد بود. 
      // وظیفه ما در کلاینت این است که نگذاریم تابع به اینجا برسد اگر دپارتمان خالی است.
      department_id: Number(entry.department_id) || 0,
      project_id: Number(entry.project_id) || 0,
      sub_project1_id: Number(entry.sub_project1_id) || 0,
      sub_project2_id: Number(entry.sub_project2_id) || 0,
      description: entry.description || ""
    };
    return api.put(`/api/v1/timesheet/update-timesheet-entry/${entry.id}`, payload);
  };

  const deleteEntryApi = async (id) => {
    return api.delete(`/api/v1/timesheet/delete-timesheet-entry/${id}`);
  };

  const handleStart = async () => {
    setIsSaving(true);
    try {
      const apiDate = getApiDate();
      const timeZ = getCurrentISOTime();
      
      const serverData = await createEntryApi(apiDate, timeZ);
      const startTimeLocal = serverData.start_time.substring(0, 5);
      
      const newEntry = {
        id: serverData.id,
        startTime: startTimeLocal,
        endTime: '',
        department_id: '',
        project_id: '',
        sub_project1_id: '',
        sub_project2_id: '',
        description: '',
        isRest: false,
        isSaved: true 
      };
      
      setEntries([...entries, newEntry]);
      setIsWorking(true);
      lastSavedEntriesRef.current.push({ ...newEntry });
    } catch (e) {
      alert("خطا در ارتباط با سرور. رکورد ایجاد نشد.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = async (actionType) => {
    let updatedEntries = [...entries];
    const lastIndex = updatedEntries.length - 1;
    const lastEntry = updatedEntries[lastIndex];

    // --- اعتبارسنجی (Validation) اجباری بودن دپارتمان قبل از تغییر وضعیت ---
    if (lastIndex >= 0 && !lastEntry.endTime && !lastEntry.isRest) {
      const depId = Number(lastEntry.department_id);
      if (!depId || depId <= 0) {
        alert("لطفاً پیش از ثبت عملیات جدید، حتماً «شناسه دپارتمان» رکورد فعلی را وارد کنید.");
        return; // توقف عملیات
      }
    }

    setIsSaving(true);
    let updatedSavedEntries = [...lastSavedEntriesRef.current];

    try {
      if (lastIndex >= 0 && !lastEntry.endTime) {
        const timeNowStr = new Date().toTimeString().slice(0, 5);
        const closedEntry = { ...lastEntry, endTime: timeNowStr };

        await updateEntryApi(closedEntry);
        
        updatedEntries[lastIndex] = closedEntry;
        closedEntry.isSaved = true;

        const savedIndex = updatedSavedEntries.findIndex(e => e.id === closedEntry.id);
        if (savedIndex >= 0) updatedSavedEntries[savedIndex] = { ...closedEntry };
      }

      if (actionType === 'end') {
        setIsWorking(false);
        setEntries(updatedEntries);
        lastSavedEntriesRef.current = updatedSavedEntries;
      } else if (actionType === 'rest' || actionType === 'change') {
        
        const apiDate = getApiDate();
        const timeZ = getCurrentISOTime();
        const serverData = await createEntryApi(apiDate, timeZ);

        const newEntry = {
          id: serverData.id,
          startTime: serverData.start_time.substring(0, 5),
          endTime: '',
          department_id: actionType === 'change' ? lastEntry.department_id : '',
          project_id: actionType === 'change' ? lastEntry.project_id : '',
          sub_project1_id: actionType === 'change' ? lastEntry.sub_project1_id : '',
          sub_project2_id: actionType === 'change' ? lastEntry.sub_project2_id : '',
          description: actionType === 'change' ? lastEntry.description : '',
          isRest: actionType === 'rest',
          isSaved: actionType === 'change' ? false : true 
        };

        updatedEntries.push(newEntry);
        updatedSavedEntries.push({ ...newEntry });
        setEntries(updatedEntries);
        lastSavedEntriesRef.current = updatedSavedEntries;
      }
    } catch (error) {
      console.error("خطا در ثبت عملیات:", error);
      alert("خطا در ارتباط با سرور هنگام ثبت اکشن");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldEdit = (index, field, value) => {
    const updatedEntries = [...entries];
    updatedEntries[index][field] = value;
    
    updatedEntries[index].isSaved = false;

    if (field === 'endTime' && index < updatedEntries.length - 1) {
      updatedEntries[index + 1].startTime = value;
      updatedEntries[index + 1].isSaved = false;
    }
    if (field === 'startTime' && index > 0) {
      updatedEntries[index - 1].endTime = value;
      updatedEntries[index - 1].isSaved = false;
    }
    
    setEntries(updatedEntries);
  };

  const handleAddRow = () => {
      const newRow = {
          id: `temp-${Date.now()}`,
          startTime: '00:00',
          endTime: '00:00',
          department_id: '',
          project_id: '',
          sub_project1_id: '',
          sub_project2_id: '',
          description: '',
          isRest: false,
          isSaved: false
      };
      setEntries([...entries, newRow]);
  };

  const handleDeleteRow = async (idToDelete) => {
    const entryToDelete = entries.find(e => e.id === idToDelete);
    if (!entryToDelete) return;

    if (window.confirm("آیا از حذف این رکورد اطمینان دارید؟")) {
      setIsSaving(true);
      try {
        if (typeof idToDelete === 'number' || !String(idToDelete).startsWith('temp-')) {
            await deleteEntryApi(idToDelete);
        }
        
        const updatedEntries = entries.filter(e => e.id !== idToDelete);
        setEntries(updatedEntries);
        lastSavedEntriesRef.current = lastSavedEntriesRef.current.filter(e => e.id !== idToDelete);
      } catch (error) {
        console.error("خطا در حذف رکورد:", error);
        alert("حذف رکورد از سرور با شکست مواجه شد.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const syncEntriesToServer = async () => {
    let anyChangesSaved = false;
    let hasValidationError = false;
    const updatedEntries = [...entries];

    for (let i = 0; i < updatedEntries.length; i++) {
      const entry = updatedEntries[i];
      if (!entry.startTime) continue;

      if (!entry.isSaved) {
        
        // --- اعتبارسنجی دپارتمان قبل از همگام‌سازی ---
        if (!entry.isRest) {
            const depId = Number(entry.department_id);
            if (!depId || depId <= 0) {
                alert(`خطا: شناسه دپارتمان برای رکورد ساعت ${entry.startTime} وارد نشده است.`);
                hasValidationError = true;
                continue; // از ذخیره این رکورد صرف‌نظر می‌کند
            }
        }

        try {
          if (String(entry.id).startsWith('temp-')) {
            const timeZ = entry.startTime ? `${entry.startTime}:00.000Z` : "00:00:00.000Z";
            const serverData = await createEntryApi(getApiDate(), timeZ);
            entry.id = serverData.id;
          }
          
          await updateEntryApi(entry);
          
          updatedEntries[i].isSaved = true;
          anyChangesSaved = true;
        } catch (error) {
          console.error(`خطا در ذخیره رکورد ${entry.id}:`, error);
        }
      }
    }

    if (anyChangesSaved || hasValidationError) {
      lastSavedEntriesRef.current = JSON.parse(JSON.stringify(updatedEntries));
      setEntries(updatedEntries); 
    }

    return !hasValidationError; // اگر ارور داشتیم فالس برگردان
  };

  const handleSubmitToServer = async () => {
    setIsSaving(true);
    const success = await syncEntriesToServer();
    setIsSaving(false);
    if (success) {
      alert('تغییرات با موفقیت در سرور ذخیره شد.');
    } else {
      alert('بخشی از اطلاعات به دلیل نقص فیلدهای اجباری (مثل دپارتمان) ذخیره نشد.');
    }
  };

  const currentEntry = entries[entries.length - 1];
  const isResting = currentEntry?.isRest && !currentEntry?.endTime;
  const isToday = selectedDate.format() === today.format();
  
  const allowRowEdits = !isToday || (!isWorking && entries.length > 0);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 min-h-[500px]" dir="rtl">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-indigo-700">ثبت کارکرد روزانه</h2>
        </div>
        <button 
          onClick={handleSubmitToServer}
          disabled={isSaving}
          className={`${isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded-lg transition shadow-md`}
        >
          {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
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
              <button onClick={handleStart} disabled={isSaving} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-md">
                شروع کار
              </button>
            )}
            {isWorking && !isResting && (
              <>
                <button onClick={() => handleAction('end')} disabled={isSaving} className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 shadow-md">
                  پایان کار
                </button>
                <button onClick={() => handleAction('rest')} disabled={isSaving} className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50 shadow-md">
                  استراحت
                </button>
                <button onClick={() => handleAction('change')} disabled={isSaving} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 shadow-md">
                  تغییر موضوع
                </button>
              </>
            )}
            {isResting && (
              <button onClick={() => handleAction('change')} disabled={isSaving} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 shadow-md">
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
              <th className="px-4 py-3">دپارتمان (ID) *</th>
              <th className="px-4 py-3">پروژه (ID)</th>
              <th className="px-4 py-3">زیرپروژه۱ (ID)</th>
              <th className="px-4 py-3">زیرپروژه۲ (ID)</th>
              <th className="px-4 py-3">توضیحات</th>
              {allowRowEdits && <th className="px-4 py-3">عملیات</th>}
              <th className="px-2 py-3">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={allowRowEdits ? 9 : 8} className="py-8 text-gray-400">اطلاعاتی برای این تاریخ ثبت نشده است.</td>
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
                        <input type="number" required value={entry.department_id || ''} onChange={(e) => handleFieldEdit(index, 'department_id', e.target.value)} className={`bg-transparent outline-none text-center border-b border-dashed ${!entry.department_id && !entry.isSaved ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:border-indigo-500 w-full`} placeholder="ID..."/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={entry.project_id || ''} onChange={(e) => handleFieldEdit(index, 'project_id', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full" placeholder="ID..."/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={entry.sub_project1_id || ''} onChange={(e) => handleFieldEdit(index, 'sub_project1_id', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full" placeholder="ID..."/>
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" value={entry.sub_project2_id || ''} onChange={(e) => handleFieldEdit(index, 'sub_project2_id', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full" placeholder="ID..."/>
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
                  
                  <td className="px-2 py-3 text-center">
                    {!entry.isRest && entry.startTime && (
                      entry.isSaved ? 
                        <span className="text-green-500 font-bold text-lg" title="ذخیره شده در سرور">✔</span> : 
                        <span className="text-gray-400 text-xs" title="نیاز به ذخیره">⏳</span>
                    )}
                  </td>
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
                <td colSpan={2} className="px-4 py-4 text-center font-bold text-xl text-indigo-700" dir="ltr">
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
