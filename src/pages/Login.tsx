import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        // Create default profile
        // Make Elsha836@gmail.com an admin for convenience in this demo
        const role = result.user.email === 'Elsha836@gmail.com' ? 'admin' : 'parent';
        
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          role: role,
          photoUrl: result.user.photoURL,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      console.error(err);
      setError('Gagal masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg mb-6 transform rotate-3">
            <Trophy className="text-white w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 italic">SSB PRO</h1>
          <p className="text-emerald-400 font-medium">Sistem Manajemen Sekolah Sepak Bola</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              Masuk dengan Google
            </>
          )}
        </button>

        <p className="mt-8 text-center text-xs text-emerald-600/60 uppercase tracking-[0.2em] font-bold">
          © 2026 SSB PRO Management
        </p>
      </motion.div>
    </div>
  );
}
