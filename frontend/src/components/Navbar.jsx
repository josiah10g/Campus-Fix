// frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                  <Link to="/how-it-works" className={`relative py-5 text-sm font-semibold transition-colors ${isActive('/how-it-works') ? 'text-ink' : 'text-gray-600 hover:text-ink'}`}>
                    How it works
                    {isActive('/how-it-works') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-safetyYellow" />}
                  </Link>
                  <Link to="/latest-issues" className={`relative py-5 text-sm font-semibold transition-colors ${isActive('/latest-issues') ? 'text-ink' : 'text-gray-600 hover:text-ink'}`}>
                    Latest issues
                    {isActive('/latest-issues') && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-safetyYellow" />}
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
                  </>
                )
              )}
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-ink font-normal">{user.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F3F3] text-teal">
                  {getRoleBadge(user.role)}
                </span>
                {isPublicPage ? (
                  <Link
                    to="/issues"
                    className="px-4 py-2 bg-teal hover:bg-teal-dark text-white text-xs font-semibold rounded shadow-none btn-interactive"
                  >
                    Go to dashboard
                  </Link>
                ) : (
                  <button
                    onClick={logout}
                    className="text-sm text-gray-500 hover:text-ink transition-colors duration-150"
                  >
                    Log out
                  </button>
                )}
              </>
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
              <div className="py-2 border-b border-line flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-ink">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F3F3] text-teal">
                  {getRoleBadge(user.role)}
                </span>
              </div>

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

                {user.role === 'super_admin' && (
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

                <p className="text-[11px] text-gray-400 pl-4 pt-2 pb-1">
                  Super admin also sees Users.
                </p>
              </div>

              <div className="pt-2 border-t border-line">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-center py-2 text-sm text-ink border border-line rounded font-medium hover:bg-gray-50"
                >
                  Log out
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
