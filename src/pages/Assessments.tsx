import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { GraduationCap, TrendingUp, Plus, Search, ChevronRight, Star, Activity, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Student {
  id: string;
  name: string;
  ageCategory: string;
}

interface Assessment {
  id: string;
  studentId: string;
  technique: number;
  physical: number;
  tactics: number;
  notes: string;
  date: string;
}

export default function Assessments() {
  const { isCoach, isAdmin, isParent, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    technique: 70,
    physical: 70,
    tactics: 70,
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.technique < 0 || formData.technique > 100) newErrors.technique = '0-100';
    if (formData.physical < 0 || formData.physical > 100) newErrors.physical = '0-100';
    if (formData.tactics < 0 || formData.tactics > 100) newErrors.tactics = '0-100';
    
    if (!formData.notes.trim()) newErrors.notes = 'Catatan wajib diisi';
    else if (formData.notes.trim().length < 10) newErrors.notes = 'Catatan minimal 10 karakter';
    
    if (!formData.date) newErrors.date = 'Tanggal wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchStudents = async () => {
      let q = collection(db, 'students');
      if (isParent && !isAdmin) {
        q = query(collection(db, 'students'), where('parentId', '==', user?.uid)) as any;
      }
      const snap = await getDocs(q);
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    };
    fetchStudents();
  }, [user, isParent, isAdmin]);

  useEffect(() => {
    if (selectedStudent) {
      const fetchAssessments = async () => {
        const q = query(collection(db, 'assessments'), where('studentId', '==', selectedStudent.id), orderBy('date', 'desc'));
        const snap = await getDocs(q);
        setAssessments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment)));
      };
      fetchAssessments();
    }
  }, [selectedStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !validate()) return;
    try {
      await addDoc(collection(db, 'assessments'), {
        ...formData,
        studentId: selectedStudent.id,
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setErrors({});
      // Refresh
      const q = query(collection(db, 'assessments'), where('studentId', '==', selectedStudent.id), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setAssessments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assessment)));
    } catch (err) {
      console.error(err);
    }
  };

  const radarData = assessments.length > 0 ? [
    { subject: 'Teknik', A: assessments[0].technique, fullMark: 100 },
    { subject: 'Fisik', A: assessments[0].physical, fullMark: 100 },
    { subject: 'Taktik', A: assessments[0].tactics, fullMark: 100 },
  ] : [];

  const trendData = [...assessments].reverse().map(a => ({
    date: a.date,
    Rata: (a.technique + a.physical + a.tactics) / 3
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-1">Penilaian</h2>
          <p className="text-emerald-600 font-medium">Lacak perkembangan talenta siswa.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari siswa..."
            className="w-full h-12 bg-white border border-emerald-100 rounded-2xl pl-12 pr-4 font-medium text-emerald-950 outline-none shadow-sm focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-2 max-h-[60vh] overflow-y-auto">
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStudent(s)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200",
                selectedStudent?.id === s.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "hover:bg-emerald-50 text-emerald-950"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold", selectedStudent?.id === s.id ? "bg-emerald-500" : "bg-emerald-100 text-emerald-600")}>
                  {s.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm truncate">{s.name}</p>
                  <p className={cn("text-[10px] font-black uppercase", selectedStudent?.id === s.id ? "text-emerald-200" : "text-emerald-400")}>{s.ageCategory}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedStudent ? (
          <div className="space-y-8">
            <div className="bg-emerald-950 p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-emerald-800 rounded-3xl border-4 border-emerald-700 flex items-center justify-center text-4xl font-black text-emerald-400">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1 italic uppercase tracking-tight">{selectedStudent.name}</h2>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-lg uppercase tracking-widest">{selectedStudent.ageCategory}</span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-black rounded-lg uppercase tracking-widest">Peringkat A</span>
                    </div>
                  </div>
                </div>
                {(isCoach || isAdmin) && (
                  <button 
                    onClick={() => {
                      setFormData({
                        technique: 70,
                        physical: 70,
                        tactics: 70,
                        notes: '',
                        date: new Date().toISOString().split('T')[0]
                      });
                      setErrors({});
                      setShowModal(true);
                    }}
                    className="h-14 px-8 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                  >
                    <Plus className="w-5 h-5" /> Input Nilai
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm">
                <h3 className="text-xl font-bold text-emerald-950 mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> Analisis Terkini
                </h3>
                <div className="h-64">
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#ecfdf5" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#064e3b', fontSize: 12, fontWeight: 700 }} />
                        <Radar name="Skor" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-emerald-200 font-bold uppercase tracking-widest text-xs">Belum ada data</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm">
                <h3 className="text-xl font-bold text-emerald-950 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" /> Tren Perkembangan
                </h3>
                <div className="h-64">
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#064e3b', fontSize: 10 }} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="Rata" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-emerald-200 font-bold uppercase tracking-widest text-xs">Belum ada data</div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-emerald-950">Catatan Pelatih</h3>
              {assessments.map((a) => (
                <div key={a.id} className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">{a.date}</span>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-emerald-900 uppercase">Teknik</p>
                        <p className="text-lg font-bold text-emerald-600">{a.technique}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-emerald-900 uppercase">Fisik</p>
                        <p className="text-lg font-bold text-emerald-500">{a.physical}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-emerald-900 uppercase">Taktik</p>
                        <p className="text-lg font-bold text-emerald-400">{a.tactics}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-emerald-950/70 leading-relaxed italic border-l-4 border-emerald-500 pl-4 bg-emerald-50/50 py-3 rounded-r-xl">
                    "{a.notes}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-20 bg-emerald-950/5 rounded-3xl border-2 border-dashed border-emerald-200">
            <GraduationCap className="w-16 h-16 text-emerald-200 mb-4" />
            <p className="text-emerald-800 font-bold">Pilih siswa untuk melihat performa</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-emerald-50 bg-emerald-50/50">
                <h3 className="text-xl font-bold text-emerald-950 italic">PENILAIAN BARU: {selectedStudent?.name}</h3>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: 'Teknik', key: 'technique', icon: Star, color: 'text-amber-500' },
                    { label: 'Fisik', key: 'physical', icon: Activity, color: 'text-rose-500' },
                    { label: 'Taktik', key: 'tactics', icon: Brain, color: 'text-blue-500' },
                  ].map((item) => (
                    <div key={item.key} className="space-y-4 text-center">
                      <div className={cn("mx-auto w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50", item.color)}>
                        <item.icon className="w-6 h-6" />
                      </div>
                       <label className="text-xs font-black uppercase tracking-widest block">{item.label}</label>
                      <input 
                        type="number" min="0" max="100"
                        className={`w-full h-14 bg-emerald-50 border-none rounded-2xl text-center text-2xl font-black text-emerald-950 outline-none ring-2 transition-all ${errors[item.key] ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`}
                        value={(formData as any)[item.key]}
                        onChange={(e) => setFormData({ ...formData, [item.key]: parseInt(e.target.value) || 0 })}
                      />
                      {errors[item.key] && <p className="text-rose-500 text-[10px] font-black">{errors[item.key]}</p>}
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-emerald-900">Catatan Pekembangan</label>
                  <textarea 
                    rows={4}
                    placeholder="Contoh: Sangat baik dalam penguasaan bola, perlu peningkatan akselerasi..."
                    className={`w-full bg-emerald-50 border-none rounded-2xl p-4 font-medium text-emerald-950 outline-none placeholder:text-emerald-200 ring-2 transition-all ${errors.notes ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                  {errors.notes && <p className="text-rose-500 text-xs font-bold">{errors.notes}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-emerald-900">Tanggal Penilaian</label>
                  <input 
                    type="date"
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none ring-2 transition-all ${errors.date ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                  {errors.date && <p className="text-rose-500 text-xs font-bold">{errors.date}</p>}
                </div>

                <button type="submit" className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 uppercase tracking-[0.1em]">
                  Simpan Penilaian
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
