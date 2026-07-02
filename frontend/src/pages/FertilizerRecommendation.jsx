import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

const FertilizerRecommendation = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    crop: '',
    N: '',
    P: '',
    K: '',
    pH: '',
    cropStage: 'vegetative'
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
      const response = await api.post('/ml/fertilizer-recommend', {
        ...formData,
        N: parseFloat(formData.N),
        P: parseFloat(formData.P),
        K: parseFloat(formData.K),
        pH: parseFloat(formData.pH)
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('fertilizer.title')}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fertilizer.crop')}
              </label>
              <input
                type="text"
                name="crop"
                value={formData.crop}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Rice, Wheat, Cotton"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fertilizer.cropStage')}
              </label>
              <select
                name="cropStage"
                value={formData.cropStage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="fruiting">Fruiting</option>
                <option value="maturity">Maturity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">P</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">K</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">pH</label>
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
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : t('fertilizer.getRecommendation')}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommendations</h2>
          {result.fertilizers && (
            <div className="space-y-4">
              {result.fertilizers.map((fert, idx) => (
                <div key={idx} className="border-b pb-4">
                  <h3 className="font-semibold text-lg">{fert.name}</h3>
                  <p className="text-gray-700">Dosage: {fert.dosage}</p>
                  {fert.schedule && <p className="text-gray-600 text-sm">{fert.schedule}</p>}
                  {fert.reason && <p className="text-gray-600 text-sm mt-1">Reason: {fert.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FertilizerRecommendation;

