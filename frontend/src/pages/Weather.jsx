import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Weather = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    lat: user?.location?.lat?.toString() || '',
    lon: user?.location?.lon?.toString() || ''
  });
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Auto-detect location on component mount (only if no existing location)
  useEffect(() => {
    // Don't auto-detect if user already has location in profile
    if (!formData.lat || !formData.lon) {
      // Small delay to ensure page is fully loaded (better for mobile)
      const timer = setTimeout(() => {
        detectLocation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const detectLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please enter coordinates manually.');
      return;
    }

    // Check if we're on HTTPS or localhost (required for geolocation)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      setLocationError('⚠️ Location access requires HTTPS. Please use https:// or enter coordinates manually.');
      console.warn('Geolocation requires HTTPS. Current protocol:', window.location.protocol);
    }

    setLocationLoading(true);
    setLocationError('');

    // Request permission first (for better mobile support)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setLocationError('Location permission denied. Please enable location access in your browser settings or enter coordinates manually.');
          setLocationLoading(false);
          return;
        }
      }).catch(() => {
        // Permission API not supported, continue anyway
      });
    }

    // Use getCurrentPosition with better mobile options
    let timeoutId;
    const positionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds for mobile
      maximumAge: 60000 // 1 minute cache
    };

    const positionSuccess = async (position) => {
      if (timeoutId) clearTimeout(timeoutId);
      
      const { latitude, longitude } = position.coords;
      setFormData({
        lat: latitude.toString(),
        lon: longitude.toString()
      });
      setLocationLoading(false);
      
      // Automatically fetch weather for detected location
      await fetchWeather(latitude, longitude);
    };

    const positionError = (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      
      console.error('Geolocation error:', err);
      
      let errorMessage = 'Unable to detect location. ';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage += 'Location permission denied. Please enable location access in your browser/device settings.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage += 'Location information unavailable. Please check your GPS/network connection and try again.';
          break;
        case err.TIMEOUT:
          errorMessage += 'Location request timed out. Please ensure GPS is enabled and try again.';
          break;
        default:
          errorMessage += 'Please enter coordinates manually or check your device settings.';
      }
      
      setLocationError(errorMessage);
      setLocationLoading(false);
    };

    // Request location
    navigator.geolocation.getCurrentPosition(
      positionSuccess,
      positionError,
      positionOptions
    );

    // Fallback timeout (in case getCurrentPosition doesn't respond)
    timeoutId = setTimeout(() => {
      setLocationError('Location detection is taking too long. Please check GPS is enabled or enter coordinates manually.');
      setLocationLoading(false);
    }, 20000); // 20 second fallback
  };

  const fetchWeather = async (lat, lon) => {
    setError('');
    setLoading(true);
    setWeather(null);

    try {
      const response = await api.get('/api/weather', {
        params: {
          lat: parseFloat(lat),
          lon: parseFloat(lon)
        }
      });
      setWeather(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch weather');
      // Try to load from IndexedDB if offline
      loadWeatherFromIndexedDB(lat, lon);
    } finally {
      setLoading(false);
    }
  };

  const loadWeatherFromIndexedDB = async (lat, lon) => {
    try {
      const db = await openDB();
      const key = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
      const cached = await db.get('weather', key);
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        setWeather(cached.data);
        console.log('Loaded weather from IndexedDB');
      }
    } catch (err) {
      console.error('Error loading from IndexedDB:', err);
    }
  };

  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FarmerAssistantDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('weather')) {
          db.createObjectStore('weather');
        }
      };
    });
  };

  const saveWeatherToIndexedDB = async (lat, lon, weatherData) => {
    try {
      const db = await openDB();
      const tx = db.transaction('weather', 'readwrite');
      const key = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
      await tx.objectStore('weather').put({
        data: weatherData,
        timestamp: Date.now()
      }, key);
    } catch (err) {
      console.error('Error saving to IndexedDB:', err);
    }
  };

  useEffect(() => {
    if (weather && formData.lat && formData.lon) {
      saveWeatherToIndexedDB(parseFloat(formData.lat), parseFloat(formData.lon), weather);
    }
  }, [weather]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetchWeather(parseFloat(formData.lat), parseFloat(formData.lon));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('weather.title')}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="mb-4">
          <button
            type="button"
            onClick={detectLocation}
            disabled={locationLoading}
            className="w-full sm:w-auto bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]"
          >
            {locationLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Detecting Location...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Auto-Detect Location</span>
              </>
            )}
          </button>
          {locationError && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 font-medium mb-1">⚠️ Location Detection Issue</p>
              <p className="text-xs sm:text-sm text-yellow-700">{locationError}</p>
              {locationError.includes('HTTPS') && (
                <div className="mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                  <p className="font-semibold mb-1">For mobile devices:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Geolocation requires HTTPS connection</li>
                    <li>Or use localhost for development</li>
                    <li>You can manually enter coordinates below</li>
                  </ul>
                </div>
              )}
            </div>
          )}
          {!locationError && !locationLoading && (
            <p className="mt-2 text-xs text-gray-500">
              💡 Make sure location/GPS is enabled on your device
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('weather.latitude')}
              </label>
              <input
                type="number"
                step="0.0001"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                required
                placeholder="e.g., 11.1271"
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('weather.longitude')}
              </label>
              <input
                type="number"
                step="0.0001"
                name="lon"
                value={formData.lon}
                onChange={handleChange}
                required
                placeholder="e.g., 78.6569"
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            💡 Tip: You can find coordinates using Google Maps or enable location detection above
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 text-base min-h-[44px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Loading Weather...
              </span>
            ) : (
              t('weather.getWeather')
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {weather && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Current Weather</h2>
          {weather.current && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">{t('weather.temperature')}</p>
                <p className="text-2xl font-bold">{weather.current.temperature}°C</p>
              </div>
              <div>
                <p className="text-gray-600">{t('weather.humidity')}</p>
                <p className="text-2xl font-bold">{weather.current.humidity}%</p>
              </div>
              <div>
                <p className="text-gray-600">Description</p>
                <p className="text-lg">{weather.current.description}</p>
              </div>
            </div>
          )}
          {weather.irrigationAdvice && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">{t('weather.irrigationAdvice')}</h3>
              <p className="text-gray-700 mb-2">{weather.irrigationAdvice.reason}</p>
              <p className="font-semibold">
                {t('weather.shouldIrrigate')}:{' '}
                {weather.irrigationAdvice.shouldIrrigate ? t('weather.yes') : t('weather.no')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Weather;

