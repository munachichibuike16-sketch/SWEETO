import React from 'react';
import { User, Package, Lock, Sliders, LogOut } from 'lucide-react';

const DesktopAccountSidebar = ({ user, currentTab, activeSettingsSection, onTabChange, onSectionChange, onLogout }) => {
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const isActive = (tab, section) => {
    if (tab === 'settings' && currentTab === 'settings') {
      if (section && activeSettingsSection === section) return true;
      if (!section && (activeSettingsSection === 'profile' || activeSettingsSection === 'personal')) return true;
    }
    if (tab === 'orders' && currentTab === 'orders') return true;
    return false;
  };

  return (
    <div className="hidden lg:flex flex-col w-[300px] shrink-0 border-r border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#090d16] min-h-screen sticky top-0 py-8 px-6">
      {/* Profile Card */}
      <div className="flex flex-col items-center mb-10 text-center mt-8">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 shadow-sm border border-slate-100 dark:border-white/10 flex-shrink-0 bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black">
          {user?.avatarUrl || user?.picture ? (
            <img src={user.avatarUrl || user.picture} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            getInitials(user?.name)
          )}
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
          {user?.name || 'SweeTo User'}
        </h2>
        <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-1">
          {user?.email}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-2">
        <button
          onClick={() => {
            onTabChange('settings');
            onSectionChange('profile');
          }}
          className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all cursor-pointer font-bold text-sm ${
            isActive('settings', 'profile') || isActive('settings', 'personal')
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <User size={20} />
          <span>Profile</span>
        </button>

        <button
          onClick={() => {
            onTabChange('orders');
          }}
          className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all cursor-pointer font-bold text-sm ${
            isActive('orders')
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package size={20} />
          <span>My Orders</span>
        </button>

        <button
          onClick={() => {
            onTabChange('settings');
            onSectionChange('security');
          }}
          className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all cursor-pointer font-bold text-sm ${
            isActive('settings', 'security')
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock size={20} />
          <span>Security</span>
        </button>

        <button
          onClick={() => {
            onTabChange('settings');
            onSectionChange('preferences');
          }}
          className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all cursor-pointer font-bold text-sm ${
            isActive('settings', 'preferences')
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders size={20} />
          <span>Preferences</span>
        </button>
      </nav>

      {/* Spacer to push logout to bottom if needed, or just keep it below */}
      <div className="mt-auto pt-8">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all cursor-pointer font-bold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default DesktopAccountSidebar;
