import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api'; 
import { Calendar } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DateObject from "react-date-object";

const DailyTimeRegister = () => {
  const [entries, setEntries] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  const [departmentsData, setDepartmentsData] = useState([]); 
  const [projectsData, setProjectsData] = useState([]); 
  
  const today = useRef(new DateObject({ calendar: persian, locale: persian_fa })).current;
  const [selectedDate, setSelectedDate] = useState(today);
  
  const [todayEntries, setTodayEntries] = useState([]);
  const [todayIsWorking, setTodayIsWorking] = useState(false);
  const [totalWorkTime, setTotalWorkTime] = useState('00:00');
  const [isSaving, setIsSaving] = useState(false);

  const lastSavedEntriesRef = useRef([]);

  const extractTime = (timeStr) => {
    if (!timeStr || timeStr.startsWith('00:00:00')) return '';
    if (timeStr.includes('T')) return timeStr.split('T')[1].substring(0, 5);
    return timeStr.substring(0, 5);
  };

  const getApiDate = (dateObj = selectedDate) => {
    if (dateObj && typeof dateObj.toDate === 'function') {
      const jsDate = dateObj.toDate(); 
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, '0');
      const day = String(jsDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return toEnglishDigits(dateObj);
  };

  const loadEntriesForDate = async (dateToLoad) => {
    try {
      const apiDateStr = getApiDate(dateToLoad);
      const response = await api.post('/api/v1/timesheet/get-timesheet-by-date', null, {
          params: {
              input_date: apiDateStr
          }
      });
      
      const serverEntries = response.data || [];
      
      const mappedEntries = serverEntries.map(entry => ({
        id: entry.id,
        startTime: extractTime(entry.start_time),
        endTime: extractTime(entry.end_time),
        department_id: entry.department_id || '',
        project_id: entry.project_id || '',
        sub_project1_id: entry.sub_project1_id || '',
        sub_project2_id: entry.sub_project2_id || '',
        description: entry.description || '',
        isSaved: true
      }));

      const isWorkActive = mappedEntries.length > 0 && !mappedEntries[mappedEntries.length - 1].endTime;

      setEntries(mappedEntries);
      setIsWorking(isWorkActive);
      lastSavedEntriesRef.current = JSON.parse(JSON.stringify(mappedEntries));

      if (dateToLoad.format() === today.format()) {
        setTodayEntries(mappedEntries);
        setTodayIsWorking(isWorkActive);
      }
    } catch (error) {
      console.error("Failed to load entries for date:", error);
      setEntries([]);
      setIsWorking(false);
      lastSavedEntriesRef.current = [];
    }
  };

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [deptResponse, projResponse] = await Promise.all([
          api.get('/api/v1/department/get-current-user-departments'),
          api.get('/api/v1/department/get-current-user-projects')
        ]);
        setDepartmentsData(deptResponse.data || []);
        setProjectsData(projResponse.data || []);
      } catch (error) {
        console.error("Failed to fetch reference data:", error);
      }
    };
    
    fetchReferenceData();
    loadEntriesForDate(today); 
  }, [today]);

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
      if (entry.startTime && entry.endTime) {
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

  const handleDateChange = (date) => {
    setSelectedDate(date);
    loadEntriesForDate(date);
  };

  const handleGoToToday = () => {
      setSelectedDate(today);
      loadEntriesForDate(today);
  };

  const toEnglishDigits = (str) => {
    return str ? str.toString().replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) : "";
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
      type: "normal",
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
      
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeNowStr = `${hours}:${minutes}`;

      const serverData = await createEntryApi(apiDate, timeZ);
      
      const hasPreviousEntry = entries.length > 0;
      const lastEntry = hasPreviousEntry ? entries[entries.length - 1] : {};
      
      const newEntry = {
        id: serverData.id,
        startTime: timeNowStr, 
        endTime: '',
        department_id: lastEntry.department_id || '',
        project_id: lastEntry.project_id || '',
        sub_project1_id: lastEntry.sub_project1_id || '',
        sub_project2_id: lastEntry.sub_project2_id || '',
        description: lastEntry.description || '',
        isSaved: !hasPreviousEntry 
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

  const handleEnd = async () => {
    let updatedEntries = [...entries];
    const lastIndex = updatedEntries.length - 1;
    const lastEntry = updatedEntries[lastIndex];

    if (lastIndex >= 0 && !lastEntry.endTime) {
      const depId = Number(lastEntry.department_id);
      if (!depId || depId <= 0) {
        alert("لطفاً پیش از ثبت پایان کار، حتماً «دپارتمان» رکورد فعلی را انتخاب کنید.");
        return; 
      }
    }

    setIsSaving(true);
    let updatedSavedEntries = [...lastSavedEntriesRef.current];

    try {
      if (lastIndex >= 0 && !lastEntry.endTime) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const timeNowStr = `${hours}:${minutes}`;

        const closedEntry = { ...lastEntry, endTime: timeNowStr };

        await updateEntryApi(closedEntry);
        
        updatedEntries[lastIndex] = closedEntry;
        closedEntry.isSaved = true;

        const savedIndex = updatedSavedEntries.findIndex(e => e.id === closedEntry.id);
        if (savedIndex >= 0) updatedSavedEntries[savedIndex] = { ...closedEntry };
      }

      setIsWorking(false);
      setEntries(updatedEntries);
      lastSavedEntriesRef.current = updatedSavedEntries;
    } catch (error) {
      console.error("خطا در ثبت عملیات:", error);
      alert("خطا در ارتباط با سرور هنگام ثبت پایان");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddManualRow = () => {
    const hasPreviousEntry = entries.length > 0;
    const lastEntry = hasPreviousEntry ? entries[entries.length - 1] : {};

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeNowStr = `${hours}:${minutes}`;

    const newEntry = {
      id: `temp-${Date.now()}`,
      startTime: timeNowStr, 
      endTime: '',
      department_id: lastEntry.department_id || '',
      project_id: lastEntry.project_id || '',
      sub_project1_id: lastEntry.sub_project1_id || '',
      sub_project2_id: lastEntry.sub_project2_id || '',
      description: '',
      isSaved: false 
    };
    
    setEntries([...entries, newEntry]);
  };

  const handleFieldEdit = (index, field, value) => {
    const updatedEntries = [...entries];
    updatedEntries[index][field] = value;
    updatedEntries[index].isSaved = false;
    
    setEntries(updatedEntries);
  };

  // Generalized function to update dropdown fields instantly and auto-save
  const updateEntryDropdownsAndSave = async (index, fields) => {
    // 1. Snapshot the target entry with the new fields applied
    const currentEntry = { ...entries[index], ...fields };
    
    // 2. Optimistic UI update
    setEntries(prev => {
      const newEntries = [...prev];
      Object.keys(fields).forEach(key => {
        newEntries[index][key] = fields[key];
      });
      newEntries[index].isSaved = false;
      return newEntries;
    });

    // 3. Auto-save to server if valid department is set
    const depId = Number(currentEntry.department_id);
    if (!depId || depId <= 0) return;

    try {
      let entryToSave = { ...currentEntry };
      
      // Handle automatic creation if it's a temp row
      if (String(entryToSave.id).startsWith('temp-')) {
        const timeZ = entryToSave.startTime ? `${entryToSave.startTime}:00.000Z` : "00:00:00.000Z";
        const serverData = await createEntryApi(getApiDate(), timeZ);
        entryToSave.id = serverData.id;
      }
      
      await updateEntryApi(entryToSave);
      entryToSave.isSaved = true;

      // 4. Update the real ID and change state back to `isSaved: true` 
      // (Using previous state carefully so we don't overwrite user changes made while fetching)
      setEntries(prev => {
        const newEntries = [...prev];
        const entryIndex = newEntries.findIndex(e => e.id === currentEntry.id);
        if (entryIndex !== -1) {
            newEntries[entryIndex] = { ...newEntries[entryIndex], ...entryToSave, isSaved: true };
        }
        return newEntries;
      });
      
      const savedIndex = lastSavedEntriesRef.current.findIndex(e => e.id === entryToSave.id || e.id === currentEntry.id);
      if (savedIndex >= 0) {
          lastSavedEntriesRef.current[savedIndex] = { ...entryToSave };
      } else {
          lastSavedEntriesRef.current.push({ ...entryToSave });
      }
    } catch (error) {
      console.error("Auto save failed:", error);
    }
  };

  const handleDepartmentSelect = (index, departmentId) => {
    updateEntryDropdownsAndSave(index, {
        department_id: departmentId,
        project_id: '',
        sub_project1_id: '',
        sub_project2_id: ''
    });
  };

  const handleProjectSelect = (index, projectId) => {
    updateEntryDropdownsAndSave(index, {
        project_id: projectId,
        sub_project1_id: '',
        sub_project2_id: ''
    });
  };

  const handleSubProject1Select = (index, subProject1Id) => {
    updateEntryDropdownsAndSave(index, {
        sub_project1_id: subProject1Id,
        sub_project2_id: ''
    });
  };

  const handleSubProject2Select = (index, subProject2Id) => {
    updateEntryDropdownsAndSave(index, {
        sub_project2_id: subProject2Id
    });
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
        
        if (!entryToDelete.endTime) {
            setIsWorking(false);
        }
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
        const depId = Number(entry.department_id);
        if (!depId || depId <= 0) {
            alert(`خطا: دپارتمان برای رکورد ساعت ${entry.startTime} انتخاب نشده است.`);
            hasValidationError = true;
            continue; 
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

    return !hasValidationError; 
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

  const isToday = selectedDate.format() === today.format();
  const allowRowEdits = !isToday || (!isWorking && entries.length > 0) || isWorking;

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
            {!isWorking ? (
              <button onClick={handleStart} disabled={isSaving} className="bg-green-600 text-white px-10 py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg font-bold text-lg transition-colors">
                ▶ شروع کار
              </button>
            ) : (
              <button onClick={handleEnd} disabled={isSaving} className="bg-red-500 text-white px-10 py-3 rounded-xl hover:bg-red-600 disabled:opacity-50 shadow-lg font-bold text-lg transition-colors animate-pulse">
                ⏹ پایان کار
              </button>
            )}
          </div>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm text-center text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
            <tr>
              <th className="px-4 py-3">شروع</th>
              <th className="px-4 py-3">پایان</th>
              <th className="px-4 py-3">دپارتمان *</th>
              <th className="px-4 py-3">پروژه</th>
              <th className="px-4 py-3">زیرپروژه ۱</th>
              <th className="px-4 py-3">زیرپروژه ۲</th>
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
              entries.map((entry, index) => {
                const currentProjectsList = projectsData.filter(p => String(p.department_id) === String(entry.department_id));
                const currentProject = currentProjectsList.find(p => String(p.id) === String(entry.project_id));
                const currentSubProject1 = currentProject?.sub_projects1?.find(sp => String(sp.id) === String(entry.sub_project1_id));

                return (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="time" value={entry.startTime} onChange={(e) => handleFieldEdit(index, 'startTime', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500"/>
                    </td>
                    <td className="px-4 py-3">
                      <input type="time" value={entry.endTime} onChange={(e) => handleFieldEdit(index, 'endTime', e.target.value)} disabled={isToday && !entry.endTime && isWorking} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 disabled:opacity-50" placeholder="..."/>
                    </td>
                    
                    <td className="px-4 py-3">
                      <select 
                        value={entry.department_id || ''} 
                        onChange={(e) => handleDepartmentSelect(index, e.target.value)} 
                        className={`bg-transparent outline-none text-center border-b border-dashed ${!entry.department_id && !entry.isSaved ? 'border-red-500 bg-red-50' : 'border-gray-300'} focus:border-indigo-500 w-full min-w-[120px]`}
                      >
                        <option value="">انتخاب دپارتمان</option>
                        {departmentsData.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <select 
                        value={entry.project_id || ''} 
                        onChange={(e) => handleProjectSelect(index, e.target.value)}
                        disabled={!entry.department_id}
                        className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full min-w-[120px] disabled:opacity-50"
                      >
                        <option value="">انتخاب پروژه</option>
                        {currentProjectsList.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <select 
                        value={entry.sub_project1_id || ''} 
                        onChange={(e) => handleSubProject1Select(index, e.target.value)} 
                        disabled={!entry.project_id}
                        className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full min-w-[120px] disabled:opacity-50"
                      >
                        <option value="">انتخاب زیرپروژه ۱</option>
                        {currentProject?.sub_projects1?.map(sp1 => (
                          <option key={sp1.id} value={sp1.id}>{sp1.name}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <select 
                        value={entry.sub_project2_id || ''} 
                        onChange={(e) => handleSubProject2Select(index, e.target.value)} 
                        disabled={!entry.sub_project1_id}
                        className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full min-w-[120px] disabled:opacity-50"
                      >
                        <option value="">انتخاب زیرپروژه ۲</option>
                        {currentSubProject1?.sub_projects2?.map(sp2 => (
                          <option key={sp2.id} value={sp2.id}>{sp2.name}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <input type="text" value={entry.description || ''} onChange={(e) => handleFieldEdit(index, 'description', e.target.value)} className="bg-transparent outline-none text-center border-b border-dashed border-gray-300 focus:border-indigo-500 w-full min-w-[120px]" placeholder="..."/>
                    </td>

                    {allowRowEdits && (
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteRow(entry.id)} className="text-red-500 hover:text-red-700 font-bold">حذف</button>
                      </td>
                    )}
                    
                    <td className="px-2 py-3 text-center">
                      {entry.startTime && (
                        entry.isSaved ? 
                          <span className="text-green-500 font-bold text-lg" title="ذخیره شده در سرور">✔</span> : 
                          <span className="text-gray-400 text-xs" title="نیاز به ذخیره">⏳</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {entries.length > 0 && (
            <tfoot className="bg-indigo-50 border-t-2 border-indigo-100">
              <tr>
                <td colSpan={allowRowEdits ? 7 : 6} className="px-4 py-4 text-right font-bold text-indigo-800">
                  مجموع ساعات کاری:
                </td>
                <td colSpan={2} className="px-4 py-4 text-center font-bold text-xl text-indigo-700" dir="ltr">
                  {totalWorkTime}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      
      <div className="mt-4 mb-8 flex justify-start">
        <button 
          onClick={handleAddManualRow} 
          className="text-sm bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-lg hover:bg-emerald-200 shadow-sm transition"
        >
          + افزودن رکورد دستی
        </button>
      </div>

      <div className="flex flex-col items-center justify-center mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-gray-600 font-medium mb-4">برای مشاهده روزهای دیگر روی تقویم کلیک کنید</h3>
        <Calendar calendar={persian} locale={persian_fa} value={selectedDate} onChange={handleDateChange} className="shadow-lg rounded-xl"/>
      </div>
    </div>
  );
};

export default DailyTimeRegister;
