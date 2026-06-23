import React, { useState } from 'react';
import { motion as motionFramer, AnimatePresence as AnimatePresenceFramer } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import apiClient from '../api/apiClient';
import { pageVariant, fadeIn } from '../animations/variants';
import { User, Mail, Shield, Calendar, Edit2, Lock, Save, X, KeyRound, Loader2, Bell, BellOff } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notifications_enabled !== false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password Change State
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setProfileError('Name and email are required');
      return;
    }
    
    setIsSavingProfile(true);
    setProfileError('');
    try {
      const res = await apiClient.put('/profile', { name, email, notifications_enabled: notificationsEnabled });
      updateProfile(res.data.user);
      addToast('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setNotificationsEnabled(user?.notifications_enabled !== false);
    setProfileError('');
    setIsEditing(false);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsSavingPassword(true);
    setPasswordError('');
    try {
      await apiClient.put('/profile/password', { currentPassword, newPassword });
      addToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordOpen(false);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
      addToast(err.message || 'Failed to update password', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const formattedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  return (
    <motionFramer
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-4xl mx-auto py-8 px-4"
    >
      <h1 className="text-3xl font-bold text-white mb-8">Account Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Summary Card */}
        <div className="md:col-span-1">
          <div className="glass-card p-6 rounded-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary-500 to-accent-500" />
            
            {/* Avatar Circle with initials */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-600 to-accent-600 flex items-center justify-center text-white text-3xl font-extrabold mx-auto shadow-lg shadow-indigo-500/10 mb-4">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </div>

            <h2 className="text-xl font-bold text-white mb-1">{user?.name}</h2>
            <p className="text-sm text-neutral-400 mb-4">{user?.email}</p>

            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400 capitalize">
              <Shield size={12} className="mr-1.5" />
              <span>{user?.role} Portal</span>
            </div>

            <div className="border-t border-neutral-800 mt-6 pt-4 text-left space-y-3">
              <div className="flex items-center text-neutral-400 text-xs">
                <Calendar size={14} className="mr-2 text-neutral-500" />
                <span>Joined {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editing and Password Settings */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section: Profile Info */}
          <div className="glass-card p-6 rounded-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Personal Information</h3>
              {!isEditing && (
                <motionFramer.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white rounded-lg transition-colors inline-flex items-center"
                >
                  <Edit2 size={13} className="mr-1.5" />
                  <span>Edit Profile</span>
                </motionFramer.button>
              )}
            </div>

            <AnimatePresenceFramer mode="wait">
              {!isEditing ? (
                <motionFramer.div
                  key="viewProfile"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs text-neutral-500 mb-0.5">Full Name</span>
                      <span className="text-sm font-semibold text-white flex items-center">
                        <User size={16} className="mr-2 text-neutral-400" />
                        {user?.name}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-neutral-500 mb-0.5">Email Address</span>
                      <span className="text-sm font-semibold text-white flex items-center">
                        <Mail size={16} className="mr-2 text-neutral-400" />
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-800/60">
                    <div>
                      <span className="block text-xs text-neutral-500 mb-0.5">Notification Settings</span>
                      <span className="text-sm font-semibold text-white flex items-center">
                        {user?.notifications_enabled !== false ? (
                          <>
                            <Bell size={16} className="mr-2 text-emerald-400" />
                            <span>Notifications Enabled</span>
                          </>
                        ) : (
                          <>
                            <BellOff size={16} className="mr-2 text-neutral-500" />
                            <span>Notifications Disabled</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </motionFramer.div>
              ) : (
                <motionFramer.form
                  key="editProfile"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleSaveProfile}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1" htmlFor="profile-name">Full Name</label>
                      <input
                        id="profile-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1" htmlFor="profile-email">Email Address</label>
                      <input
                        id="profile-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-800/60">
                    <label className="flex items-center space-x-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={(e) => setNotificationsEnabled(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-800 text-primary-600 bg-neutral-900 focus:ring-primary-500/20 focus:ring-2 focus:ring-offset-0"
                      />
                      <div>
                        <span className="block text-sm font-bold text-white">Receive Email Notifications</span>
                        <span className="block text-xs text-neutral-400">Get notified when new assets are uploaded to the vault</span>
                      </div>
                    </label>
                  </div>

                  {profileError && (
                    <motionFramer.p 
                      variants={fadeIn}
                      initial="hidden"
                      animate="visible"
                      className="text-xs text-red-400"
                    >
                      {profileError}
                    </motionFramer.p>
                  )}

                  <div className="flex space-x-3 justify-end pt-2 border-t border-neutral-800">
                    <motionFramer.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleCancelProfile}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 rounded-lg transition-colors inline-flex items-center"
                    >
                      <X size={14} className="mr-1.5" />
                      <span>Cancel</span>
                    </motionFramer.button>
                    <motionFramer.button
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-xs font-bold text-white rounded-lg transition-colors inline-flex items-center shadow-lg shadow-indigo-500/10"
                    >
                      {isSavingProfile ? (
                        <Loader2 size={14} className="animate-spin mr-1.5" />
                      ) : (
                        <Save size={14} className="mr-1.5" />
                      )}
                      <span>Save Changes</span>
                    </motionFramer.button>
                  </div>
                </motionFramer.form>
              )}
            </AnimatePresenceFramer>
          </div>

          {/* Section: Change Password Collapsible */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <button
              onClick={() => setIsPasswordOpen(!isPasswordOpen)}
              className="w-full flex justify-between items-center text-left focus:outline-none"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-accent-500/10 text-accent-400">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Change Account Password</h3>
                  <p className="text-xs text-neutral-400">Ensure security by updating credentials</p>
                </div>
              </div>
              <motionFramer.div
                animate={{ rotate: isPasswordOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-neutral-500"
              >
                <Lock size={16} />
              </motionFramer.div>
            </button>

            {/* Collapsible panel with height animation */}
            <motionFramer.div
              initial={false}
              animate={{ height: isPasswordOpen ? 'auto' : 0, opacity: isPasswordOpen ? 1 : 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSavePassword} className="space-y-4 pt-6 mt-4 border-t border-neutral-800">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1" htmlFor="current-pass">Current Password</label>
                  <input
                    id="current-pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1" htmlFor="new-pass">New Password</label>
                    <input
                      id="new-pass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                      placeholder="Min 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1" htmlFor="confirm-new-pass">Confirm New Password</label>
                    <input
                      id="confirm-new-pass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {passwordError && (
                  <motionFramer.p 
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="text-xs text-red-400"
                  >
                    {passwordError}
                  </motionFramer.p>
                )}

                <div className="flex space-x-3 justify-end pt-2 border-t border-neutral-800">
                  <motionFramer.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-xs font-bold text-white rounded-lg transition-colors inline-flex items-center shadow-lg shadow-violet-500/10"
                  >
                    {isSavingPassword ? (
                      <Loader2 size={14} className="animate-spin mr-1.5" />
                    ) : (
                      <Save size={14} className="mr-1.5" />
                    )}
                    <span>Update Password</span>
                  </motionFramer.button>
                </div>
              </form>
            </motionFramer.div>
          </div>

        </div>
      </div>
    </motionFramer>
  );
};

export default ProfilePage;
