import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import smartAlertsManager from '../utils/smartAlerts';

const SmartAlertsPanel = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      await smartAlertsManager.initialize(user);
      const location = user.location?.lat && user.location?.lon 
        ? { lat: user.location.lat, lon: user.location.lon }
        : null;
      const allAlerts = await smartAlertsManager.runAllChecks(location);
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    const icons = {
      sowing: '🌱',
      irrigation: '💧',
      fertilizer: '🌾',
      weather: '⚠️',
      price: '💰'
    };
    return icons[type] || '📢';
  };

  const getAlertColor = (type) => {
    const colors = {
      sowing: 'bg-blue-50 border-blue-200',
      irrigation: 'bg-cyan-50 border-cyan-200',
      fertilizer: 'bg-green-50 border-green-200',
      weather: 'bg-yellow-50 border-yellow-200',
      price: 'bg-purple-50 border-purple-200'
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Checking alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Smart Alerts</h2>
        <button
          onClick={loadAlerts}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No alerts at this time. All good! ✅</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {alert.type === 'sowing' ? 'Suitable Sowing Time' :
                     alert.type === 'irrigation' ? 'Irrigation Reminder' :
                     alert.type === 'fertilizer' ? 'Fertilizer Schedule' :
                     alert.type === 'weather' ? 'Weather Alert' :
                     alert.type === 'price' ? 'Price Rise Alert' : 'Farming Alert'}
                  </h3>
                  <p className="text-gray-700 text-sm">{alert.message}</p>
                  {alert.crop && (
                    <p className="text-xs text-gray-500 mt-1">Crop: {alert.crop}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Alerts are checked automatically every 6 hours. Click "Refresh" to check now.
        </p>
      </div>
    </div>
  );
};

export default SmartAlertsPanel;

