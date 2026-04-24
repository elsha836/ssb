import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, addDoc, updateDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { CreditCard, Search, Plus, Filter, CheckCircle2, AlertCircle, X, Download, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Student {
  id: string;
  name: string;
  ageCategory: string;
}

interface Payment {
  id: string;
  studentId: string;
  studentName?: string;
  amount: number;
  month: string;
  year: number;
  status: 'lunas' | 'belum';
  date?: string;
  createdAt: any;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function Payments() {
  const { isAdmin, isParent, user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    amount: 150000,
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear(),
    status: 'lunas' as const
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.studentId) newErrors.studentId = 'Pilih siswa terlebih dahulu';
    if (!formData.amount || formData.amount < 10000) newErrors.amount = 'Minimal Rp 10.000';
    if (!formData.year || formData.year < 2000 || formData.year > 2100) newErrors.year = 'Tahun tidak valid';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const studentSnap = await getDocs(collection(db, 'students'));
      const studentMap: Record<string, string> = {};
      const studentList: Student[] = [];
      studentSnap.docs.forEach(doc => {
        studentMap[doc.id] = doc.data().name;
        studentList.push({ id: doc.id, ...doc.data() } as Student);
      });
      setStudents(studentList);

      let q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
      if (isParent && !isAdmin) {
        // This is complex because we need to filter by students owned by this parent
        // For simplicity in this demo, we'll fetch all and filter in JS if many students, 
        // but for security we already have firestore rules.
        const myStudents = studentList.filter(s => (s as any).parentId === user?.uid).map(s => s.id);
        if (myStudents.length > 0) {
          q = query(collection(db, 'payments'), where('studentId', 'in', myStudents)) as any;
        } else {
          setPayments([]);
          return;
        }
      }

      const snap = await getDocs(q);
      setPayments(snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        studentName: studentMap[doc.data().studentId] || 'Siswa Dihapus' 
      } as Payment)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user, isParent, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await addDoc(collection(db, 'payments'), {
        ...formData,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setErrors({});
      fetchPayments();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = payments.filter(p => p.studentName?.toLowerCase().includes(search.toLowerCase()));
  const totalRevenue = payments.reduce((acc, curr) => acc + (curr.status === 'lunas' ? curr.amount : 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-1">Administrasi SPP</h2>
          <p className="text-emerald-600 font-medium">Manajemen iuran bulanan dan operasional SSB.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setFormData({
                studentId: '',
                amount: 150000,
                month: MONTHS[new Date().getMonth()],
                year: new Date().getFullYear(),
                status: 'lunas'
              });
              setErrors({});
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Catat Pembayaran
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-950 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-1">Total Pendapatan</p>
            <h3 className="text-3xl font-black text-white italic">Rp {totalRevenue.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-2 text-emerald-500 text-xs font-bold">
              <TrendingUp className="w-4 h-4" /> +8.5% dari bulan lalu
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Belum Bayar</p>
              <h3 className="text-xl font-bold text-gray-900">12 Siswa</h3>
            </div>
          </div>
          <button className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center gap-4 hover:bg-emerald-50 transition-colors">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Download className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Laporan Bulanan</p>
              <h4 className="text-sm font-bold text-emerald-900 underline">Unduh PDF/Excel</h4>
            </div>
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
        <Search className="w-5 h-5 text-emerald-400 ml-2" />
        <input 
          type="text" 
          placeholder="Cari nama siswa..."
          className="flex-1 bg-transparent border-none outline-none text-emerald-950 font-medium placeholder:text-emerald-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-emerald-900 uppercase tracking-widest">Siswa</th>
                <th className="px-6 py-4 text-left text-xs font-black text-emerald-900 uppercase tracking-widest">Bulan / Tahun</th>
                <th className="px-6 py-4 text-right text-xs font-black text-emerald-900 uppercase tracking-widest">Jumlah</th>
                <th className="px-6 py-4 text-center text-xs font-black text-emerald-900 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-xs font-black text-emerald-900 uppercase tracking-widest">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-emerald-300">Memuat transaksi...</td></tr>
              ) : filtered.length > 0 ? filtered.map((p) => (
                <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-emerald-950">{p.studentName}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">#{p.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-800">
                    {p.month} {p.year}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-emerald-950">
                    Rp {p.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                        p.status === 'lunas' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {p.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                    {p.date || '-'}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-emerald-300">Belum ada catatan pembayaran</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden">
              <div className="p-6 border-b border-emerald-50 bg-emerald-50/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-emerald-950">Input Pembayaran SPP</h3>
                <button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-emerald-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Pilih Siswa</label>
                  <select 
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium outline-none ring-2 transition-all ${errors.studentId ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`}
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  >
                    <option value="">-- Cari Siswa --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.ageCategory})</option>)}
                  </select>
                  {errors.studentId && <p className="text-rose-500 text-xs font-bold">{errors.studentId}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Bulan</label>
                    <select 
                      className="w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium outline-none border border-transparent focus:border-emerald-500 transition-all"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Tahun</label>
                    <input 
                      type="number"
                      className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium outline-none ring-2 transition-all ${errors.year ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`}
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    />
                    {errors.year && <p className="text-rose-500 text-xs font-bold">{errors.year}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-900">Jumlah (Rp)</label>
                  <input 
                    type="number"
                    className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-black text-xl outline-none ring-2 transition-all ${errors.amount ? 'ring-rose-500' : 'ring-transparent focus:ring-emerald-500'}`}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                  />
                  {errors.amount && <p className="text-rose-500 text-xs font-bold">{errors.amount}</p>}
                </div>
                <button type="submit" className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95">
                  KONFIRMASI PEMBAYARAN
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
