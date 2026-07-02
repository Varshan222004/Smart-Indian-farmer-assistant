import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import GoogleTranslateWidget from './GoogleTranslateWidget';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-primary-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="text-lg sm:text-xl font-bold flex items-center space-x-2">
              <span className="text-2xl sm:text-3xl">🌾</span>
              <span className="hidden sm:inline">{t('app.title')}</span>
              <span className="sm:hidden">Farmer</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications Bell */}
            {user && <NotificationBell />}
            
            {/* Google Translate Widget */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-white font-medium hidden lg:inline">Translate:</span>
              <GoogleTranslateWidget />
            </div>
            {/* i18n Language Switcher */}
            <div className="flex space-x-1 border-l border-white/20 pl-4">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  i18n.language === 'en' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  i18n.language === 'hi' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title="हिंदी"
              >
                हिं
              </button>
              <button
                onClick={() => changeLanguage('ta')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  i18n.language === 'ta' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title="தமிழ்"
              >
                த
              </button>
            </div>
            {user && (
              <>
                <Link to="/dashboard/profile" className="hover:text-primary-200 text-sm lg:text-base">
                  <span className="hidden lg:inline">{user.name}</span>
                  <span className="lg:hidden">👤</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-primary-700 hover:bg-primary-800 px-3 lg:px-4 py-2 rounded text-sm lg:text-base"
                >
                  {t('auth.logout')}
                </button>
              </>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mobile-menu-enter border-t border-primary-700 py-4">
            <div className="flex flex-col space-y-4">
              {/* Mobile Notifications */}
              {user && (
                <div className="px-4">
                  <NotificationBell />
                </div>
              )}
              
              {/* Mobile Translate */}
              <div className="flex items-center space-x-2 px-4">
                <span className="text-sm text-white font-medium">Translate:</span>
                <GoogleTranslateWidget />
              </div>
              
              {/* Mobile Language Switcher */}
              <div className="flex space-x-2 px-4">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    i18n.language === 'en' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => changeLanguage('hi')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    i18n.language === 'hi' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => changeLanguage('ta')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    i18n.language === 'ta' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
              
              {user && (
                <div className="flex flex-col space-y-2 px-4">
                  <Link 
                    to="/dashboard/profile" 
                    className="text-white hover:text-primary-200 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    👤 {user.name}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="bg-primary-700 hover:bg-primary-800 px-4 py-2 rounded text-left"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

