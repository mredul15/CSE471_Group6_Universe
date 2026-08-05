'use client';

import { useState } from 'react';

interface ClassRoutine {
  id: string;
  day: string;
  time: string;
  courseCode: string;
  courseName: string;
  room: string;
}

interface AttendanceItem {
  id: string;
  courseCode: string;
  courseName: string;
  totalClasses: number;
  attendedClasses: number;
  faculty: string;
}

const routineData: ClassRoutine[] = [
  { id: '1', day: 'Sunday', time: '09:30 AM - 11:00 AM', courseCode: 'CSE471', courseName: 'System Analysis and Design', room: 'UB2101' },
  { id: '2', day: 'Sunday', time: '11:10 AM - 12:40 PM', courseCode: 'CSE350', courseName: 'Digital Signal Processing', room: 'UB2202' },
  { id: '3', day: 'Monday', time: '02:00 PM - 03:30 PM', courseCode: 'CSE471', courseName: 'System Analysis & Design Lab', room: 'UB405' },
  { id: '4', day: 'Tuesday', time: '09:30 AM - 11:00 AM', courseCode: 'CSE422', courseName: 'Artificial Intelligence', room: 'UB2103' },
  { id: '5', day: 'Wednesday', time: '10:00 AM - 11:30 AM', courseCode: 'CSE482', courseName: 'Internet of Things Lab', room: 'UB408' },
];

const initialAttendance: AttendanceItem[] = [
  { id: '1', courseCode: 'CSE471', courseName: 'System Analysis and Design', totalClasses: 12, attendedClasses: 11, faculty: 'Dr. John Doe' },
  { id: '2', courseCode: 'CSE350', courseName: 'Digital Signal Processing', totalClasses: 11, attendedClasses: 8, faculty: 'Dr. Jane Smith' },
  { id: '3', courseCode: 'CSE422', courseName: 'Artificial Intelligence', totalClasses: 14, attendedClasses: 13, faculty: 'Dr. Alan Turing' },
  { id: '4', courseCode: 'CSE482', courseName: 'Internet of Things Lab', totalClasses: 10, attendedClasses: 9, faculty: 'Dr. Ada Lovelace' },
];

const daysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export default function RoutineAndAttendancePage() {
  const [selectedDay, setSelectedDay] = useState('Sunday');
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>(initialAttendance);

  // অ্যাটেনডেন্স কমানো বা বাড়ানো
  const handleAttendanceChange = (id: string, delta: number) => {
    setAttendanceList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newAttended = item.attendedClasses + delta;
          if (newAttended >= 0 && newAttended <= item.totalClasses) {
            return { ...item, attendedClasses: newAttended };
          }
        }
        return item;
      })
    );
  };

  const handleTotalClassInc = (id: string) => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, totalClasses: item.totalClasses + 1 } : item))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-full uppercase tracking-wider">
            Module 1 - Member 1 Feature
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">Class Routine & Attendance Tracker</h1>
          <p className="text-slate-500 mt-1">
            Manage your weekly course schedules and monitor real-time attendance logs with safety threshold warnings.
          </p>
        </div>

        {/* SECTION 1: Weekly Course Schedules */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">📅 Weekly Course Schedules</h2>
              <p className="text-xs text-slate-500 mt-0.5">Select a day to view your class routines.</p>
            </div>
            
            {/* Days Filter Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {daysList.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3.5 py-1.5 rounded-xl font-medium text-xs transition-all ${
                    selectedDay === day
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Routine List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routineData.filter((item) => item.day === selectedDay).length > 0 ? (
              routineData
                .filter((item) => item.day === selectedDay)
                .map((cls) => (
                  <div key={cls.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                        {cls.courseCode}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{cls.time}</span>
                    </div>
                    <h3 className="font-bold text-slate-800">{cls.courseName}</h3>
                    <p className="text-xs text-slate-500">Room / Location: <span className="font-semibold text-slate-700">{cls.room}</span></p>
                  </div>
                ))
            ) : (
              <div className="col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No classes scheduled for {selectedDay}.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Attendance Logs & Threshold Warnings */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-800">📊 Daily Attendance Logs & Threshold</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time attendance calculations and university threshold (75%) alerts.</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
              ⚠️ Required Threshold: 75%
            </span>
          </div>

          <div className="space-y-4">
            {attendanceList.map((item) => {
              const percentage = item.totalClasses > 0 ? (item.attendedClasses / item.totalClasses) * 100 : 0;
              const isBelowThreshold = percentage < 75;

              return (
                <div key={item.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 font-bold text-xs rounded">
                          {item.courseCode}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${isBelowThreshold ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {percentage.toFixed(1)}% Present
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mt-1.5">{item.courseName}</h3>
                      <p className="text-xs text-slate-500">Faculty: {item.faculty}</p>
                    </div>

                    {/* Interactive Action Controls */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleAttendanceChange(item.id, -1)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                        title="Decrease Attendance"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(item.id, 1)}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
                      >
                        + Attend Class
                      </button>
                      <button
                        onClick={() => handleTotalClassInc(item.id)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 text-xs font-medium rounded-xl hover:bg-slate-100 transition-all"
                        title="Add Total Class"
                      >
                        + Total Class
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Warning Section */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Attended: {item.attendedClasses} / {item.totalClasses} classes</span>
                      <span className={isBelowThreshold ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {isBelowThreshold ? '⚠️ Warning: Below 75% university threshold!' : '✨ Safe Zone (Above 75%)'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isBelowThreshold ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}