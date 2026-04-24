import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Bell, Plus, X, Trash2, Calendar, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  authorName?: string;
}

export default function Announcements() {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Judul wajib diisi';
    else if (formData.title.trim().length < 5) newErrors.title = 'Judul minimal 5 karakter';
    
    if (!formData.content.trim()) newErrors.content = 'Isi pengumuman wajib diisi';
    else if (formData.content.trim().length < 10) newErrors.content = 'Isi pengumuman minimal 10 karakter';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setFormData({ title: '', content: '' });
      setErrors({});
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus pengumuman ini?')) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
        fetchAnnouncements();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-1">Pengumuman</h2>
          <p className="text-emerald-600 font-medium">Informasi terkini kegiatan dan berita SSB Pro.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setFormData({ title: '', content: '' });
              setErrors({});
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Buat Berita
          </button>
        )}
      </div>

      <div className="space-y-6">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-48 bg-emerald-100 animate-pulse rounded-3xl" />)
        ) : announcements.length > 0 ? announcements.map((item) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={item.id}
            className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-100 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full" />
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                <Bell className="text-emerald-600 w-8 h-8" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-emerald-950 mb-1">{item.title}</h3>
                    <div className="flex items-center gap-4 text-xs font-black text-emerald-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Baru saja'}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> Admin SSB</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-emerald-200 hover:text-rose-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-emerald-900/80 leading-relaxed font-medium whitespace-pre-wrap">
                  {item.content}
                </p>
                <div className="pt-4 flex gap-2">
                   <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                     <MessageSquare className="w-3 h-3" /> Beri Komentar
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-20 bg-emerald-50/50 rounded-3xl border-2 border-dashed border-emerald-200">
            <Bell className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
            <p className="text-emerald-800 font-bold">Belum ada pengumuman untuk saat ini.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden">
              <div className="p-6 border-b border-emerald-50 bg-emerald-50/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-emerald-950 italic">BUAT PENGUMUMAN BARU</h3>
                <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-emerald-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Judul Berita</label>
                  <input 
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-bold text-emerald-950 outline-none ring-2 transition-all ${errors.title ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Libur Latihan Hari Raya"
                  />
                  {errors.title && <p className="text-rose-500 text-xs font-bold">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Isi Pengumuman</label>
                  <textarea 
                    rows={6}
                    className={`w-full bg-emerald-50 border-none rounded-2xl p-4 font-medium text-emerald-950 outline-none ring-2 transition-all ${errors.content ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Tuliskan detail informasi di sini..."
                  />
                  {errors.content && <p className="text-rose-500 text-xs font-bold">{errors.content}</p>}
                </div>
                <button type="submit" className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest">
                  SIARKAN BERITA
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
