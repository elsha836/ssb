import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, where, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { Search, Plus, UserPlus, Filter, MoreVertical, Edit2, Trash2, X, MapPin, Calendar, Smartphone, Trophy, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Student {
  id: string;
  name: string;
  dob: string;
  ageCategory: string;
  position: string;
  address: string;
  parentId: string;
  photoUrl?: string;
}

const AGE_CATEGORIES = ['U-8', 'U-10', 'U-12', 'U-14', 'U-16'];
const POSITIONS = ['Kiper', 'Bek', 'Gelandang', 'Penyerang'];

export default function Students() {
  const { isAdmin, isParent, user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    ageCategory: 'U-12',
    position: 'Gelandang',
    address: '',
    parentId: user?.uid || '',
    photoUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama minimal 3 karakter';
    }

    if (!formData.dob) {
      newErrors.dob = 'Tanggal lahir wajib diisi';
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dob = 'Tanggal lahir tidak boleh di masa depan';
      } else {
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age > 25) {
          newErrors.dob = 'Umur maksimal siswa adalah 25 tahun';
        } else if (age < 5) {
          newErrors.dob = 'Umur minimal siswa adalah 5 tahun';
        }
      }
    }

    if (!formData.ageCategory) {
      newErrors.ageCategory = 'Kategori umur wajib dipilih';
    }

    if (!formData.position) {
      newErrors.position = 'Posisi pemain wajib dipilih';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Alamat lengkap wajib diisi';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Alamat minimal 10 karakter untuk kejelasan';
    }

    if (!formData.photoUrl && !imageFile) {
      newErrors.photo = 'Foto siswa wajib diunggah';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let q = collection(db, 'students');
      // If parent, only show their children
      if (isParent && !isAdmin) {
        q = query(collection(db, 'students'), where('parentId', '==', user?.uid)) as any;
      }
      const snap = await getDocs(q);
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user, isParent, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setUploading(true);
    try {
      let finalPhotoUrl = formData.photoUrl;

      if (imageFile) {
        const fileRef = ref(storage, `students/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(fileRef, imageFile);
        finalPhotoUrl = await getDownloadURL(uploadResult.ref);
      }

      const dataToSave = {
        ...formData,
        photoUrl: finalPhotoUrl,
      };

      if (editingId) {
        await updateDoc(doc(db, 'students', editingId), { ...dataToSave, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'students'), { ...dataToSave, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      setEditingId(null);
      setImageFile(null);
      setPreviewUrl(null);
      setFormData({ name: '', dob: '', ageCategory: 'U-12', position: 'Gelandang', address: '', parentId: user?.uid || '', photoUrl: '' });
      fetchStudents();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (s: Student) => {
    setFormData({
      name: s.name,
      dob: s.dob,
      ageCategory: s.ageCategory,
      position: s.position,
      address: s.address,
      parentId: s.parentId,
      photoUrl: s.photoUrl || '',
    });
    setPreviewUrl(s.photoUrl || null);
    setImageFile(null);
    setErrors({});
    setEditingId(s.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data siswa ini?')) {
      try {
        await deleteDoc(doc(db, 'students', id));
        fetchStudents();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.ageCategory.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-emerald-950 mb-1">Daftar Siswa</h2>
          <p className="text-emerald-600 font-medium">Manajemen data talenta muda SSB Pro.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', dob: '', ageCategory: 'U-12', position: 'Gelandang', address: '', parentId: user?.uid || '', photoUrl: '' });
            setPreviewUrl(null);
            setImageFile(null);
            setErrors({});
            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Tambah Siswa
        </button>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
        <Search className="w-5 h-5 text-emerald-400 ml-2" />
        <input 
          type="text" 
          placeholder="Cari nama atau kategori umur..."
          className="flex-1 bg-transparent border-none outline-none text-emerald-950 font-medium placeholder:text-emerald-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 bg-emerald-100 animate-pulse rounded-3xl" />)
        ) : filtered.length > 0 ? filtered.map((s, index) => (
          <motion.div 
            layout
            key={s.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ 
              duration: 0.4,
              delay: Math.min(index * 0.05, 0.3),
              type: "spring",
              stiffness: 100
            }}
            className="group bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden hover:border-emerald-300 transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 text-2xl font-black shadow-inner overflow-hidden">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      s.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-emerald-950 leading-tight">{s.name}</h3>
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full mt-1">
                      {s.ageCategory}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(s)} className="p-2 text-emerald-400 hover:text-emerald-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-emerald-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-emerald-700/70 text-sm font-medium">
                  <Calendar className="w-4 h-4" />
                  {s.dob}
                </div>
                <div className="flex items-center gap-3 text-emerald-700/70 text-sm font-medium">
                  <Trophy className="w-4 h-4" />
                  Posisi: {s.position}
                </div>
                <div className="flex items-center gap-3 text-emerald-700/70 text-sm font-medium">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{s.address}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">ID: {s.id.slice(0, 8)}</span>
              <button className="text-sm font-bold text-emerald-600 hover:text-emerald-500">Detail Performa →</button>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-emerald-100 border-dashed">
            <UserPlus className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-900">Belum ada siswa</h3>
            <p className="text-emerald-500">Mulai tambahkan siswa baru untuk mengelola data.</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/50">
                <h3 className="text-xl font-bold text-emerald-950">{editingId ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-emerald-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-emerald-800" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative group">
                    <div className={cn(
                      "w-28 h-28 bg-emerald-50 rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-400",
                      errors.photo ? "border-red-500 bg-red-50" : "border-emerald-200"
                    )}>
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className={cn("w-10 h-10", errors.photo ? "text-red-300" : "text-emerald-200")} />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-emerald-500 transition-all active:scale-95">
                      <Camera className="w-5 h-5" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                  {errors.photo && <p className="text-red-500 text-xs font-bold">{errors.photo}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Nama Lengkap</label>
                    <input 
                      className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none ring-2 transition-all ${errors.name ? 'ring-red-500' : 'ring-transparent focus:ring-emerald-500'}`}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {errors.name && <p className="text-red-500 text-xs font-bold">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Tanggal Lahir</label>
                    <input 
                      type="date"
                      className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none ring-2 transition-all ${errors.dob ? 'ring-red-500' : 'ring-transparent focus:ring-emerald-500'}`}
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                    {errors.dob && <p className="text-red-500 text-xs font-bold">{errors.dob}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Kategori Umur</label>
                    <select 
                      className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none ring-2 transition-all ${errors.ageCategory ? 'ring-red-500' : 'ring-transparent focus:ring-emerald-500'}`}
                      value={formData.ageCategory}
                      onChange={(e) => setFormData({ ...formData, ageCategory: e.target.value })}
                    >
                      <option value="">Pilih Kategori</option>
                      {AGE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {errors.ageCategory && <p className="text-red-500 text-xs font-bold">{errors.ageCategory}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-emerald-900">Posisi Bermain</label>
                    <select 
                      className={`w-full h-12 bg-emerald-50 border-none rounded-xl px-4 font-medium text-emerald-950 outline-none ring-2 transition-all ${errors.position ? 'ring-red-500' : 'ring-transparent focus:ring-emerald-500'}`}
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    >
                      <option value="">Pilih Posisi</option>
                      {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                    {errors.position && <p className="text-red-500 text-xs font-bold">{errors.position}</p>}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-emerald-900">Alamat</label>
                    <textarea 
                      rows={3}
                      className={`w-full bg-emerald-50 border-none rounded-xl p-4 font-medium text-emerald-950 outline-none ring-2 transition-all ${errors.address ? 'ring-red-500' : 'ring-transparent focus:ring-emerald-500'}`}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    {errors.address && <p className="text-red-500 text-xs font-bold">{errors.address}</p>}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-300 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {uploading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {uploading ? 'Memproses...' : (editingId ? 'Simpan Perubahan' : 'Daftarkan Siswa')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
