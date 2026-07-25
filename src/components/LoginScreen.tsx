import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext.tsx';
import { LineChart, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';

export default function LoginScreen() {
  const { signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your name');
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117] text-[#e6edf3] p-4">
      <div className="bg-[#161b22] p-8 rounded-xl border border-[#30363d] max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LineChart className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#e6edf3] uppercase tracking-tight">TradeLog</h1>
          <p className="text-[#8b949e] font-mono text-xs mt-1">Professional trading journal & analytics</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#f851491a] border border-[#f851494d] text-[#f85149] text-xs rounded text-center">
            {error}
          </div>
        )}

        <button 
          onClick={signIn}
          className="w-full py-3 bg-[#21262d] hover:bg-[#30363d] text-[#e6edf3] rounded-lg font-semibold text-sm border border-[#30363d] transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-[#30363d]"></div>
          <span className="flex-shrink mx-3 text-[#8b949e] text-xs font-mono uppercase">Or Email</span>
          <div className="flex-grow border-t border-[#30363d]"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="block text-xs font-mono text-[#8b949e] mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-[#8b949e]" />
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required={isSignUp}
                  placeholder="John Doe" 
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-[#8b949e]" />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                placeholder="trader@example.com" 
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8b949e] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[#8b949e]" />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
                placeholder="••••••••" 
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#e6edf3] focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#8b949e]">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button onClick={() => { setIsSignUp(false); setError(''); }} className="text-indigo-400 hover:underline font-semibold">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button onClick={() => { setIsSignUp(true); setError(''); }} className="text-indigo-400 hover:underline font-semibold">
                Create One
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
