// frontend/src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ChevronDown, User, Shield, LogOut, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hidden only on standalone login and register pages per mockup
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'staff':
        return 'Staff member';
      case 'maintenance':
        return 'Maintenance staff';
      case 'admin':
        return 'Admin';
      case 'super_admin':
        return 'Super admin';
      default:
        return role;
    }
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isPublicPage = !user && ['/', '/how-it-works', '/latest-issues'].includes(location.pathname);

  return (
    <nav className="bg-white border-b border-line sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <Link to={user ? "/issues" : "/"} className="flex items-center space-x-2 focus:outline-none">
              <div className="w-8 h-8 rounded bg-safetyYellow flex items-center justify-center font-bold text-ink text-base shadow-none">
                C
              </div>
              <span className="font-bold text-xl tracking-tight text-ink">CampusFix</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {isPublicPage ? (
                <>
                  <Link
                    to="/"
                    className={`relative py-5 text-sm font-semibold transition-colors duration-150 ${
                      isActive('/') ? 'text-ink' : 'text-gray-600 hover:text-ink'
                    }`}
                  >
                    Home
                    {isActive('/') && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-safetyYellow" />
                    )}
                  </Link>
                  <Link
                    to="/how-it-works"
                    className={`relative py-5 text-sm font-semibold transition-colors ${
                      isActive('/how-it-works') ? 'text-ink' : 'text-gray-600 hover:text-ink'
                    }`}
                  >
                    How it works
                    {isActive('/how-it-works') && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-safetyYellow" />
                    )}
                  </Link>
                  <Link
                    to="/latest-issues"
                    className={`relative py-5 text-sm font-semibold transition-colors ${
                      isActive('/latest-issues') ? 'text-ink' : 'text-gray-600 hover:text-ink'
                    }`}
                  >
                    Latest issues
                    {isActive('/latest-issues') && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-safetyYellow" />
                    )}
                  </Link>
                </>
              ) : (
                user && (
                  <>
                    <Link
                      to="/issues"
                      className={`relative py-5 text-sm font-semibold transition-colors duration-150 ${
                        isActive('/issues') ? 'text-ink' : 'text-gray-600 hover:text-ink'
                      }`}
                    >
                      Issues
                      {isActive('/issues') && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-safetyYellow" />
                      )}
                    </Link>

                    <Link
                      to="/report"
                      className={`relative py-5 text-sm font-semibold transition-colors duration-150 ${
                        isActive('/report') ? 'text-ink' : 'text-gray-600 hover:text-ink'
                      }`}
                    >
                      Report an issue
                      {isActive('/report') && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-safetyYellow" />
                      )}
                    </Link>

                    {['admin', 'super_admin'].includes(user.role) && (
                      <Link
                        to="/users"
                        className={`relative py-5 text-sm font-semibold transition-colors duration-150 ${
                          isActive('/users') ? 'text-ink' : 'text-gray-600 hover:text-ink'
                        }`}
                      >
                        Users
                        {isActive('/users') && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-safetyYellow" />
                        )}
                      </Link>
                    )}
                  </>
                )
              )}
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                {/* Pill Profile Chip styled after inspiration Image 02 */}
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 pl-3.5 pr-2 py-1.5 rounded-full border border-line bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-teal shadow-sm transition-all"
                  aria-expanded={dropdownOpen}
                >
                  <div className="text-right leading-tight">
                    <div className="text-xs font-bold text-ink truncate max-w-[120px]">{user.name}</div>
                    <div className="text-[10px] font-semibold text-teal tracking-wide uppercase">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm overflow-hidden">
                    {user.profile_picture_url ? <img src={user.profile_picture_url} alt="" className="h-full w-full object-cover" /> : getInitials(user.name)}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-150 ${
                      dropdownOpen ? 'rotate-180 text-ink' : ''
                    }`}
                  />
                </button>

                {/* Profile Dropdown Menu styled after inspiration Image 02 */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-card bg-white border border-line shadow-lg py-2 z-50 animate-page-enter">
                    {/* User header section */}
                    <div className="px-4 py-3 border-b border-line flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                        {user.profile_picture_url ? <img src={user.profile_picture_url} alt="" className="h-full w-full object-cover" /> : getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-ink truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>

                    {(user.faculty || user.department || user.student_id || user.level || user.staff_type) && (
                      <div className="border-b border-line px-4 py-3">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{user.faculty || user.department || user.student_id || user.level ? 'Academic details' : 'Staff details'}</p>
                        {user.faculty || user.department || user.student_id || user.level ? (
                          <dl className="space-y-1 text-sm text-gray-700">
                            <div><dt className="inline font-semibold">Faculty: </dt><dd className="inline">{user.faculty || 'Not set'}</dd></div>
                            <div><dt className="inline font-semibold">Department: </dt><dd className="inline">{user.department || 'Not set'}</dd></div>
                            <div><dt className="inline font-semibold">Student ID: </dt><dd className="inline">{user.student_id || 'Not set'}</dd></div>
                            <div><dt className="inline font-semibold">Level: </dt><dd className="inline">{user.level || 'Not set'}</dd></div>
                          </dl>
                        ) : <p className="text-sm text-gray-700">{user.staff_type}</p>}
                      </div>
                    )}

                    {/* Role Chip */}
                    <div className="px-4 py-2 border-b border-line bg-[#FAFBFB] flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-medium">Account role</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F3F3] text-teal">
                        {getRoleBadge(user.role)}
                      </span>
                    </div>

                    {/* Navigation items */}
                    <div className="py-1">
                      <Link
                        to="/issues"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-ink hover:bg-gray-50 transition-colors"
                      >
                        <User size={15} className="text-teal" />
                        Campus Dashboard
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-ink hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={15} className="text-teal" />
                        Profile settings
                      </Link>

                      {['admin', 'super_admin'].includes(user.role) && (
                        <Link
                          to="/users"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-ink hover:bg-gray-50 transition-colors"
                        >
                          <Shield size={15} className="text-teal" />
                          User Management
                        </Link>
                      )}
                    </div>

                    {/* Sign out item */}
                    <div className="border-t border-line pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-statusOpen hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-ink hover:text-teal transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded shadow-none btn-interactive"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-ink hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-white px-4 pt-3 pb-4 space-y-2 animate-page-enter">
          {user ? (
            <>
              <div className="py-3 border-b border-line flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                  {user.profile_picture_url ? <img src={user.profile_picture_url} alt="" className="h-full w-full object-cover" /> : getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink truncate">{user.name}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E6F3F3] text-teal">
                    {getRoleBadge(user.role)}
                  </span>
                </div>
              </div>

              {(user.faculty || user.department || user.student_id || user.level || user.staff_type) && (
                <div className="border-b border-line px-1 py-3 text-sm text-gray-700">
                  <p className="mb-1 font-bold">{user.faculty || user.department || user.student_id || user.level ? 'Academic details' : 'Staff details'}</p>
                  {user.faculty || user.department || user.student_id || user.level ? <p>{user.faculty || 'Faculty not set'} · {user.department || 'Department not set'} · ID {user.student_id || 'Not set'} · {user.level || 'Level not set'}</p> : <p>{user.staff_type}</p>}
                </div>
              )}

              <div className="space-y-1 pt-1">
                <Link
                  to="/issues"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2.5 text-sm rounded ${
                    isActive('/issues')
                      ? 'border-l-4 border-safetyYellow bg-[#F1F4F3] pl-3 font-bold text-ink'
                      : 'text-gray-700 hover:text-ink pl-4 font-medium'
                  }`}
                >
                  Issues
                </Link>

                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block rounded py-2.5 pl-4 text-sm font-medium text-gray-700 hover:text-ink">Profile settings</Link>

                <Link
                  to="/report"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2.5 text-sm rounded ${
                    isActive('/report')
                      ? 'border-l-4 border-safetyYellow bg-[#F1F4F3] pl-3 font-bold text-ink'
                      : 'text-gray-700 hover:text-ink pl-4 font-medium'
                  }`}
                >
                  Report an issue
                </Link>

                {['admin', 'super_admin'].includes(user.role) && (
                  <Link
                    to="/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-2.5 text-sm rounded ${
                      isActive('/users')
                        ? 'border-l-4 border-safetyYellow bg-[#F1F4F3] pl-3 font-bold text-ink'
                        : 'text-gray-700 hover:text-ink pl-4 font-medium'
                    }`}
                  >
                    Users
                  </Link>
                )}
              </div>

              <div className="pt-2 border-t border-line">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-center py-2 text-sm text-statusOpen border border-line rounded font-medium hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 text-sm font-semibold border border-line rounded text-ink"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 text-sm font-semibold bg-teal text-white rounded"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
