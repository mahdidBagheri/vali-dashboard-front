import React, { useState, useEffect } from 'react';

// --- Jalali Helper Functions ---
const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

// Calculate days in a Jalali month (handles leap years based on the 33-year cycle)
const getDaysInJalaliMonth = (year, month) => {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(year % 33);
  return isLeap ? 30 : 29;
};

// Calculate Time Difference
const calculateNetTime = (start, stop, breakMinutes) => {
  if (!start || !stop) return '00:00';
  
  const [startH, startM] = start.split(':').map(Number);
  const [stopH, stopM] = stop.split(':').map(Number);
  
  let totalMinutes = (stopH * 60 + stopM) - (startH * 60 + startM);
  
  // If stop time is past midnight (e.g., start 22:00, stop 06:00)
  if (totalMinutes < 0) totalMinutes += 24 * 60; 
  
  // Subtract break time
  totalMinutes -= (Number(breakMinutes) || 0);

  if (totalMinutes <= 0) return '00:00';

  const netH = Math.floor(totalMinutes / 60);
  const netM = totalMinutes % 60;
  return `${String(netH).padStart(2, '0')}:${String(netM).padStart(2, '0')}`;
};

export default function TimesheetTable() {
  // Default to today's Jalali Date: 1405/02 (Ordibehesht)
  const [year, setYear] = useState(1405);
  const [month, setMonth] = useState(2); 
  const [tableData, setTableData] = useState([]);

  // Generate table rows when Year or Month changes
  useEffect(() => {
    const daysCount = getDaysInJalaliMonth(year, month);
    const newData = [];
    
    for (let day = 1; day <= daysCount; day++) {
      newData.push({
        dayIndex: day,
        dateString: `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
        start: '',
        stop: '',
        breakMin: 0,
        netHours: '00:00'
      });
    }
    setTableData(newData);
  }, [year, month]);

  // Handle Input Changes
  const handleInputChange = (index, field, value) => {
    const updatedData = [...tableData];
    updatedData[index][field] = value;
    
    // Auto-calculate net hours on any change
    updatedData[index].netHours = calculateNetTime(
      updatedData[index].start,
      updatedData[index].stop,
      updatedData[index].breakMin
    );
    
    setTableData(updatedData);
  };

  return (
    <div dir="rtl" className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        
        {/* Header & Controls */}
        <div className="p-6 bg-indigo-600 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold">تایم‌شیت ماهانه</h2>
          
          <div className="flex gap-4 items-center">
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-4 py-2 rounded bg-indigo-700 border-none text-white focus:ring-2 focus:ring-white outline-none cursor-pointer"
            >
              {JALALI_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>

            <input 
              type="number" 
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 px-4 py-2 rounded bg-indigo-700 border-none text-white focus:ring-2 focus:ring-white outline-none text-center"
            />
          </div>
        </div>

        {/* Timesheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-gray-700">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th className="px-6 py-4">تاریخ</th>
                <th className="px-6 py-4">زمان شروع</th>
                <th className="px-6 py-4">زمان پایان</th>
                <th className="px-6 py-4">استراحت (دقیقه)</th>
                <th className="px-6 py-4">کارکرد خالص</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={row.dateString} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {row.dateString}
                  </td>
                  <td className="px-6 py-3">
                    <input 
                      type="time" 
                      value={row.start}
                      onChange={(e) => handleInputChange(index, 'start', e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input 
                      type="time" 
                      value={row.stop}
                      onChange={(e) => handleInputChange(index, 'stop', e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input 
                      type="number" 
                      min="0"
                      value={row.breakMin}
                      onChange={(e) => handleInputChange(index, 'breakMin', e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none w-full max-w-[100px]"
                    />
                  </td>
                  <td className="px-6 py-3 text-lg font-bold text-indigo-700 dir-ltr text-right">
                    {row.netHours}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t flex justify-end">
          <button 
            onClick={() => console.log("Submitting Data:", tableData)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            ذخیره تایم‌شیت
          </button>
        </div>

      </div>
    </div>
  );
}
