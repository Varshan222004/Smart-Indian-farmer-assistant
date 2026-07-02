import { useState, useEffect } from 'react';
import notificationManager from '../utils/notifications';
import smartAlertsManager from '../utils/smartAlerts';
import { useAuth } from '../context/AuthContext';

const NotificationSettings = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [scheduled, setScheduled] = useState([]);
  const [dailyReminderTime, setDailyReminderTime] = useState('08:00');
  const [irrigationReminders, setIrrigationReminders] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [schemeUpdates, setSchemeUpdates] = useState(true);
  const [sowingAlerts, setSowingAlerts] = useState(true);
  const [fertilizerAlerts, setFertilizerAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [alertStatus, setAlertStatus] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadScheduled();
  }, []);

  const loadScheduled = () => {
    const scheduled = notificationManager.getScheduledNotifications();
    setScheduled(scheduled);
  };

  const requestPermission = async () => {
    const newPermission = await notificationManager.requestPermission();
    setPermission(newPermission);
  };

  const scheduleDailyReminder = async () => {
    await notificationManager.scheduleDailyReminder(
      dailyReminderTime,
      '🌾 Daily Farming Reminder',
      'Check your crops and farming tasks for today!'
    );
    loadScheduled();
    alert('Daily reminder scheduled!');
  };

  const testNotification = () => {
    notificationManager.showNotification('Test Notification', {
      body: 'This is a test notification from Farmer Assistant',
      tag: 'test'
    });
  };

  const testSmartAlerts = async () => {
    if (!user) {
      setAlertStatus('Please log in to test smart alerts');
      return;
    }

    setAlertStatus('Running smart alerts check...');
    try {
      await smartAlertsManager.initialize(user);
      const location = user.location?.lat && user.location?.lon 
        ? { lat: user.location.lat, lon: user.location.lon }
        : null;
      const alerts = await smartAlertsManager.runAllChecks(location);
      setAlertStatus(`Found ${alerts.length} alert(s). Check notifications!`);
    } catch (error) {
      setAlertStatus('Error testing alerts: ' + error.message);
    }
  };

  const testSowingAlert = () => {
    notificationManager.showNotification('🌱 Suitable Sowing Time', {
      body: 'It\'s the perfect time to sow Rice. Optimal sowing window is now!',
      tag: 'test_sowing',
      requireInteraction: true,
      onClick: () => window.location.href = '/dashboard/crop'
    });
  };

  const testIrrigationAlert = () => {
    notificationManager.showNotification('💧 Irrigation Reminder', {
      body: 'Your Rice crop needs irrigation. It\'s been 5 days since last irrigation.',
      tag: 'test_irrigation',
      requireInteraction: true,
      onClick: () => window.location.href = '/dashboard/weather'
    });
  };

  const testFertilizerAlert = () => {
    notificationManager.showNotification('🌾 Fertilizer Schedule', {
      body: 'Apply Urea (50 kg/acre) to your Rice crop today.',
      tag: 'test_fertilizer',
      requireInteraction: true,
      onClick: () => window.location.href = '/dashboard/fertilizer'
    });
  };

  const testWeatherAlert = () => {
    notificationManager.showNotification('⚠️ Weather Alert', {
      body: 'Heavy rainfall expected (60mm). Ensure proper drainage.',
      tag: 'test_weather',
      requireInteraction: true,
      onClick: () => window.location.href = '/dashboard/weather'
    });
  };

  const testPriceAlert = () => {
    notificationManager.showNotification('💰 Price Rise Alert', {
      body: 'Price alert: Rice price increased by 8.5% to ₹2,500/quintal. Good time to sell!',
      tag: 'test_price',
      requireInteraction: true,
      onClick: () => window.location.href = '/dashboard/market'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Settings</h2>

      {/* Permission Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Permission Status</h3>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded text-sm font-semibold ${
            permission === 'granted' 
              ? 'bg-green-100 text-green-800' 
              : permission === 'denied'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {permission === 'granted' ? 'Granted' : permission === 'denied' ? 'Denied' : 'Not Set'}
          </span>
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              Request Permission
            </button>
          )}
          {permission === 'granted' && (
            <button
              onClick={testNotification}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Test Notification
            </button>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Notification Preferences</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={irrigationReminders}
              onChange={(e) => setIrrigationReminders(e.target.checked)}
              className="w-5 h-5 text-primary-600"
            />
            <span className="text-gray-700">Irrigation Reminders</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={weatherAlerts}
              onChange={(e) => setWeatherAlerts(e.target.checked)}
              className="w-5 h-5 text-primary-600"
            />
            <span className="text-gray-700">Weather Alerts</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={schemeUpdates}
              onChange={(e) => setSchemeUpdates(e.target.checked)}
              className="w-5 h-5 text-primary-600"
            />
            <span className="text-gray-700">Government Scheme Updates</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={sowingAlerts}
              onChange={(e) => setSowingAlerts(e.target.checked)}
              className="w-5 h-5 text-primary-600"
            />
            <span className="text-gray-700">Suitable Sowing Time Alerts</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={fertilizerAlerts}
              onChange={(e) => setFertilizerAlerts(e.target.checked)}
              className="w-5 h-5 text-primary-600"
            />
            <span className="text-gray-700">Next Fertilizer Date Alerts</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={priceAlerts}
              onChange={(e) => setPriceAlerts(e.target.checked)}
              className="w-5 h-5 text-primary-600"
            />
            <span className="text-gray-700">Price Rise Alerts</span>
          </label>
        </div>
      </div>

      {/* Smart Alerts Testing */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Smart Alerts</h3>
        <div className="space-y-3">
          <button
            onClick={testSmartAlerts}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Run All Smart Alerts Check
          </button>
          {alertStatus && (
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{alertStatus}</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              onClick={testSowingAlert}
              className="bg-blue-100 text-blue-800 px-3 py-2 rounded text-sm hover:bg-blue-200"
            >
              Test Sowing
            </button>
            <button
              onClick={testIrrigationAlert}
              className="bg-cyan-100 text-cyan-800 px-3 py-2 rounded text-sm hover:bg-cyan-200"
            >
              Test Irrigation
            </button>
            <button
              onClick={testFertilizerAlert}
              className="bg-green-100 text-green-800 px-3 py-2 rounded text-sm hover:bg-green-200"
            >
              Test Fertilizer
            </button>
            <button
              onClick={testWeatherAlert}
              className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm hover:bg-yellow-200"
            >
              Test Weather
            </button>
            <button
              onClick={testPriceAlert}
              className="bg-purple-100 text-purple-800 px-3 py-2 rounded text-sm hover:bg-purple-200"
            >
              Test Price
            </button>
          </div>
        </div>
      </div>

      {/* Daily Reminder */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Daily Reminder</h3>
        <div className="flex items-center gap-4">
          <input
            type="time"
            value={dailyReminderTime}
            onChange={(e) => setDailyReminderTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded"
          />
          <button
            onClick={scheduleDailyReminder}
            className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Schedule Reminder
          </button>
        </div>
      </div>

      {/* Scheduled Notifications */}
      {scheduled.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Scheduled Notifications</h3>
          <div className="space-y-2">
            {scheduled.map((notif) => (
              <div
                key={notif.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900">{notif.title}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(notif.scheduledDate).toLocaleString()}
                    {notif.repeat && ' (Daily)'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await notificationManager.cancelNotification(notif.id);
                    loadScheduled();
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;

