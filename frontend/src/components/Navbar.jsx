// frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Format role label matching design pill
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
        return 'Super Admin';
      default:
        return role;
    }
  };

  return (
    <nav className="bg-white border-b border-line sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-8">
            <Link to="/issues" className="flex items-center space-x-2 focus:outline-none">
              {/* Logo Mark: Yellow box with "C" */}
              <div className="w-8 h-8 rounded bg-safetyYellow flex items-center justify-center font-bold text-ink text-base shadow-none">
                C
              </div>
              <span className="font-bold text-xl tracking-tight text-ink">CampusFix</span>
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <div className="hidden md:flex space-x-6">
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

                {user.role === 'super_admin' && (
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
              </div>
            )}
          </div>

          {/* Desktop Right Side: User Name, Role Pill, Log out */}
          {user ? (
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-ink font-normal">{user.name}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F3F3] text-teal">
                {getRoleBadge(user.role)}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-ink transition-colors duration-150"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-sm font-medium text-ink hover:text-teal">
                Log in
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
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
        <div className="md:hidden border-t border-line bg-white px-4 pt-2 pb-4 space-y-2 animate-page-enter">
          {user ? (
            <>
              <div className="py-2 border-b border-line flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-ink">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F3F3] text-teal">
                  {getRoleBadge(user.role)}
                </span>
              </div>
              <Link
                to="/issues"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium ${
                  isActive('/issues') ? 'text-teal font-bold' : 'text-ink'
                }`}
              >
                Issues
              </Link>
              <Link
                to="/report"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium ${
                  isActive('/report') ? 'text-teal font-bold' : 'text-ink'
                }`}
              >
                Report an issue
              </Link>
              {user.role === 'super_admin' && (
                <Link
                  to="/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 text-sm font-medium ${
                    isActive('/users') ? 'text-teal font-bold' : 'text-ink'
                  }`}
                >
                  Users
                </Link>
              )}
              <div className="pt-2 border-t border-line">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left py-2 text-sm text-statusOpen font-medium"
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-teal"
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
