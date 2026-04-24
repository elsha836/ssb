import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { ClipboardCheck, Calendar, Search, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface Student {
  id: string;
  name: string;
  ageCategory: string;
}

interface Schedule {
  id: string;
  day: string;
  time: string;
  ageCategory: string;
}

export default function Attendance() {
  const { isCoach, isAdmin } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSchedules = async () => {
      const snap = await getDocs(collection(db, 'schedules'));
      setSchedules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule)));
    };
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (selectedSchedule) {
      const fetchStudentsAndAttendance = async () => {
        setLoading(true);
        try {
          const schedule = schedules.find(s => s.id === selectedSchedule);
          if (!schedule) return;

          const q = query(collection(db, 'students'), where('ageCategory', '==', schedule.ageCategory));
          const studentSnap = await getDocs(q);
          const studentList = studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
          setStudents(studentList);

          // Fetch existing attendance
          const attMap: Record<string, string> = {};
          for (const s of studentList) {
            const attId = `${s.id}_${selectedSchedule}_${selectedDate}`;
            const attSnap = await getDoc(doc(db, 'attendance', attId));
            if (attSnap.exists()) {
              attMap[s.id] = attSnap.data().status;
            }
          }
          setAttendanceData(attMap);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchStudentsAndAttendance();
    }
  }, [selectedSchedule, selectedDate]);

  const handleStatusChange = async (studentId: string, status: string) => {
    if (!isCoach && !isAdmin) return;
    
    const attId = `${studentId}_${selectedSchedule}_${selectedDate}`;
    try {
      await setDoc(doc(db, 'attendance', attId), {
        studentId,
        scheduleId: selectedSchedule,
        date: selectedDate,
        status,
        updatedAt: new Date(),
      });
      setAttendanceData(prev => ({ ...prev, [studentId]: status }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-emerald-950 mb-1">Presensi Latihan</h2>
        <p className="text-emerald-600 font-medium">Catat kehadiran siswa untuk memantau kedisiplinan.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-emerald-900 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Tanggal
          </label>
          <input 
            type="date" 
            className="w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-emerald-900 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pilih Jadwal
          </label>
          <select 
            className="w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none"
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
          >
            <option value="">-- Pilih Sesi Latihan --</option>
            {schedules.map(s => (
              <option key={s.id} value={s.id}>{s.day} - {s.time} ({s.ageCategory})</option>
            ))}
          </select>
        </div>
      </div>

      {selectedSchedule ? (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-emerald-900 uppercase tracking-widest">Siswa</th>
                <th className="px-6 py-4 text-center text-xs font-black text-emerald-900 uppercase tracking-widest">Status Presensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-emerald-300">Memuat data siswa...</td>
                </tr>
              ) : students.length > 0 ? students.map((s) => (
                <tr key={s.id} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 font-bold rounded-lg flex items-center justify-center">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-emerald-950">{s.name}</p>
                        <p className="text-[10px] font-black text-emerald-500 uppercase">{s.ageCategory}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {[
                        { label: 'Hadir', value: 'hadir', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100' },
                        { label: 'Izin', value: 'izin', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-100' },
                        { label: 'Sakit', value: 'sakit', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
                        { label: 'Alfa', value: 'alfa', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-100' },
                      ].map((item) => {
                        const active = attendanceData[s.id] === item.value;
                        return (
                          <button
                            key={item.value}
                            onClick={() => handleStatusChange(s.id, item.value)}
                            className={cn(
                              "flex flex-col items-center p-2 rounded-xl border transition-all duration-200 min-w-[64px]",
                              active ? `${item.bg} border-transparent shadow-sm scale-105` : "border-emerald-50 hover:bg-gray-50 bg-white"
                            )}
                          >
                            <item.icon className={cn("w-5 h-5 mb-1", active ? item.color : "text-gray-300")} />
                            <span className={cn("text-[10px] font-bold", active ? item.color : "text-gray-400")}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center">
                    <Search className="w-12 h-12 text-emerald-100 mx-auto mb-2" />
                    <p className="text-emerald-300 font-bold uppercase tracking-widest text-xs">Tidak ada siswa di kategori ini</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-emerald-950/5 rounded-3xl border-2 border-dashed border-emerald-200">
          <Calendar className="w-16 h-16 text-emerald-200 mb-4" />
          <p className="text-emerald-800 font-bold">Pilih jadwal latihan terlebih dahulu</p>
        </div>
      )}
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
