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
  const tableRef = useRef(null);

  useEffect(() => {
    const daysCount = getDaysInJalaliMonth(year, month);
    const newData = Array.from({ length: daysCount }, (_, i) => ({
      dayIndex: i + 1,
      dateString: `${year}/${String(month).padStart(2, '0')}/${String(i + 1).padStart(2, '0')}`,
      department: '',
      start: '',
      stop: '',
      breakMin: 0,
      netHours: '00:00'
    }));
    setTableData(newData);
  }, [year, month]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableRef.current && !tableRef.current.contains(e.target)) setIsExpanded(false);
    };
    if (isExpanded) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  const handleInputChange = (index, field, value) => {
    const updated = [...tableData];
    updated[index][field] = value;
    updated[index].netHours = calculateNetTime(
      updated[index].start, updated[index].stop, updated[index].breakMin
    );
    setTableData(updated);
  };

  const wrapperClasses = isExpanded 
    ? "fixed inset-0 z-50 bg-gray-900/90 flex items-center justify-center p-0"
    : "relative w-full max-w-6xl mx-auto my-2 p-0 sm:p-4";

  const tableClasses = isExpanded
    ? "bg-white w-full h-full sm:h-auto sm:max-h-[95vh] flex flex-col overflow-hidden"
    : "bg-white rounded shadow flex flex-col overflow-hidden border border-gray-300";

  // کلاس به شدت فشرده برای جلوگیری از به هم ریختگی در حالت فوکوس
  const timeInputClasses = "w-[38px] min-w-[38px] max-w-[38px] bg-transparent p-0 m-0 h-5 outline-none focus:bg-indigo-50 text-center text-[10px] tracking-tighter leading-none appearance-none block mx-auto " + 
    "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-clear-button]:hidden [&::-webkit-inner-spin-button]:hidden " + 
    "[&::-webkit-datetime-edit-ampm-field]:hidden [&::-webkit-datetime-edit-ampm-field]:w-0 " + 
    "[&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0";

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
                {showDept && <th className="p-0 border-b border-gray-300 w-12">بخش</th>}
                <th className="p-0 border-b border-gray-300 w-[40px] max-w-[40px]">شروع</th>
                <th className="p-0 border-b border-gray-300 w-[40px] max-w-[40px]">پایان</th>
                <th className="p-0 border-b border-gray-300 w-8 leading-[10px]">استراحت</th>
                <th className="p-0 border-b border-gray-300 w-9">خالص</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {tableData.map((row, index) => (
                <tr key={row.dateString} className="border-b border-gray-100 hover:bg-indigo-50 bg-white">
                  <td className="p-0 font-bold text-gray-800 bg-gray-100/50">{row.dayIndex}</td>
                  
                  {showDept && (
                    <td className="p-0 border-r border-gray-100 overflow-hidden">
                      <input type="text" value={row.department} onChange={(e) => handleInputChange(index, 'department', e.target.value)} className="w-full bg-transparent outline-none text-center p-0 h-5 text-[9px]" />
                    </td>
                  )}
                  
                  <td className="p-0 border-r border-gray-100 overflow-hidden max-w-[40px] w-[40px]">
                    <input type="time" value={row.start} onChange={(e) => handleInputChange(index, 'start', e.target.value)} className={timeInputClasses} />
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
          <button className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] rounded font-medium">ذخیره</button>
        </div>
      </div>
    </div>
  );
}
