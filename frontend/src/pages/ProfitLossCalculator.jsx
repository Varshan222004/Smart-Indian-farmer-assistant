import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

const ProfitLossCalculator = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    landArea: '',
    cropName: '',
    expectedYield: '',
    customPrice: '',
    useCustomCosts: false,
    customCosts: {
      seed: '',
      fertilizer: '',
      pesticide: '',
      labor: '',
      irrigation: '',
      harvesting: '',
      other: ''
    }
  });
  const [crops, setCrops] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const response = await api.get('/api/profit-loss/crops');
      setCrops(response.data.crops || []);
    } catch (err) {
      console.error('Error fetching crops:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('customCosts.')) {
      const costField = name.split('.')[1];
      setFormData({
        ...formData,
        customCosts: {
          ...formData.customCosts,
          [costField]: value
        }
      });
    } else if (name === 'useCustomCosts') {
      setFormData({
        ...formData,
        useCustomCosts: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);

    try {
      const payload = {
        landArea: parseFloat(formData.landArea),
        cropName: formData.cropName,
        expectedYield: formData.expectedYield ? parseFloat(formData.expectedYield) : null,
        customPrice: formData.customPrice ? parseFloat(formData.customPrice) : null,
        customCosts: formData.useCustomCosts ? formData.customCosts : null
      };

      const response = await api.post('/api/profit-loss/calculate', payload);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate profit/loss');
    } finally {
      setLoading(false);
    }
  };

  const selectedCrop = crops.find(c => c.name.toLowerCase() === formData.cropName.toLowerCase());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('profitLoss.title')}</h1>

      {/* Crops Profitability Ranking */}
      {crops.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('profitLoss.cropsRanking')}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('profitLoss.rank')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('profitLoss.crop')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('profitLoss.avgYield')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('profitLoss.price')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('profitLoss.cost')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('profitLoss.profit')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('profitLoss.profitPercent')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {crops.map((crop, index) => (
                  <tr key={index} className={index < 3 ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{crop.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">{crop.averageYield}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">
                      ₹{crop.averagePrice}
                      {crop.priceSource === 'gemini' && <span className="text-xs text-green-600 ml-1">(Live)</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-700">₹{crop.averageCostPerAcre.toLocaleString()}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-right font-semibold ${
                      crop.estimatedProfitPerAcre >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {crop.estimatedProfitPerAcre >= 0 ? '+' : ''}₹{crop.estimatedProfitPerAcre.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-right font-semibold ${
                      crop.estimatedProfitPercentage >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {crop.estimatedProfitPercentage >= 0 ? '+' : ''}{crop.estimatedProfitPercentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {t('profitLoss.priceNote')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('profitLoss.enterDetails')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profitLoss.landArea')}
              </label>
              <input
                type="number"
                step="0.1"
                name="landArea"
                value={formData.landArea}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 2.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profitLoss.cropName')}
              </label>
              <select
                name="cropName"
                value={formData.cropName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('profitLoss.selectCrop')}</option>
                {crops.map((crop, idx) => (
                  <option key={idx} value={crop.name}>
                    {crop.name} (Avg: {crop.averageYield} q/acre, ₹{crop.averagePrice}/q)
                  </option>
                ))}
              </select>
            </div>

            {selectedCrop && (
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                <p>{t('profitLoss.averageYield')}: {selectedCrop.averageYield} {t('profitLoss.quintalsPerAcre')}</p>
                <p>{t('profitLoss.averagePrice')}: ₹{selectedCrop.averagePrice}/{t('profitLoss.quintal')}</p>
                <p>{t('profitLoss.averageCost')}: ₹{selectedCrop.averageCostPerAcre}/{t('profitLoss.perAcre')}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profitLoss.expectedYield')}
                <span className="text-gray-500 text-xs ml-1">({t('profitLoss.optional')})</span>
              </label>
              <input
                type="number"
                step="0.1"
                name="expectedYield"
                value={formData.expectedYield}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder={selectedCrop ? `Average: ${selectedCrop.averageYield}` : 'e.g., 25'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profitLoss.customPrice')}
                <span className="text-gray-500 text-xs ml-1">({t('profitLoss.optionalMarket')})</span>
              </label>
              <input
                type="number"
                step="0.1"
                name="customPrice"
                value={formData.customPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                placeholder={selectedCrop ? `Market: ₹${selectedCrop.averagePrice}` : 'e.g., 2200'}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="useCustomCosts"
                checked={formData.useCustomCosts}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600"
              />
              <label className="text-sm font-medium text-gray-700">
                {t('profitLoss.useCustomCosts')}
              </label>
            </div>

            {formData.useCustomCosts && (
              <div className="bg-gray-50 p-4 rounded space-y-3">
                <h3 className="font-semibold text-gray-900">{t('profitLoss.customCostsTitle')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('profitLoss.seed')}</label>
                    <input
                      type="number"
                      name="customCosts.seed"
                      value={formData.customCosts.seed}
                      onChange={handleChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('profitLoss.fertilizer')}</label>
                    <input
                      type="number"
                      name="customCosts.fertilizer"
                      value={formData.customCosts.fertilizer}
                      onChange={handleChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('profitLoss.pesticide')}</label>
                    <input
                      type="number"
                      name="customCosts.pesticide"
                      value={formData.customCosts.pesticide}
                      onChange={handleChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('profitLoss.labor')}</label>
                    <input
                      type="number"
                      name="customCosts.labor"
                      value={formData.customCosts.labor}
                      onChange={handleChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('profitLoss.irrigation')}</label>
                    <input
                      type="number"
                      name="customCosts.irrigation"
                      value={formData.customCosts.irrigation}
                      onChange={handleChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{t('profitLoss.harvesting')}</label>
                    <input
                      type="number"
                      name="customCosts.harvesting"
                      value={formData.customCosts.harvesting}
                      onChange={handleChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">{t('profitLoss.other')}</label>
                    <input
                      type="number"
                      name="customCosts.other"
                      value={formData.customCosts.other}
                      onChange={handleChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 font-semibold"
            >
              {loading ? t('profitLoss.calculating') : t('profitLoss.calculate')}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('profitLoss.results')}</h2>
          
          {!result ? (
            <div className="text-center py-12 text-gray-500">
              {t('profitLoss.enterDetailsPrompt')}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">{t('profitLoss.totalCost')}</p>
                  <p className="text-2xl font-bold text-red-700">₹{result.calculation.totalCost.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">{t('profitLoss.totalRevenue')}</p>
                  <p className="text-2xl font-bold text-green-700">₹{result.calculation.totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                result.calculation.profit >= 0 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <p className="text-sm text-gray-600 mb-1">{t('profitLoss.netProfit')}</p>
                <p className={`text-3xl font-bold ${
                  result.calculation.profit >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.calculation.profit >= 0 ? '+' : ''}₹{result.calculation.profit.toLocaleString()}
                </p>
                <p className={`text-sm mt-1 ${
                  result.calculation.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ({result.calculation.profitPercentage >= 0 ? '+' : ''}{result.calculation.profitPercentage}%)
                </p>
              </div>

              {/* Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">{t('profitLoss.details')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profitLoss.crop')}:</span>
                    <span className="font-medium">{result.calculation.crop}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profitLoss.landArea')}:</span>
                    <span className="font-medium">{result.calculation.landArea} {t('profitLoss.acres')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profitLoss.expectedYield')}:</span>
                    <span className="font-medium">{result.calculation.expectedYield.toFixed(1)} {t('profitLoss.quintals')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profitLoss.yieldPerAcre')}:</span>
                    <span className="font-medium">{result.calculation.yieldPerAcre.toFixed(1)} {t('profitLoss.qPerAcre')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profitLoss.pricePerQuintal')}:</span>
                    <span className="font-medium">₹{result.calculation.pricePerQuintal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profitLoss.revenuePerAcre')}:</span>
                    <span className="font-medium">₹{result.calculation.revenuePerAcre.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profitLoss.costPerAcre')}:</span>
                    <span className="font-medium">₹{result.calculation.costPerAcre.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('profitLoss.profitPerAcre')}:</span>
                    <span className="font-medium">₹{result.calculation.profitPerAcre.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              {result.breakdown && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('profitLoss.costBreakdown')}</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(result.breakdown.costs).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{key}:</span>
                        <span className="font-medium">₹{value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Break-even Analysis */}
              <div className="border-t pt-4 bg-yellow-50 p-3 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">{t('profitLoss.breakEven')}</h3>
                <p className="text-sm text-gray-700">
                  {t('profitLoss.breakEvenText')} <strong>{result.calculation.breakEvenYield.toFixed(1)} {t('profitLoss.breakEvenText2')}</strong> 
                  ({result.calculation.breakEvenYieldPerAcre.toFixed(1)} {t('profitLoss.breakEvenText3')})
                </p>
                {result.calculation.aiAnalysis && (
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <h4 className="font-semibold text-sm text-gray-900 mb-1">{t('profitLoss.aiAnalysis')}</h4>
                    <p className="text-sm text-gray-700">{result.calculation.aiAnalysis}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfitLossCalculator;

