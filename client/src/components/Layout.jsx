import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { scaleUp, fadeIn } from '../animations/variants';
import { Folder, User, MessageSquare, ShieldAlert, LogOut, Menu, X, ChevronDown, LayoutGrid } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully.', 'success');
    navigate('/login');
  };

  const navItems = [
    { path: '/assets', label: 'Assets', icon: Folder },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  // If user is admin, append Admin panel route; otherwise append Support route
  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: ShieldAlert });
  } else {
    navItems.push({ path: '/query', label: 'Support', icon: MessageSquare });
  }

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 flex-col glass border-r border-neutral-900 sticky top-0 h-screen z-20">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-neutral-900 flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-600 text-white shadow shadow-indigo-500/15">
            <LayoutGrid size={20} />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Vault Portal
          </span>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 group ${
                  isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <IconComponent size={18} className={isActive ? 'text-primary-400' : 'text-neutral-400 group-hover:text-neutral-200 transition-colors'} />
                <span className="z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: User details */}
        <div className="p-4 border-t border-neutral-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-white text-xs font-bold shadow shadow-indigo-500/10">
              {userInitials}
            </div>
            <div className="truncate max-w-[120px]">
              <span className="block text-xs font-bold text-white truncate">{user?.name}</span>
              <span className="block text-[10px] text-neutral-500 capitalize">{user?.role}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION */}
      <header className="md:hidden glass border-b border-neutral-900 px-4 py-3.5 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Vault Portal
          </span>
        </div>

        {/* Mobile top-right avatar dropdown trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-1 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-white text-xs font-bold shadow">
              {userInitials}
            </div>
            <ChevronDown size={14} className="text-neutral-500" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                variants={scaleUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 mt-2.5 w-48 rounded-xl border border-neutral-800 bg-neutral-900/95 shadow-xl p-1.5 z-40 backdrop-blur-md"
              >
                <div className="px-3.5 py-2 border-b border-neutral-800 mb-1">
                  <span className="block text-xs font-bold text-white truncate">{user?.name}</span>
                  <span className="block text-[9px] text-neutral-500 truncate">{user?.email}</span>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <User size={14} />
                  <span>My Profile</span>
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <ShieldAlert size={14} />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/5 hover:text-red-300 rounded-lg transition-colors text-left"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* 3. MOBILE COLLAPSIBLE DRAWER SIDEBAR */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Sidebar drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-neutral-900 border-r border-neutral-800 z-50 p-6 flex flex-col justify-between md:hidden"
            >
              <div>
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-neutral-800">
                  <span className="font-bold text-white tracking-wide">Vault Navigation</span>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = location.pathname.startsWith(item.path);

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                          isActive
                            ? 'text-white'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <IconComponent size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-white text-xs font-bold">
                    {userInitials}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white truncate max-w-[140px]">{user?.name}</span>
                    <span className="block text-[9px] text-neutral-500 capitalize">{user?.role}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 4. MAIN PAGE DISPLAY CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-[calc(100vh-60px)] md:h-screen md:overflow-y-auto relative p-6">
        <div className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </div>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-neutral-900 px-4 py-2 flex justify-around items-center z-20">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center space-y-0.5 py-1 px-3 rounded-xl transition-all duration-150 relative ${
                  isActive ? 'text-primary-400' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <IconComponent size={18} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>

    </div>
  );
};

export default Layout;
