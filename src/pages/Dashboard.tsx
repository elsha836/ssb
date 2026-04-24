import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, UserRound, Calendar, CreditCard, Bell, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 flex items-center gap-4"
  >
    <div className={cn("p-4 rounded-2xl", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> {trend}
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    coaches: 0,
    attendanceRate: '0%',
    pendingPayments: 0,
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentSnap = await getDocs(collection(db, 'students'));
        const coachSnap = await getDocs(collection(db, 'coaches'));
        const announcementSnap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3)));
        
        setStats({
          students: studentSnap.size,
          coaches: coachSnap.size,
          attendanceRate: '85%', // Mocked for now
          pendingPayments: 12, // Mocked for now
        });
        setAnnouncements(announcementSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const chartData = [
    { name: 'Jan', value: 45 },
    { name: 'Feb', value: 52 },
    { name: 'Mar', value: 48 },
    { name: 'Apr', value: 61 },
    { name: 'Mei', value: 55 },
    { name: 'Jun', value: 67 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-emerald-950 mb-1">Beranda</h2>
        <p className="text-emerald-600 font-medium">Selamat datang di panel kontrol SSB Pro.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Siswa" value={stats.students} trend="+12%" color="bg-emerald-500" />
        <StatCard icon={UserRound} label="Pelatih Aktif" value={stats.coaches} color="bg-blue-500" />
        <StatCard icon={Calendar} label="Kehadiran" value={stats.attendanceRate} trend="+5%" color="bg-amber-500" />
        <StatCard icon={CreditCard} label="Tagihan" value={stats.pendingPayments} color="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900">Statistik Kehadiran</h3>
            <select className="bg-emerald-50 border-none rounded-xl px-4 py-2 text-sm font-semibold text-emerald-700 outline-none">
              <option>6 Bulan Terakhir</option>
              <option>12 Bulan Terakhir</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecfdf5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#065f46', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#065f46', fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: '#f0fdf4' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-emerald-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Pengumuman</h3>
              <Bell className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="space-y-4">
              {announcements.length > 0 ? announcements.map((item: any) => (
                <div key={item.id} className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <h4 className="font-bold text-emerald-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-emerald-700 line-clamp-2">{item.content}</p>
                </div>
              )) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-emerald-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Belum ada pengumuman</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-950 p-8 rounded-3xl shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full" />
            <h3 className="text-emerald-400 font-bold mb-2 uppercase tracking-widest text-xs">Target Musim Ini</h3>
            <p className="text-white text-2xl font-bold mb-6">Juara Liga Remaja U-12!</p>
            <div className="w-full bg-emerald-900 h-2 rounded-full mb-2 overflow-hidden">
              <div className="bg-emerald-400 h-full w-3/4 rounded-full" />
            </div>
            <p className="text-emerald-500 text-sm font-semibold tracking-wide">Progress: 75% Kompetisi</p>
          </div>
        </div>
      </div>
    </div>
  );
}
