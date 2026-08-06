"use client";

import React, { useState, useMemo } from 'react';
import { saveAcademicGoal } from '@/app/actions/cgpa';

const gradeWeights: Record<string, number> = {
  'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
};

export default function CGPACalculator() {
  // Input Parameters State
  const [semesterNumber, setSemesterNumber] = useState<number>(6);
  const [targetCgpa, setTargetCgpa] = useState<number>(3.65);
  const [currentCgpa, setCurrentCgpa] = useState<number>(3.50);
  const [creditsEarned, setCreditsEarned] = useState<number>(90.0);
  
  // Live Semester Simulator State (Max 5 Courses)
  const [courses, setCourses] = useState([
    { id: 1, name: 'Undergraduate Thesis', credits: 3.0, grade: 'A' },
    { id: 2, name: 'Advanced Machine Learning', credits: 3.0, grade: 'A-' },
  ]);

  const [saveStatus, setSaveStatus] = useState<string>("");

  // Smart Assistant & Reverse Calculation Engine
  const simData = useMemo(() => {
    const simCredits = courses.reduce((acc, curr) => acc + curr.credits, 0);
    const simPoints = courses.reduce((acc, curr) => acc + (curr.credits * gradeWeights[curr.grade]), 0);
    
    const simulatedGpa = simCredits > 0 ? simPoints / simCredits : 0;
    
    const totalCurrentPoints = currentCgpa * creditsEarned;
    const projectedCgpa = (creditsEarned + simCredits) > 0 
      ? (totalCurrentPoints + simPoints) / (creditsEarned + simCredits) 
      : currentCgpa;

    // Reverse Engineering Required Grades
    const requiredTotalPoints = targetCgpa * (creditsEarned + simCredits);
    const requiredSimPoints = requiredTotalPoints - totalCurrentPoints;
    const requiredGpa = simCredits > 0 ? requiredSimPoints / simCredits : 0;
    const isPossible = requiredGpa <= 4.0;

    return { simCredits, simulatedGpa, projectedCgpa, requiredGpa, isPossible };
  }, [courses, currentCgpa, creditsEarned, targetCgpa]);

  const handleUpdateCourse = (id: number, field: string, value: string | number) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleAddCourse = () => {
    if (courses.length >= 5) {
      alert("Specification Limit: You can only simulate up to 5 courses per semester.");
      return;
    }
    const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
    setCourses([...courses, { id: newId, name: '', credits: 3.0, grade: 'A' }]);
  };

  const handleApplyPlanner = async () => {
    setSaveStatus("Persisting to database...");
    const res = await saveAcademicGoal({
      semesterNumber,
      currentCgpa,
      completedCredits: creditsEarned,
      targetCgpa,
      upcomingCredits: simData.simCredits,
      requiredGpa: simData.requiredGpa,
      isPossible: simData.isPossible,
      courses: courses.map(c => ({ name: c.name || "Untitled", credits: c.credits, targetGrade: c.grade }))
    });
    setSaveStatus(res.message);
    setTimeout(() => setSaveStatus(""), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 lg:p-10 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">Interactive CGPA Calculator</h1>
          <p className="text-gray-500 mt-2 font-medium">Forecast, track, and optimize your path to graduation.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Parameters Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Current Standing
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Current CGPA</label>
                  <input type="number" step="0.01" value={currentCgpa} onChange={(e)=>setCurrentCgpa(Number(e.target.value))} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Credits Earned</label>
                  <input type="number" value={creditsEarned} onChange={(e)=>setCreditsEarned(Number(e.target.value))} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>

              <div className="border-t border-gray-100 my-5"></div>

              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Future Goal
              </h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Sem. No.</label>
                  <input type="number" value={semesterNumber} onChange={(e)=>setSemesterNumber(Number(e.target.value))} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="flex-[2]">
                  <label className="text-xs font-bold text-gray-500 uppercase">Target CGPA</label>
                  <input type="number" step="0.01" value={targetCgpa} onChange={(e)=>setTargetCgpa(Number(e.target.value))} className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>

            {/* Smart Assistant Card */}
            <div className="bg-[#5b51e5] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <h3 className="font-bold text-sm tracking-wide mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                SMART ASSISTANT
              </h3>
              <p className="text-[15px] font-medium leading-relaxed mb-4">
                To reach your target of <span className="font-extrabold text-white bg-white/20 px-2 py-0.5 rounded">{targetCgpa.toFixed(2)}</span>, you need a minimum GPA of <span className="font-extrabold text-white bg-white/20 px-2 py-0.5 rounded">{simData.requiredGpa.toFixed(2)}</span> in semester {semesterNumber}.
              </p>
              {!simData.isPossible && (
                 <p className="text-xs bg-red-500/90 text-white p-3 rounded-lg font-bold border border-red-400">
                   Mathematical Warning: This target requires a GPA greater than 4.0.
                 </p>
              )}
            </div>
          </div>

          {/* Live Simulator Column */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Live Semester Simulator</h3>
              <button onClick={handleAddCourse} disabled={courses.length >= 5} className="bg-gray-900 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50">
                + Add Course ({courses.length}/5)
              </button>
            </div>

            <div className="grid grid-cols-12 text-xs font-bold text-gray-400 tracking-wider mb-3 px-2">
              <div className="col-span-5 uppercase">Course Name</div>
              <div className="col-span-2 text-center uppercase">Credits</div>
              <div className="col-span-3 text-center uppercase">Grade</div>
              <div className="col-span-2 text-right uppercase">Points</div>
            </div>

            <div className="space-y-2 mb-8 min-h-[200px]">
              {courses.map(course => (
                <div key={course.id} className="grid grid-cols-12 items-center text-sm font-semibold border border-gray-100 p-2 rounded-xl bg-gray-50/50">
                  <div className="col-span-5">
                    <input type="text" value={course.name} placeholder="e.g. Algorithms" onChange={(e) => handleUpdateCourse(course.id, 'name', e.target.value)} className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-200 rounded px-2 py-1 outline-none text-gray-800" />
                  </div>
                  <div className="col-span-2 text-center">
                    <input type="number" step="0.5" min="0" max="6" value={course.credits} onChange={(e) => handleUpdateCourse(course.id, 'credits', Number(e.target.value))} className="w-16 bg-white border border-gray-200 focus:border-indigo-500 rounded outline-none py-1 text-gray-800 text-center" />
                  </div>
                  <div className="col-span-3 text-center">
                    <select value={course.grade} onChange={(e) => handleUpdateCourse(course.id, 'grade', e.target.value)} className="bg-white border border-gray-200 text-gray-700 py-1 px-2 rounded outline-none focus:border-indigo-500 font-bold w-20">
                      {Object.keys(gradeWeights).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 text-right font-bold text-indigo-600 pr-2">
                    {(course.credits * gradeWeights[course.grade]).toFixed(1)}
                  </div>
                </div>
              ))}
              {courses.length === 0 && <p className="text-center text-gray-400 text-sm mt-8">No courses added. Click "+ Add Course" to start simulating.</p>}
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 flex flex-wrap items-center justify-between border border-gray-100">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Simulated GPA</p>
                  <p className="text-3xl font-extrabold text-gray-900">{simData.simulatedGpa.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Projected CGPA</p>
                  <p className={`text-3xl font-extrabold ${simData.projectedCgpa >= targetCgpa ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {simData.projectedCgpa.toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 mt-4 sm:mt-0">
                <button onClick={handleApplyPlanner} disabled={courses.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl text-sm shadow-md transition disabled:opacity-50">
                  Save to Planner
                </button>
                {saveStatus && <span className="text-xs font-bold text-indigo-500">{saveStatus}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}