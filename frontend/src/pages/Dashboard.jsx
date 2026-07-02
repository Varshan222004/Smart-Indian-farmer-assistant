import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import smartAlertsManager from '../utils/smartAlerts';
import SmartAlertsPanel from '../components/SmartAlertsPanel';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Initialize smart alerts on dashboard load
  useEffect(() => {
    if (user) {
      smartAlertsManager.initialize(user).then(() => {
        // Run checks with user location
        const location = user.location?.lat && user.location?.lon 
          ? { lat: user.location.lat, lon: user.location.lon }
          : null;
        smartAlertsManager.runAllChecks(location);
      });
    }
  }, [user]);

  const cards = [
    {
      title: t('dashboard.cropRecommendation'),
      route: '/dashboard/crop',
      icon: '🌾',
      description: t('dashboard.cropRecommendationDescription')
    },
    {
      title: t('dashboard.fertilizerRecommendation'),
      route: '/dashboard/fertilizer',
      icon: '🌱',
      description: t('dashboard.fertilizerRecommendationDescription')
    },
    {
      title: t('dashboard.diseaseDetection'),
      route: '/dashboard/disease',
      icon: '🔬',
      description: t('dashboard.diseaseDetectionDescription')
    },
    {
      title: t('dashboard.weather'),
      route: '/dashboard/weather',
      icon: '🌤️',
      description: t('dashboard.weatherDescription')
    },
    {
      title: t('dashboard.chat'),
      route: '/dashboard/chat',
      icon: '💬',
      description: t('dashboard.chatDescription')
    },
    {
      title: t('dashboard.market'),
      route: '/dashboard/market',
      icon: '💰',
      description: t('dashboard.marketDescription')
    },
    {
      title: t('governmentSchemes.title'),
      route: '/dashboard/government-schemes',
      icon: '🏛️',
      description: t('dashboard.governmentSchemesDescription')
    },
    {
      title: t('profitLoss.title'),
      route: '/dashboard/profit-loss',
      icon: '💰',
      description: t('dashboard.profitLossDescription')
    },
    {
      title: t('cropCalendar.title'),
      route: '/dashboard/crop-calendar',
      icon: '📅',
      description: t('dashboard.cropCalendarDescription')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Hero Section with Farmer Image */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                {t('dashboard.title')}
              </h1>
              <p className="text-lg sm:text-xl text-primary-100 mb-6">
                {t('dashboard.subtitle')}
              </p>
              {user && (
                <p className="text-primary-200 text-sm sm:text-base">
                  {t('dashboard.welcomeBack')} {user.name}! 👋
                </p>
              )}
            </div>
            
            {/* Farmer Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
                <img 
                  src="/farmer-hero.svg" 
                  alt="Happy Farmer" 
                  className="w-full h-auto drop-shadow-2xl animate-pulse-slow"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.target.style.display = 'none';
                    const fallback = document.getElementById('farmer-fallback');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                {/* Fallback emoji if image fails */}
                <div className="text-9xl sm:text-[12rem] lg:text-[15rem] text-center hidden" id="farmer-fallback">
                  🌾👨‍🌾
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Smart Alerts Panel */}
        <div className="mb-6 sm:mb-8">
          <SmartAlertsPanel />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.route)}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-primary-300 hover:-translate-y-1"
            >
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{card.icon}</div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{card.title}</h2>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

