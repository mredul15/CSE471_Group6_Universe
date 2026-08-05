"use client";

import React, { useState, useMemo } from 'react';
import { saveAcademicGoal } from '@/app/actions/cgpa';

const gradeWeights: Record<string, number> = {
  'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
};

export default function CGPAForecastPage() {
  // Goal State
  const [semesterNumber, setSemesterNumber] = useState<number>(5);
  const [targetCgpa, setTargetCgpa] = useState<number>(3.55);
  const [currentCgpa, setCurrentCgpa] = useState<number>(3.50);
  const [creditsEarned, setCreditsEarned] = useState<number>(84.0);
  
  // Simulator State
  const [courses, setCourses] = useState([
    { id: 1, name: 'Advanced Machine Learning', credits: 4.0, grade: 'A' },
    { id: 2, name: 'UI/UX Design Studio', credits: 3.0, grade: 'A-' },
    { id: 3, name: 'Discrete Mathematics', credits: 3.0, grade: 'B+' },
    { id: 4, name: 'Technical Writing', credits: 2.0, grade: 'A' },
  ]);

  const [saveStatus, setSaveStatus] = useState<string>("");

  const simData = useMemo(() => {
    const simCredits = courses.reduce((acc, curr) => acc + curr.credits, 0);
    const simPoints = courses.reduce((acc, curr) => acc + (curr.credits * gradeWeights[curr.grade]), 0);
    
    const simulatedGpa = simCredits > 0 ? simPoints / simCredits : 0;
    
    const totalCurrentPoints = currentCgpa * creditsEarned;
    const projectedCgpa = (totalCurrentPoints + simPoints) / (creditsEarned + simCredits);

    const requiredTotalPoints = targetCgpa * (creditsEarned + simCredits);
    const requiredSimPoints = requiredTotalPoints - totalCurrentPoints;
    const requiredGpa = simCredits > 0 ? requiredSimPoints / simCredits : 0;
    const isPossible = requiredGpa <= 4.0;

    return { simCredits, simulatedGpa, projectedCgpa, requiredGpa, isPossible };
  }, [courses, currentCgpa, creditsEarned, targetCgpa]);

  // NEW: Handle editing inputs
  const handleUpdateCourse = (id: number, field: string, value: string | number) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // NEW: Add up to 5 courses
  const handleAddCourse = () => {
    if (courses.length >= 5) {
      alert("Maximum limit reached: You can only add up to 5 courses per semester.");
      return;
    }
    const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
    // Add a blank course for the user to type in
    setCourses([...courses, { id: newId, name: '', credits: 3.0, grade: 'A' }]);
  };

  const handleApplyPlanner = async () => {
    setSaveStatus("Saving to database...");
    
    // Format the courses for the database
    const dbCourses = courses.map(c => ({
        name: c.name || "Untitled Course",
        credits: c.credits,
        targetGrade: c.grade
    }));

    const res = await saveAcademicGoal({
      semesterNumber,
      currentCgpa,
      completedCredits: creditsEarned,
      targetCgpa,
      upcomingCredits: simData.simCredits,
      requiredGpa: simData.requiredGpa,
      isPossible: simData.isPossible,
      courses: dbCourses // Passing the courses to the backend
    });
    
    setSaveStatus(res.message);
    setTimeout(() => setSaveStatus(""), 4000);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* ================= SIDEBAR ================= */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col justify-between hidden md:flex h-full pb-6">
        <div>
          <div className="h-20 flex items-center px-8 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#1e293b] rounded-md flex items-center justify-center text-white font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">UniVerse</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Academic Hub</p>
              </div>
            </div>
          </div>

          <nav className="mt-6 px-4 space-y-2">
            {['Dashboard', 'Budget', 'Class Routine', 'Assignments'].map((item) => (
              <a key={item} href="#" className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-lg font-medium text-sm">
                <div className="w-5 h-5 bg-gray-200 rounded-sm"></div> {item}
              </a>
            ))}
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-indigo-700 bg-indigo-50/50 border-r-4 border-indigo-600 rounded-lg font-bold shadow-sm text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              CGPA Forecast
            </a>
            {['ScholarPing', 'Career Hub'].map((item) => (
              <a key={item} href="#" className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-lg font-medium text-sm">
                <div className="w-5 h-5 bg-gray-200 rounded-sm"></div> {item}
              </a>
            ))}
          </nav>
        </div>

        <div className="px-6 mt-auto">
          <div className="bg-[#1e293b] rounded-xl p-4 text-white shadow-lg">
            <p className="text-xs text-gray-400 font-medium">Scholarship Goal</p>
            <div className="flex justify-between items-end mt-1 mb-2">
              <span className="text-2xl font-bold">3.85</span>
              <span className="text-xs font-semibold text-indigo-400">92% there</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '92%' }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#f8fafc]">
        
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input type="text" placeholder="Search academics..." className="w-full bg-gray-50 border-none rounded-full pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
              <img src="https://i.pravatar.cc/150?img=47" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="p-8 lg:p-10 max-w-6xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">CGPA Forecast Tool</h1>
            <p className="text-gray-500 mt-2 text-sm font-medium">Plan your academic future with precision. Simulate upcoming semesters and visualize your path to graduation.</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* --- LEFT COLUMN --- */}
            <div className="xl:col-span-1 space-y-6">
              
              <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <h3 className="font-bold text-gray-800">Your Goal</h3>
                </div>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Semester No.</label>
                    <input type="number" min="1" max="15" value={semesterNumber} onChange={(e)=>setSemesterNumber(Number(e.target.value))} className="w-full text-lg font-bold text-indigo-600 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="flex-[2]">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Target CGPA</label>
                    <input type="number" step="0.01" value={targetCgpa} onChange={(e)=>setTargetCgpa(Number(e.target.value))} className="w-full text-lg font-bold text-gray-900 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Current CGPA</label>
                    <input type="number" step="0.01" value={currentCgpa} onChange={(e)=>setCurrentCgpa(Number(e.target.value))} className="w-full text-lg font-bold text-gray-800 bg-transparent outline-none mt-1" />
                  </div>
                  <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Credits Earned</label>
                    <input type="number" value={creditsEarned} onChange={(e)=>setCreditsEarned(Number(e.target.value))} className="w-full text-lg font-bold text-gray-800 bg-transparent outline-none mt-1" />
                  </div>
                </div>
              </div>

              <div className="bg-[#5b51e5] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                  </div>
                  <h3 className="font-bold text-sm tracking-wide">SMART ASSISTANT</h3>
                </div>

                <p className="text-[15px] font-medium leading-relaxed mb-6">
                  To reach your goal of <span className="font-extrabold text-white underline decoration-2 underline-offset-2">{targetCgpa.toFixed(2)}</span>, you need a minimum GPA of <span className="font-extrabold text-white underline decoration-2 underline-offset-2">{simData.requiredGpa.toFixed(2)}</span> in semester {semesterNumber}.
                </p>

                {!simData.isPossible && (
                   <p className="text-xs bg-red-500/80 text-white p-2 rounded mb-4 font-bold">Mathematical Warning: Requires GPA &gt; 4.0</p>
                )}

                <button className="bg-white/20 hover:bg-white/30 transition text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-2">
                  View Calculation <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>
            </div>

            {/* --- RIGHT COLUMN --- */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              
              <div className="bg-white rounded-3xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex-1">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <h3 className="text-lg font-bold text-gray-800">Live Semester Simulator <span className="text-sm font-medium text-indigo-500 bg-indigo-50 px-2 py-1 rounded ml-2">{courses.length}/5 Courses</span></h3>
                  </div>
                  <button 
                    onClick={handleAddCourse}
                    disabled={courses.length >= 5}
                    className="bg-indigo-50 text-indigo-600 font-bold text-xs px-4 py-2 rounded-lg hover:bg-indigo-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    + Add Course
                  </button>
                </div>

                <div className="grid grid-cols-12 text-xs font-bold text-gray-400 tracking-wider mb-3 px-2">
                  <div className="col-span-5 uppercase">Course Name</div>
                  <div className="col-span-2 uppercase text-center">Credits</div>
                  <div className="col-span-3 uppercase text-center">Target Grade</div>
                  <div className="col-span-2 uppercase text-right">Points</div>
                </div>

                <div className="space-y-3 mb-8">
                  {courses.map(course => (
                    <div key={course.id} className="grid grid-cols-12 items-center text-sm font-semibold border-b border-gray-50 pb-3 px-2 transition-all hover:bg-gray-50 rounded-md">
                      <div className="col-span-5">
                        <input 
                          type="text" 
                          value={course.name} 
                          placeholder="e.g. Software Engineering"
                          onChange={(e) => handleUpdateCourse(course.id, 'name', e.target.value)}
                          className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-200 rounded px-1 py-1 outline-none text-gray-800" 
                        />
                      </div>
                      <div className="col-span-2 text-center text-gray-500 flex justify-center">
                        <input 
                          type="number" 
                          step="0.5"
                          min="0"
                          max="6"
                          value={course.credits} 
                          onChange={(e) => handleUpdateCourse(course.id, 'credits', Number(e.target.value))}
                          className="w-16 bg-transparent border border-gray-200 focus:border-indigo-500 rounded outline-none py-1 text-gray-800 text-center" 
                        />
                      </div>
                      <div className="col-span-3 text-center">
                        <select 
                          value={course.grade} 
                          onChange={(e) => handleUpdateCourse(course.id, 'grade', e.target.value)}
                          className="bg-white border border-gray-200 text-gray-700 py-1 px-2 rounded outline-none focus:border-indigo-500 font-bold cursor-pointer"
                        >
                          {Object.keys(gradeWeights).map(g => (
                            <option key={g} value={g}>{g} ({gradeWeights[g].toFixed(1)})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 text-right font-bold text-indigo-600 pr-1">
                        {(course.credits * gradeWeights[course.grade]).toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-end justify-between pt-4 gap-4">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">Simulated Semester GPA</p>
                      <p className="text-2xl font-extrabold text-gray-900">{simData.simulatedGpa.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">Projected Total CGPA</p>
                      <p className={`text-2xl font-extrabold ${simData.projectedCgpa >= targetCgpa ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {simData.projectedCgpa.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-center">
                    {saveStatus && <span className="text-xs font-bold text-indigo-500">{saveStatus}</span>}
                    <button onClick={() => setCourses([])} className="border-2 border-gray-200 text-gray-600 font-bold py-2.5 px-5 rounded-xl text-sm hover:border-gray-300 transition">
                      Clear
                    </button>
                    <button onClick={handleApplyPlanner} disabled={courses.length === 0} className="bg-[#0f172a] hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-md transition disabled:opacity-50">
                      Apply to Planner
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                    <h3 className="text-sm font-bold text-gray-800">Historical Performance vs. Projection</h3>
                  </div>
                  <div className="flex gap-3 text-xs font-bold">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0f172a]"></div> Actual</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#5b51e5]"></div> Projected</div>
                  </div>
                </div>

                <div className="flex items-end justify-between h-32 px-4 border-b-2 border-gray-50 pb-2">
                   {[{l: 'Sem 1', h: '70%'}, {l: 'Sem 2', h: '75%'}, {l: 'Sem 3', h: '80%'}].map(b => (
                     <div key={b.l} className="w-1/6 flex flex-col items-center gap-2">
                       <div className="w-full bg-slate-300 rounded-t flex flex-col justify-end" style={{height: b.h}}>
                          <div className="w-full bg-slate-400/50 rounded-t h-2"></div>
                       </div>
                       <span className="text-[10px] font-semibold text-gray-400">{b.l}</span>
                     </div>
                   ))}
                   
                   <div className="w-1/6 flex flex-col items-center gap-2">
                      <div className="w-full bg-[#0f172a] rounded-t flex flex-col justify-end" style={{height: `${(currentCgpa/4.0)*100}%`}}>
                         <div className="w-full bg-white/10 rounded-t h-2"></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-800">Sem {Math.max(1, semesterNumber - 1)}</span>
                   </div>

                   <div className="w-1/6 flex flex-col items-center gap-2">
                      <div className="w-full bg-[#5b51e5] rounded-t flex flex-col justify-end border-2 border-dashed border-indigo-300" style={{height: `${(targetCgpa/4.0)*100}%`}}></div>
                      <span className="text-[10px] font-bold text-indigo-600">Target (Sem {semesterNumber})</span>
                   </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}