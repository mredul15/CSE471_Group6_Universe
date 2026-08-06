"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getCGPAData, saveSemesterGrades, saveAcademicGoal } from '../actions/cgpa';

const gradeWeights: Record<string, number> = {
  'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
};

interface CourseItem {
  id: string;
  code: string;
  title: string;
  section: string;
  credits: number;
  semesterNumber: number;
  grade?: string | null;
}

export default function CGPACalculator() {
  const [semesterNumber, setSemesterNumber] = useState<number>(1);
  const [targetCgpa, setTargetCgpa] = useState<number>(3.65);
  const [currentCgpa, setCurrentCgpa] = useState<number>(3.50);
  const [creditsEarned, setCreditsEarned] = useState<number>(90.0);
  
  const [dbCourses, setDbCourses] = useState<CourseItem[]>([]);
  const [simCourses, setSimCourses] = useState<{ id: string; name: string; credits: number; grade: string }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [gradeSheetStatus, setGradeSheetStatus] = useState<string>("");

  const loadData = async () => {
    const res = await getCGPAData();
    if (res.success && res.courses) {
      setDbCourses(res.courses as CourseItem[]);
      if (res.user) {
        setCurrentCgpa(res.user.currentCgpa);
        setSemesterNumber(res.user.semester);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter courses by selected semester for the grade sheet & simulator
  const activeSemesterCourses = useMemo(() => {
    return dbCourses.filter(c => c.semesterNumber === semesterNumber);
  }, [dbCourses, semesterNumber]);

  // Sync active courses into simulator when semester changes
  useEffect(() => {
    if (activeSemesterCourses.length > 0) {
      setSimCourses(activeSemesterCourses.map(c => ({
        id: c.id,
        name: `${c.code} - ${c.title}`,
        credits: c.credits,
        grade: c.grade || 'A'
      })));
    } else {
      setSimCourses([
        { id: '1', name: 'Sample Course 1', credits: 3.0, grade: 'A' },
        { id: '2', name: 'Sample Course 2', credits: 3.0, grade: 'A-' }
      ]);
    }
  }, [activeSemesterCourses, semesterNumber]);

  const simData = useMemo(() => {
    const simCredits = simCourses.reduce((acc, curr) => acc + curr.credits, 0);
    const simPoints = simCourses.reduce((acc, curr) => acc + (curr.credits * gradeWeights[curr.grade]), 0);
    const simulatedGpa = simCredits > 0 ? simPoints / simCredits : 0;
    
    const totalCurrentPoints = currentCgpa * creditsEarned;
    const projectedCgpa = (creditsEarned + simCredits) > 0 
      ? (totalCurrentPoints + simPoints) / (creditsEarned + simCredits) 
      : currentCgpa;

    const requiredTotalPoints = targetCgpa * (creditsEarned + simCredits);
    const requiredSimPoints = requiredTotalPoints - totalCurrentPoints;
    const requiredGpa = simCredits > 0 ? requiredSimPoints / simCredits : 0;
    const isPossible = requiredGpa <= 4.0;

    return { simCredits, simulatedGpa, projectedCgpa, requiredGpa, isPossible };
  }, [simCourses, currentCgpa, creditsEarned, targetCgpa]);

  const handleUpdateGrade = (id: string, grade: string) => {
    setSimCourses(simCourses.map(c => c.id === id ? { ...c, grade } : c));
  };

  const handleSaveGradeSheet = async () => {
    setGradeSheetStatus("Saving to Grade Sheet...");
    const gradesToSave = simCourses
      .filter(c => !c.id.startsWith('1') && !c.id.startsWith('2')) // Filter out placeholder samples
      .map(c => ({ id: c.id, grade: c.grade }));

    if (gradesToSave.length === 0) {
      setGradeSheetStatus("No enrolled DB courses to save for this semester.");
      setTimeout(() => setGradeSheetStatus(""), 3000);
      return;
    }

    const res = await saveSemesterGrades(gradesToSave);
    setGradeSheetStatus(res.message);
    loadData();
    setTimeout(() => setGradeSheetStatus(""), 4000);
  };

  const handleApplyPlanner = async () => {
    setSaveStatus("Saving goal...");
    const res = await saveAcademicGoal({
      semesterNumber,
      currentCgpa,
      completedCredits: creditsEarned,
      targetCgpa,
      upcomingCredits: simData.simCredits,
      requiredGpa: simData.requiredGpa,
      isPossible: simData.isPossible,
      courses: simCourses.map(c => ({ name: c.name, credits: c.credits, targetGrade: c.grade }))
    });
    setSaveStatus(res.message);
    setTimeout(() => setSaveStatus(""), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-sans">
        <p className="text-gray-500 font-bold text-sm">Loading CGPA Forecast & Grade Sheet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0f172a] tracking-tight">CGPA Forecast & Grade Sheet</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">Enrolled courses from Attendance Tracker auto-populate here.</p>
          </div>
          <Link href="/dashboard" className="bg-indigo-50 text-indigo-600 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Current Academic Standing
              </h3>
              
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Current CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentCgpa}
                  onChange={(e) => setCurrentCgpa(Number(e.target.value))}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Completed Credits</label>
                <input
                  type="number"
                  value={creditsEarned}
                  onChange={(e) => setCreditsEarned(Number(e.target.value))}
                  className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="border-t border-gray-100 pt-4"></div>

              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Semester Goal Target
              </h3>

              <div className="flex gap-3">
                <div className="w-1/3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Semester</label>
                  <input
                    type="number"
                    value={semesterNumber}
                    onChange={(e) => setSemesterNumber(Number(e.target.value))}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="w-2/3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Target CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetCgpa}
                    onChange={(e) => setTargetCgpa(Number(e.target.value))}
                    className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 font-bold text-sm text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Smart Assistant Card */}
            <div className="bg-[#5b51e5] rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
              <h3 className="font-bold text-xs tracking-wider mb-3">SMART CGPA ASSISTANT</h3>
              <p className="text-sm font-medium leading-relaxed mb-3">
                To achieve a target CGPA of <span className="font-black bg-white/20 px-2 py-0.5 rounded">{targetCgpa.toFixed(2)}</span>, you need a minimum GPA of <span className="font-black bg-white/20 px-2 py-0.5 rounded">{simData.requiredGpa.toFixed(2)}</span> in Semester {semesterNumber}.
              </p>
              {!simData.isPossible && (
                <p className="text-xs bg-red-500 text-white p-2.5 rounded-xl font-bold border border-red-400">
                  Target mathematically unachievable (&gt; 4.0 GPA required).
                </p>
              )}
            </div>
          </div>

          {/* Semester Simulator & Grade Sheet */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Semester {semesterNumber} Courses & Grade Sheet</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Auto-synced from your Attendance Tracker enrolled courses.</p>
                </div>
                <button
                  onClick={handleSaveGradeSheet}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
                >
                  Save to Grade Sheet
                </button>
              </div>

              {gradeSheetStatus && (
                <p className="text-xs font-bold text-emerald-600 mb-4 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center">
                  {gradeSheetStatus}
                </p>
              )}

              <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                <div className="col-span-6">Course</div>
                <div className="col-span-2 text-center">Credits</div>
                <div className="col-span-4 text-center">Grade</div>
              </div>

              <div className="space-y-2 mb-6">
                {simCourses.map((course) => (
                  <div key={course.id} className="grid grid-cols-12 items-center text-xs font-semibold border border-gray-100 p-3 rounded-2xl bg-gray-50/50">
                    <div className="col-span-6">
                      <span className="font-bold text-gray-800">{course.name}</span>
                    </div>
                    <div className="col-span-2 text-center font-bold text-gray-600">
                      {course.credits}
                    </div>
                    <div className="col-span-4 text-center">
                      <select
                        value={course.grade}
                        onChange={(e) => handleUpdateGrade(course.id, e.target.value)}
                        className="bg-white border border-gray-200 text-gray-800 py-1.5 px-3 rounded-xl outline-none focus:border-indigo-500 font-extrabold text-xs shadow-sm"
                      >
                        {Object.keys(gradeWeights).map(g => (
                          <option key={g} value={g}>{g} ({gradeWeights[g].toFixed(1)})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Results Card */}
            <div className="bg-gray-50 rounded-2xl p-6 flex flex-wrap items-center justify-between border border-gray-100 gap-4">
              <div className="flex gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Simulated GPA</p>
                  <p className="text-2xl font-black text-gray-900 mt-0.5">{simData.simulatedGpa.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Projected CGPA</p>
                  <p className={`text-2xl font-black mt-0.5 ${simData.projectedCgpa >= targetCgpa ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {simData.projectedCgpa.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={handleApplyPlanner}
                  className="bg-[#0f172a] hover:bg-gray-800 text-white font-bold py-3 px-5 rounded-xl text-xs shadow-sm transition"
                >
                  Save Academic Goal
                </button>
                {saveStatus && <span className="text-[11px] font-bold text-indigo-600">{saveStatus}</span>}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}