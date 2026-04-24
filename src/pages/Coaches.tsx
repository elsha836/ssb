import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { UserRound, Plus, Edit2, Trash2, X, Phone, Award, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Coach {
  id: string;
  name: string;
  license: string;
  experience: string;
  contact: string;
  assignedCategories: string[];
}

const AGE_CATEGORIES = ['U-8', 'U-10', 'U-12', 'U-14', 'U-16'];

export default function Coaches() {
  const { isAdmin } = useAuth();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    license: '',
    experience: '',
    contact: '',
    assignedCategories: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nama lengkap wajib diisi';
    else if (formData.name.trim().length < 3) newErrors.name = 'Nama minimal 3 karakter';
    
    if (!formData.license.trim()) newErrors.license = 'Lisensi wajib diisi';
    if (!formData.contact.trim()) newErrors.contact = 'Kontak wajib diisi';
    if (!formData.experience.trim()) newErrors.experience = 'Pengalaman wajib diisi';
    
    if (formData.assignedCategories.length === 0) {
      newErrors.assignedCategories = 'Pilih minimal satu kategori umur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'coaches'));
      setCoaches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (editingId) {
        await updateDoc(doc(db, 'coaches', editingId), formData);
      } else {
        await addDoc(collection(db, 'coaches'), { ...formData, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      setEditingId(null);
      setErrors({});
      fetchCoaches();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCategoryToggle = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      assignedCategories: prev.assignedCategories.includes(cat)
        ? prev.assignedCategories.filter(c => c !== cat)
        : [...prev.assignedCategories, cat]
    }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data pelatih ini?')) {
      try {
        await deleteDoc(doc(db, 'coaches', id));
        fetchCoaches();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-1">Tim Pelatih</h2>
          <p className="text-emerald-600 font-medium">Mentor dan pembina talenta muda SSB Pro.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', license: '', experience: '', contact: '', assignedCategories: [] });
              setErrors({});
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Tambah Pelatih
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-64 bg-emerald-100 animate-pulse rounded-3xl" />)
        ) : coaches.length > 0 ? coaches.map((c) => (
          <motion.div 
            layout
            key={c.id}
            className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden group"
          >
            <div className="bg-emerald-950 h-24 relative overflow-hidden">
               <div className="absolute inset-0 bg-emerald-500/10" />
               <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-400/20 blur-2xl rounded-full" />
            </div>
            <div className="px-6 pb-6 relative">
              <div className="flex items-end justify-between -mt-12 mb-4">
                <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-emerald-600">
                  <UserRound className="w-12 h-12" />
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingId(c.id);
                      setFormData({ ...c });
                      setErrors({});
                      setShowModal(true);
                    }} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-2 bg-emerald-50 text-rose-600 rounded-xl hover:bg-rose-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-emerald-950">{c.name}</h3>
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mt-1">
                    <ShieldCheck className="w-3 h-3" /> Lisensi {c.license}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {c.assignedCategories.map(cat => (
                    <span key={cat} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-emerald-50">
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <Award className="w-4 h-4 text-emerald-400" /> {c.experience}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <Phone className="w-4 h-4 text-emerald-400" /> {c.contact}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-emerald-200">
             <UserRound className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
             <p className="text-emerald-800 font-bold">Belum ada pelatih yang terdaftar.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden">
              <div className="p-6 border-b border-emerald-50 bg-emerald-50/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-emerald-950">{editingId ? 'Edit Data Pelatih' : 'Tambah Pelatih'}</h3>
                <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-emerald-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Nama Lengkap</label>
                  <input 
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-bold outline-none ring-2 transition-all ${errors.name ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`} 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  />
                  {errors.name && <p className="text-rose-500 text-xs font-bold">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Lisensi</label>
                    <input 
                      className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 outline-none ring-2 transition-all ${errors.license ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`} 
                      value={formData.license} 
                      onChange={(e) => setFormData({ ...formData, license: e.target.value })} 
                      placeholder="C / B / A AFC" 
                    />
                    {errors.license && <p className="text-rose-500 text-xs font-bold">{errors.license}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Kontak / WA</label>
                    <input 
                      className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 outline-none ring-2 transition-all ${errors.contact ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`} 
                      value={formData.contact} 
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })} 
                    />
                    {errors.contact && <p className="text-rose-500 text-xs font-bold">{errors.contact}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Pengalaman Singkat</label>
                  <input 
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 outline-none ring-2 transition-all ${errors.experience ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`} 
                    value={formData.experience} 
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })} 
                    placeholder="Ex: Pelatih EPA U-16" 
                  />
                  {errors.experience && <p className="text-rose-500 text-xs font-bold">{errors.experience}</p>}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900 block">Kategori Umur yang Diampu</label>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {AGE_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategoryToggle(cat)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            formData.assignedCategories.includes(cat) ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-emerald-50 text-emerald-400"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    {errors.assignedCategories && <p className="text-rose-500 text-xs font-bold mt-2">{errors.assignedCategories}</p>}
                </div>
                <button type="submit" className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95">
                  SIMPAN DATA PELATIH
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
