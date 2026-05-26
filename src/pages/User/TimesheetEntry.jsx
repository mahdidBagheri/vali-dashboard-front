import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Make sure this path is correct for your project
import TimesheetTable from './TimesheetTable'; 

const TimesheetEntry = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [timesheetId, setTimesheetId] = useState(null);
  const [projectsData, setProjectsData] = useState([]);

  const [formData, setFormData] = useState({
    department_id: '',
    project_id: '',
    sub_project1_id: '',
    sub_project2_id: '',
    description: ''
  });

  // Fetch user projects on load
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/api/v1/department/get-current-user-projects');
        setProjectsData(response.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle cascading dropdowns
  const handleProjectChange = (e) => {
    const projId = e.target.value;
    const selectedProject = projectsData.find(p => p.id === Number(projId));
    
    setFormData({
      ...formData,
      project_id: projId,
      department_id: selectedProject ? selectedProject.department_id : '',
      sub_project1_id: '', 
      sub_project2_id: ''
    });
  };

  // THE SINGLE BUTTON LOGIC: START / FINISH
  const handleToggle = async (e) => {
    e.preventDefault();
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTimeApi = now.toTimeString().split(' ')[0].substring(0, 5) + ":00.000Z"; // Gets current time HH:MM:00.000Z

    if (!isTracking) {
      // ===== START ACTION =====
      const payload = {
        date_: currentDate,
        start_time: currentTimeApi, // Current time as start time
        end_time: currentTimeApi, 
        deduction_hours: "PT0S",
        type: "normal",
        department_id: Number(formData.department_id) || 0,
        project_id: Number(formData.project_id) || 0,
        sub_project1_id: Number(formData.sub_project1_id) || 0,
        sub_project2_id: Number(formData.sub_project2_id) || 0,
        description: formData.description || ""
      };

      try {
        const response = await api.post('/api/v1/timesheet/create-timesheet-entry', payload);
        setTimesheetId(response.data.id); // Save ID for the Finish action
        setIsTracking(true); // Toggle button to "Finish"
      } catch (error) {
        console.error('Error starting timesheet', error);
        alert('Error starting timesheet.');
      }
      
    } else {
      // ===== FINISH ACTION =====
      if (!timesheetId) return alert('Error: Timesheet ID not found.');

      const payload = {
          date_: currentDate,
          start_time: "00:00:00.000Z", // Backend should preserve original start time, we just send end_time
          end_time: currentTimeApi,    // Current time as end time
          deduction_hours: "PT0S",
          type: "normal",
          department_id: Number(formData.department_id) || 0,
          project_id: Number(formData.project_id) || 0,
          sub_project1_id: Number(formData.sub_project1_id) || 0,
          sub_project2_id: Number(formData.sub_project2_id) || 0,
          description: formData.description || ""
      };

      try {
        await api.put(`/api/v1/timesheet/update-timesheet-entry/${timesheetId}`, payload);
        
        // Reset state back to Start mode
        setIsTracking(false);
        setTimesheetId(null);
        setFormData(prev => ({ ...prev, description: '' })); // Optional: clear description for next entry
        
        alert('Finished successfully!');
      } catch (error) {
        console.error('Error stopping timesheet', error);
        alert('Error finishing timesheet.');
      }
    }
  };

  // Extract sub-projects for dropdowns based on selected project
  const selectedProjectObj = projectsData.find(p => p.id === Number(formData.project_id));
  const subProjects1List = selectedProjectObj?.sub_projects1 || [];
  const selectedSubProject1Obj = subProjects1List.find(sp => sp.id === Number(formData.sub_project1_id));
  const subProjects2List = selectedSubProject1Obj?.sub_projects2 || [];

  return (
    <div dir="rtl" className="max-w-7xl mx-auto p-3 sm:p-6 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
        ثبت و مدیریت کارکرد
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-1">
          <div className="p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-100 lg:sticky lg:top-6">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-indigo-700 border-b pb-2">
              ثبت ساعت کاری جدید
            </h2>
            
            <form className="flex flex-col space-y-4 sm:space-y-5">
              
              {/* Note: Date and Start Time inputs are completely removed as per your instruction to rely purely on the real-time click */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">پروژه</label>
                <select 
                  name="project_id" value={formData.project_id} onChange={handleProjectChange} 
                  className="w-full text-base sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white" 
                >
                  <option value="">انتخاب پروژه...</option>
                  {projectsData.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
                </select>
              </div>

              {subProjects1List.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">زیر پروژه ۱</label>
                  <select 
                    name="sub_project1_id" value={formData.sub_project1_id} onChange={handleChange} 
                    className="w-full text-base sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white" 
                  >
                    <option value="">انتخاب...</option>
                    {subProjects1List.map(sp1 => <option key={sp1.id} value={sp1.id}>{sp1.name}</option>)}
                  </select>
                </div>
              )}

              {subProjects2List.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">زیر پروژه ۲</label>
                  <select 
                    name="sub_project2_id" value={formData.sub_project2_id} onChange={handleChange} 
                    className="w-full text-base sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 bg-white" 
                  >
                    <option value="">انتخاب...</option>
                    {subProjects2List.map(sp2 => <option key={sp2.id} value={sp2.id}>{sp2.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                <textarea 
                  name="description" value={formData.description} onChange={handleChange} rows="3"
                  className="w-full text-base sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" 
                ></textarea>
              </div>

              {/* === THE ONLY BUTTON === */}
              <button 
                onClick={handleToggle}
                className={`w-full text-white font-medium p-3 rounded-lg transition-colors shadow-sm mt-2 sm:mt-4 ${
                  isTracking ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isTracking ? 'Finish (پایان)' : 'Start (شروع)'}
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
