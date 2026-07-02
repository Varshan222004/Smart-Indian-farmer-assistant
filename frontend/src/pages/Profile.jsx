import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import NotificationSettings from '../components/NotificationSettings';

const Profile = () => {
  const { t } = useTranslation();
  const { user: authUser, fetchUser } = useAuth();
  const [formData, setFormData] = useState({
    name: authUser?.name || '',
    location: {
      lat: authUser?.location?.lat || '',
      lon: authUser?.location?.lon || '',
      district: authUser?.location?.district || '',
      state: authUser?.location?.state || ''
    },
    landSize: authUser?.landSize || '',
    landQuality: authUser?.landQuality || 'Medium',
    soilType: authUser?.soilType || 'Loamy',
    favoriteCrops: authUser?.favoriteCrops?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authUser) {
      setFormData({
        name: authUser.name || '',
        location: {
          lat: authUser.location?.lat || '',
          lon: authUser.location?.lon || '',
          district: authUser.location?.district || '',
          state: authUser.location?.state || ''
        },
        landSize: authUser.landSize || '',
        landQuality: authUser.landQuality || 'Medium',
        soilType: authUser.soilType || 'Loamy',
        favoriteCrops: authUser.favoriteCrops?.join(', ') || ''
      });
    }
  }, [authUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData({
        ...formData,
        location: { ...formData.location, [locationField]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const updateData = {
        ...formData,
        landSize: parseFloat(formData.landSize) || 0,
        favoriteCrops: formData.favoriteCrops.split(',').map(c => c.trim()).filter(c => c)
      };
      await api.put('/api/profile', updateData);
      setMessage('Profile updated successfully');
      if (fetchUser) fetchUser();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('profile.title')}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                name="location.lat"
                value={formData.location.lat}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                name="location.lon"
                value={formData.location.lon}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                type="text"
                name="location.district"
                value={formData.location.district}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="location.state"
                value={formData.location.state}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('crop.landSize')}</label>
            <input
              type="number"
              step="0.1"
              name="landSize"
              value={formData.landSize}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('crop.landQuality')}</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('crop.soilType')}</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.favoriteCrops')}</label>
            <input
              type="text"
              name="favoriteCrops"
              value={formData.favoriteCrops}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Comma separated, e.g., Rice, Wheat, Cotton"
            />
          </div>
          {message && (
            <div className={`px-4 py-3 rounded ${
              message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : t('profile.update')}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="mt-8">
        <NotificationSettings />
      </div>
    </div>
  );
};

export default Profile;

