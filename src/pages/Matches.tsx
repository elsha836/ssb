import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Trophy, Calendar, MapPin, Plus, X, Trash2, Sword, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Match {
  id: string;
  opponent: string;
  date: string;
  location: string;
  ageCategory: string;
  result?: string;
  status: 'mendatang' | 'selesai';
}

export default function Matches() {
  const { isAdmin } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    opponent: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    ageCategory: 'U-12',
    status: 'mendatang' as const,
    result: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.opponent.trim()) newErrors.opponent = 'Nama lawan wajib diisi';
    else if (formData.opponent.trim().length < 3) newErrors.opponent = 'Nama lawan minimal 3 karakter';
    
    if (!formData.location.trim()) newErrors.location = 'Lokasi wajib diisi';
    else if (formData.location.trim().length < 3) newErrors.location = 'Lokasi minimal 3 karakter';
    
    if (!formData.date) newErrors.date = 'Tanggal wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'matches'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      setMatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await addDoc(collection(db, 'matches'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setErrors({});
      fetchMatches();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus jadwal pertandingan ini?')) {
      try {
        await deleteDoc(doc(db, 'matches', id));
        fetchMatches();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-1">Pertandingan</h2>
          <p className="text-emerald-600 font-medium">Jadwal uji coba dan kompetisi resmi SSB Pro.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setFormData({
                opponent: '',
                date: new Date().toISOString().split('T')[0],
                location: '',
                ageCategory: 'U-12',
                status: 'mendatang',
                result: ''
              });
              setErrors({});
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Trophy className="w-5 h-5" />
            Atur Tanding
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-48 bg-emerald-100 animate-pulse rounded-3xl" />)
        ) : matches.length > 0 ? matches.map((m) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={m.id}
            className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden relative"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-emerald-950 rounded-2xl flex items-center justify-center shadow-lg">
                      <Trophy className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-[10px] font-black text-emerald-900 uppercase">SSB PRO</p>
                 </div>
                 <div className="flex flex-col items-center">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest mb-2">VS</span>
                    <div className="text-2xl font-black text-emerald-950 italic">{m.result || '?:?'}</div>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                      <Sword className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-[10px] font-black text-emerald-900 uppercase truncate max-w-[80px]">{m.opponent}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-emerald-50">
                <div className="flex items-center gap-3 text-emerald-800 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  {m.date}
                </div>
                <div className="flex items-center gap-3 text-emerald-800 font-bold text-sm">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Kategori {m.ageCategory}
                </div>
                <div className="flex items-center gap-3 text-emerald-800 font-bold text-sm col-span-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {m.location}
                </div>
              </div>

              {isAdmin && (
                <button 
                  onClick={() => handleDelete(m.id)}
                  className="absolute top-4 right-4 p-2 text-emerald-200 hover:text-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className={cn(
              "py-2 text-center text-[10px] font-black uppercase tracking-[0.2em]",
              m.status === 'selesai' ? "bg-emerald-600 text-white" : "bg-amber-400 text-amber-950"
            )}>
              {m.status}
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-emerald-200">
             <Trophy className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
             <p className="text-emerald-800 font-bold">Belum ada jadwal pertandingan.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden">
              <div className="p-6 border-b border-emerald-50 bg-emerald-50/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-emerald-950 uppercase italic tracking-tighter">Atur Pertandingan</h3>
                <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-emerald-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Nama Lawan</label>
                  <input 
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-bold outline-none ring-2 transition-all ${errors.opponent ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`} 
                    value={formData.opponent} 
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })} 
                  />
                  {errors.opponent && <p className="text-rose-500 text-xs font-bold">{errors.opponent}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Tanggal</label>
                    <input 
                      type="date" 
                      className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 outline-none ring-2 transition-all ${errors.date ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`} 
                      value={formData.date} 
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                    />
                    {errors.date && <p className="text-rose-500 text-xs font-bold">{errors.date}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Kategori</label>
                    <select className="w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium outline-none border border-transparent focus:border-emerald-500 transition-all text-emerald-950" value={formData.ageCategory} onChange={(e) => setFormData({ ...formData, ageCategory: e.target.value })}>
                      {['U-8', 'U-10', 'U-12', 'U-14', 'U-16'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Lokasi Pertandingan</label>
                  <input 
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-bold outline-none ring-2 transition-all ${errors.location ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`} 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                  />
                  {errors.location && <p className="text-rose-500 text-xs font-bold">{errors.location}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Status</label>
                    <select className="w-full h-12 bg-emerald-50 border-none rounded-xl px-4" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}>
                      <option value="mendatang">Mendatang</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Skor (Opsional)</label>
                    <input className="w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-black" value={formData.result} onChange={(e) => setFormData({ ...formData, result: e.target.value })} placeholder="2 : 1" />
                  </div>
                </div>
                <button type="submit" className="w-full h-16 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest border border-emerald-800">
                  PUBLIKASIKAN JADWAL
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
