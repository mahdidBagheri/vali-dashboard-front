import React, { useState, useEffect, useRef } from 'react';

// --- توابع کمکی تقویم جلالی ---
const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const getDaysInJalaliMonth = (year, month) => {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(year % 33);
  return isLeap ? 30 : 29;
};

// تبدیل تاریخ جلالی به میلادی برای ارسال به API
const jalaaliToGregorian = (jy, jm, jd) => {
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let days = (365 * jy) + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30 + 186));
  let gy2 = gy + 400 * Math.floor(days / 146097);
  let d = days % 146097;
  if (d > 36524) { gy2 += 100 * Math.floor(--d / 36524); d %= 36524; if (d >= 365) d++; }
  gy2 += 4 * Math.floor(d / 1461);
  d %= 1461;
  if (d > 365) { gy2 += Math.floor((d - 1) / 365); d = (d - 1) % 365; }
  let gd = d + 1;
  const sal_a = [0, 31, ((gy2 % 4 === 0 && gy2 % 100 !== 0) || (gy2 % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm;
  for (gm = 0; gm < 13; gm++) {
    if (gd <= sal_a[gm]) break;
    gd -= sal_a[gm];
  }
  return [gy2, gm, gd];
};

// محاسبه اختلاف زمان
const calculateNetTime = (start, stop, breakMinutes) => {
  if (!start || !stop) return '00:00';
  const [startH, startM] = start.split(':').map(Number);
  const [stopH, stopM] = stop.split(':').map(Number);
  let totalMinutes = (stopH * 60 + stopM) - (startH * 60 + startM);
  
  if (totalMinutes < 0) totalMinutes += 24 * 60; 
  totalMinutes -= (Number(breakMinutes) || 0);

  if (totalMinutes <= 0) return '00:00';

  const netH = Math.floor(totalMinutes / 60);
  const netM = totalMinutes % 60;
  return `${String(netH).padStart(2, '0')}:${String(netM).padStart(2, '0')}`;
};

export default function TimesheetTable() {
  const [year, setYear] = useState(1405);
  const [month, setMonth] = useState(2); 
  const [tableData, setTableData] = useState([]);
  
  const [showDept, setShowDept] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const tableRef = useRef(null);

  // تولید ردیف‌های اولیه
  useEffect(() => {
    const daysCount = getDaysInJalaliMonth(year, month);
    const newData = Array.from({ length: daysCount }, (_, i) => {
      const [gy, gm, gd] = jalaaliToGregorian(year, month, i + 1);
      const gregorianDate = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
      
      return {
        localId: `initial-${i}`, // شناسه محلی برای مدیریت در ری‌اکت
        id: null,                // شناسه دیتابیس که از سمت سرور میاد
        dayIndex: i + 1,
        dateStringGregorian: gregorianDate,
        department_id: '',
        project_id: '',
        sub_project1_id: '',
        sub_project2_id: '',
        description: '',
        start: '',
        stop: '',
        breakMin: 0,
        netHours: '00:00',
        isDirty: false // وضعیت تغییرات برای ذخیره‌سازی
      };
    });
    setTableData(newData);
  }, [year, month]);

  // مدیریت کلیک خارج از جدول
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableRef.current && !tableRef.current.contains(e.target)) setIsExpanded(false);
    };
    if (isExpanded) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  // مدیریت تغییرات در اینپوت‌ها
  const handleInputChange = (index, field, value) => {
    const updated = [...tableData];
    updated[index][field] = value;
    updated[index].netHours = calculateNetTime(
      updated[index].start, updated[index].stop, updated[index].breakMin
    );
    updated[index].isDirty = true; // علامت‌گذاری ردیف به عنوان "تغییر یافته"
    setTableData(updated);
  };

  // اضافه کردن یک ردیف جدید برای یک روز خاص (جهت ثبت چند تایم در یک روز)
  const handleAddRowForDay = (dayIndex, dateStringGregorian) => {
    const newRow = {
        localId: `new-${Date.now()}`,
        id: null,
        dayIndex, 
        dateStringGregorian,
        department_id: '', project_id: '', sub_project1_id: '', sub_project2_id: '', description: '',
        start: '', stop: '', breakMin: 0, netHours: '00:00', isDirty: false
    };
    const lastIndex = tableData.findLastIndex(r => r.dayIndex === dayIndex);
    const updated = [...tableData];
    updated.splice(lastIndex + 1, 0, newRow);
    setTableData(updated);
  };

  // 1. API CALL: POST - ایجاد سابقه جدید با کلیک روی دکمه استارت
  const handleStartClick = async (index) => {
    const row = tableData[index];
    const now = new Date();
    // گرفتن زمان فعلی به فرمت HH:mm:ss.SSSZ
    const startTimeStringZ = now.toISOString().split('T')[1]; 

    try {
      const res = await fetch('/api/v1/timesheet/create-timesheet-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_: row.dateStringGregorian,
          start_time: startTimeStringZ
        })
      });
      const data = await res.json();

      const updated = [...tableData];
      updated[index].id = data.id; // گرفتن ID از دیتابیس
      updated[index].start = data.start_time.substring(0, 5); // تبدیل 11:59:04.036Z به 11:59 برای اینپوت
      updated[index].isDirty = true;
      setTableData(updated);
    } catch (err) {
      console.error("Error creating entry:", err);
      alert("خطا در ایجاد رکورد");
    }
  };

  // 2. API CALL: PUT - ذخیره و آپدیت ردیف‌هایی که تغییر کرده‌اند
  const handleSaveAll = async () => {
    // فقط ردیف‌هایی را ذخیره کن که ویرایش شده‌اند و ID دارند (استارت خورده‌اند)
    const dirtyRows = tableData.filter(r => r.isDirty && r.id !== null);
    if (dirtyRows.length === 0) return;

    setIsSaving(true);
    try {
      for (let row of dirtyRows) {
        const payload = {
          date_: row.dateStringGregorian,
          start_time: row.start ? `${row.start}:00.000Z` : "00:00:00.000Z",
          end_time: row.stop ? `${row.stop}:00.000Z` : "00:00:00.000Z",
          deduction_hours: "PT0S",
          type: "normal",
          department_id: Number(row.department_id) || 0,
          project_id: Number(row.project_id) || 0,
          sub_project1_id: Number(row.sub_project1_id) || 0,
          sub_project2_id: Number(row.sub_project2_id) || 0,
          description: row.description || ""
        };

        await fetch(`/api/v1/timesheet/update-timesheet-entry/${row.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      // پاک کردن وضعیت کثیف (Dirty) بعد از ذخیره موفق
      setTableData(prev => prev.map(r => r.isDirty ? { ...r, isDirty: false } : r));
      alert("تغییرات با موفقیت ذخیره شد");
    } catch (err) {
      console.error("Error saving entries:", err);
      alert("خطا در ذخیره‌سازی");
    } finally {
      setIsSaving(false);
    }
  };

  const wrapperClasses = isExpanded 
    ? "fixed inset-0 z-50 bg-gray-900/90 flex items-center justify-center p-0"
    : "relative w-full max-w-6xl mx-auto my-2 p-0 sm:p-4";

  const tableClasses = isExpanded
    ? "bg-white w-full h-full sm:h-auto sm:max-h-[95vh] flex flex-col overflow-hidden"
    : "bg-white rounded shadow flex flex-col overflow-hidden border border-gray-300";

  const timeInputClasses = "w-[38px] min-w-[38px] max-w-[38px] bg-transparent p-0 m-0 h-5 outline-none focus:bg-indigo-50 text-center text-[10px] tracking-tighter leading-none appearance-none block mx-auto " + 
    "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-clear-button]:hidden [&::-webkit-inner-spin-button]:hidden " + 
    "[&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-datetime-edit-ampm-field]:w-0 " + 
    "[&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0";

  const inputClasses = "w-full bg-transparent outline-none text-center p-0 h-5 text-[9px]";

  return (
    <div dir="rtl" className={wrapperClasses}>
      <div ref={tableRef} onClick={() => !isExpanded && setIsExpanded(true)} className={tableClasses}>
        
        {/* هدر */}
        <div className="p-1 bg-indigo-700 text-white flex justify-between items-center shrink-0">
          <h2 className="text-[11px] sm:text-sm font-bold flex items-center gap-1">
            تایم‌شیت {isExpanded && <span className="bg-indigo-500 px-1 rounded animate-pulse">زوم</span>}
          </h2>
          <div className="flex gap-1 text-[10px]">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="p-0.5 rounded bg-indigo-800 text-white outline-none border-none">
              {JALALI_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-9 p-0.5 rounded bg-indigo-800 text-white outline-none border-none text-center" />
          </div>
        </div>

        {/* بدنه */}
        <div className="overflow-x-auto overflow-y-auto flex-1 bg-gray-50">
          <table className="w-full text-center table-fixed border-collapse">
            <thead className="bg-gray-200 uppercase sticky top-0 z-10 text-[9px] text-gray-700 font-bold shadow-sm">
              <tr>
                <th className="p-0 border-b border-gray-300 w-8">
                  <div className="flex items-center justify-between px-0.5">
                    روز
                    <button onClick={(e) => { e.stopPropagation(); setShowDept(!showDept); }} className="bg-indigo-500 text-white rounded w-3 h-3 flex items-center justify-center leading-none">
                      {showDept ? '-' : '+'}
                    </button>
                  </div>
                </th>
                {showDept && (
                  <>
                    <th className="p-0 border-b border-gray-300 w-10">دپارتمان</th>
                    <th className="p-0 border-b border-gray-300 w-10">پروژه</th>
                    <th className="p-0 border-b border-gray-300 w-10">زیرپروژه۱</th>
                    <th className="p-0 border-b border-gray-300 w-10">زیرپروژه۲</th>
                    <th className="p-0 border-b border-gray-300 w-16">توضیحات</th>
                  </>
                )}
                <th className="p-0 border-b border-gray-300 w-[55px] max-w-[55px]">شروع</th>
                <th className="p-0 border-b border-gray-300 w-[40px] max-w-[40px]">پایان</th>
                <th className="p-0 border-b border-gray-300 w-8 leading-[10px]">استراحت</th>
                <th className="p-0 border-b border-gray-300 w-9">خالص</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {tableData.map((row, index) => (
                <tr key={row.localId} className="border-b border-gray-100 hover:bg-indigo-50 bg-white">
                  
                  {/* سلول روز و دکمه اضافه کردن تایم جدید */}
                  <td className="p-0 font-bold text-gray-800 bg-gray-100/50">
                    <div className="flex items-center justify-between px-1 h-full">
                      <span className="flex-1 text-center">{row.dayIndex}</span>
                      <button 
                        onClick={() => handleAddRowForDay(row.dayIndex, row.dateStringGregorian)} 
                        className="text-[9px] text-indigo-500 bg-indigo-100 rounded-full w-3 h-3 flex items-center justify-center pb-0.5" 
                        title="ثبت زمان جدید برای این روز"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  
                  {showDept && (
                    <>
                      <td className="p-0 border-r border-gray-100 overflow-hidden">
                        <input type="number" placeholder="ID" value={row.department_id} onChange={(e) => handleInputChange(index, 'department_id', e.target.value)} className={inputClasses} />
                      </td>
                      <td className="p-0 border-r border-gray-100 overflow-hidden">
                        <input type="number" placeholder="ID" value={row.project_id} onChange={(e) => handleInputChange(index, 'project_id', e.target.value)} className={inputClasses} />
                      </td>
                      <td className="p-0 border-r border-gray-100 overflow-hidden">
                        <input type="number" placeholder="ID" value={row.sub_project1_id} onChange={(e) => handleInputChange(index, 'sub_project1_id', e.target.value)} className={inputClasses} />
                      </td>
                      <td className="p-0 border-r border-gray-100 overflow-hidden">
                        <input type="number" placeholder="ID" value={row.sub_project2_id} onChange={(e) => handleInputChange(index, 'sub_project2_id', e.target.value)} className={inputClasses} />
                      </td>
                      <td className="p-0 border-r border-gray-100 overflow-hidden">
                        <input type="text" placeholder="..." value={row.description} onChange={(e) => handleInputChange(index, 'description', e.target.value)} className={inputClasses} />
                      </td>
                    </>
                  )}
                  
                  {/* استارت و ساعت شروع */}
                  <td className="p-0 border-r border-gray-100 overflow-hidden max-w-[55px] w-[55px]">
                    <div className="flex items-center justify-center gap-0.5 h-full w-full px-0.5">
                      {!row.id && (
                        <button onClick={() => handleStartClick(index)} className="text-[7px] text-white bg-green-500 rounded px-1 py-0.5" title="استارت">▶</button>
                      )}
                      <input type="time" value={row.start} onChange={(e) => handleInputChange(index, 'start', e.target.value)} className={timeInputClasses} />
                    </div>
                  </td>
                  
                  <td className="p-0 border-r border-gray-100 overflow-hidden max-w-[40px] w-[40px]">
                    <input type="time" value={row.stop} onChange={(e) => handleInputChange(index, 'stop', e.target.value)} className={timeInputClasses} />
                  </td>
                  
                  <td className="p-0 border-r border-gray-100 overflow-hidden">
                    <input type="number" min="0" value={row.breakMin || ''} onChange={(e) => handleInputChange(index, 'breakMin', e.target.value)} className="w-full bg-transparent p-0 h-5 outline-none text-center appearance-none [&::-webkit-inner-spin-button]:hidden text-[10px]" />
                  </td>
                  
                  <td className="p-0 border-r border-gray-100 font-bold text-indigo-600 tracking-tighter" dir="ltr">{row.netHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* فوتر */}
        <div className="p-1 bg-gray-200 flex justify-between items-center shrink-0">
          <span className="text-[8px] text-gray-500">{isExpanded ? 'خروج: لمس حاشیه' : 'لمس جدول = زوم'}</span>
          <button 
            onClick={handleSaveAll} 
            disabled={isSaving}
            className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] rounded font-medium disabled:opacity-50"
          >
            {isSaving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </div>
    </div>
  );
}
