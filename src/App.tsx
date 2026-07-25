import React, { useState } from 'react';
import { useAuth } from './lib/AuthContext.tsx';
import { Home, LineChart, Target, LogOut, Menu } from 'lucide-react';
import Dashboard from './components/Dashboard.tsx';
import Analytics from './components/Analytics.tsx';
import Milestones from './components/Milestones.tsx';
import StickyNote from './components/StickyNote.tsx';
import LoginScreen from './components/LoginScreen.tsx';

export default function App() {
  const { user, loading, logOut } = useAuth();
  const [currentTab, setCurrentTab] = useState('analytics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0d1117]"><div className="w-8 h-8 border-4 border-[#e6edf3] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'analytics': return <Analytics />;
      case 'milestones': return <Milestones />;
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'milestones', label: 'Milestones', icon: Target },
  ];

  return (
    <div className="h-screen bg-[#0d1117] text-[#e6edf3] font-sans flex overflow-hidden">
      <StickyNote />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#30363d] bg-[#0d1117] fixed h-full z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white">TJ</div>
          <h1 className="text-xl font-bold tracking-tight uppercase">TradeLog</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-6">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${currentTab === item.id ? 'bg-[#161b22] text-[#e6edf3]' : 'text-[#8b949e] hover:bg-[#161b22]'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#30363d]">
          <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#e6edf3]">
            <img src={user.photoURL || ''} alt="Avatar" className="w-8 h-8 rounded bg-[#30363d]" />
            <div className="flex-1 truncate">{user.displayName}</div>
          </div>
          <button onClick={logOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#f85149] hover:bg-[#161b22] transition-colors mt-2">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0 overflow-hidden flex flex-col">
        <header className="lg:hidden bg-[#0d1117] border-b border-[#30363d] px-4 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 text-xl font-bold tracking-tight uppercase">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-xs">TJ</div>
            TradeLog
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-[#8b949e]">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute right-4 top-16 w-48 bg-[#161b22] rounded-xl border border-[#30363d] py-2" onClick={e => e.stopPropagation()}>
              <button onClick={() => { logOut(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-[#f85149] hover:bg-[#161b22]">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto w-full flex-1 min-h-0 flex flex-col overflow-y-auto">
          {renderContent()}
        </div>
        
        {/* Footer Branding */}
        <footer className="mt-6 pt-4 pb-4 border-t border-[#30363d] px-4 lg:px-8 flex justify-between items-center text-[#8b949e]">
          <div></div>
          <div className="flex gap-4">
            <div className="w-4 h-4 rounded-full bg-[#30363d] text-[8px] flex items-center justify-center text-white">?</div>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-[#161b22] border-t border-[#30363d] flex items-center justify-around pb-safe z-20 h-14">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${currentTab === item.id ? 'text-[#e6edf3] opacity-100' : 'text-[#8b949e] opacity-40'}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium hidden sm:block">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
