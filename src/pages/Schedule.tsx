import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Calendar, Clock, MapPin, Plus, Edit2, Trash2, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Schedule {
  id: string;
  day: string;
  time: string;
  location: string;
  ageCategory: string;
  coachName?: string;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const AGE_CATEGORIES = ['U-8', 'U-10', 'U-12', 'U-14', 'U-16'];

export default function Schedule() {
  const { isAdmin } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    day: 'Senin',
    time: '15:00',
    location: 'Lapangan A',
    ageCategory: 'U-12'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.time) newErrors.time = 'Jam latihan wajib diisi';
    if (!formData.location.trim()) newErrors.location = 'Lokasi wajib diisi';
    else if (formData.location.trim().length < 3) newErrors.location = 'Lokasi minimal 3 karakter';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'schedules'), orderBy('day')));
      setSchedules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Schedule)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editingId) {
        await updateDoc(doc(db, 'schedules', editingId), formData);
      } else {
        await addDoc(collection(db, 'schedules'), formData);
      }
      setShowModal(false);
      setEditingId(null);
      setErrors({});
      fetchSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus jadwal ini?')) {
      try {
        await deleteDoc(doc(db, 'schedules', id));
        fetchSchedules();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-1">Jadwal Latihan</h2>
          <p className="text-emerald-600 font-medium">Informasi waktu dan lokasi latihan rutin.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ day: 'Senin', time: '15:00', location: 'Lapangan A', ageCategory: 'U-12' });
              setErrors({});
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Tambah Jadwal
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {DAYS.map((day) => {
          const daySchedules = schedules.filter(s => s.day === day);
          return (
            <div key={day} className="flex flex-col gap-3">
              <div className="bg-emerald-950 p-4 rounded-2xl shadow-lg">
                <h3 className="text-white font-bold text-center uppercase tracking-widest text-xs">{day}</h3>
              </div>
              <div className="space-y-3">
                {daySchedules.length > 0 ? daySchedules.map((s) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={s.id}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 group relative"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">
                          {s.ageCategory}
                        </span>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => {
                              setEditingId(s.id);
                              setFormData({ day: s.day, time: s.time, location: s.location, ageCategory: s.ageCategory });
                              setErrors({});
                              setShowModal(true);
                            }} className="p-1 text-emerald-400 hover:text-emerald-600">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="p-1 text-emerald-400 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {s.time}
                      </div>
                      <div className="flex items-center gap-2 text-emerald-600/70 font-semibold text-[11px]">
                        <MapPin className="w-3 h-3" />
                        {s.location}
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="p-4 border border-dashed border-emerald-200 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-tighter">Libur</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden">
              <div className="p-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/50">
                <h3 className="text-xl font-bold text-emerald-950">{editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-emerald-100 rounded-xl transition-colors"><X className="w-6 h-6 text-emerald-800" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Hari</label>
                  <select className="w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none" value={formData.day} onChange={(e) => setFormData({ ...formData, day: e.target.value })}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Jam</label>
                  <input 
                    type="time" 
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none ring-2 transition-all ${errors.time ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`} 
                    value={formData.time} 
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })} 
                  />
                  {errors.time && <p className="text-rose-500 text-xs font-bold">{errors.time}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Kategori Umur</label>
                  <select className="w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none" value={formData.ageCategory} onChange={(e) => setFormData({ ...formData, ageCategory: e.target.value })}>
                    {AGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Lokasi / Lapangan</label>
                  <input 
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none ring-2 transition-all ${errors.location ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`} 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                  />
                  {errors.location && <p className="text-rose-500 text-xs font-bold">{errors.location}</p>}
                </div>
                <button type="submit" className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98]">
                  Simpan Jadwal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
