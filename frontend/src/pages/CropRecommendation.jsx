import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { saveCropRecommendation, isOffline } from '../utils/offlineStorage';
import notificationManager from '../utils/notifications';

const CropRecommendation = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    pH: '',
    temperature: '',
    humidity: '',
    rainfall: '',
    landSize: user?.landSize || '',
    landQuality: user?.landQuality || 'Medium',
    soilType: user?.soilType || 'Loamy',
    month: new Date().getMonth() + 1
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/ml/crop-recommend', {
        ...formData,
        N: parseFloat(formData.N),
        P: parseFloat(formData.P),
        K: parseFloat(formData.K),
        pH: parseFloat(formData.pH),
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        rainfall: parseFloat(formData.rainfall),
        landSize: parseFloat(formData.landSize)
      });
      setResult(response.data);
      // Save to offline storage
      await saveCropRecommendation({
        input: formData,
        result: response.data,
        timestamp: Date.now()
      });
      
      // Show notification if offline mode was used
      if (isOffline()) {
        notificationManager.showNotification('Crop Recommendation', {
          body: 'Recommendation saved for offline access',
          tag: 'crop-reco'
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get recommendations');
      
      // If offline, show message
      if (isOffline()) {
        setError('You are offline. Please connect to the internet to get recommendations.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('crop.title')}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.nitrogen')}
              </label>
              <input
                type="number"
                name="N"
                value={formData.N}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.phosphorus')}
              </label>
              <input
                type="number"
                name="P"
                value={formData.P}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.potassium')}
              </label>
              <input
                type="number"
                name="K"
                value={formData.K}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.ph')}
              </label>
              <input
                type="number"
                step="0.1"
                name="pH"
                value={formData.pH}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.temperature')}
              </label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.humidity')}
              </label>
              <input
                type="number"
                step="0.1"
                name="humidity"
                value={formData.humidity}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.rainfall')}
              </label>
              <input
                type="number"
                step="0.1"
                name="rainfall"
                value={formData.rainfall}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.landSize')}
              </label>
              <input
                type="number"
                step="0.1"
                name="landSize"
                value={formData.landSize}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.landQuality')}
              </label>
              <select
                name="landQuality"
                value={formData.landQuality}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.soilType')}
              </label>
              <select
                name="soilType"
                value={formData.soilType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Sandy">Sandy</option>
                <option value="Loamy">Loamy</option>
                <option value="Clay">Clay</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Clay Loam">Clay Loam</option>
                <option value="Silt Loam">Silt Loam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('crop.month')}
              </label>
              <input
                type="number"
                min="1"
                max="12"
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : t('crop.getRecommendation')}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('crop.recommendedCrop')}</h2>
          <div className="mb-4">
            <p className="text-xl font-semibold text-primary-600">{result.top_crop || result.recommended_crop}</p>
          </div>
          {result.top_candidates && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{t('crop.topCandidates')}</h3>
              <ul className="list-disc list-inside">
                {result.top_candidates.map((crop, idx) => (
                  <li key={idx} className="text-gray-700">{crop}</li>
                ))}
              </ul>
            </div>
          )}
          {result.explanation && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('crop.explanation')}</h3>
              <p className="text-gray-700">{result.explanation}</p>
            </div>
          )}
          {result.allocation_advice && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Land Allocation Advice</h3>
              <p className="text-gray-700">{result.allocation_advice}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CropRecommendation;

