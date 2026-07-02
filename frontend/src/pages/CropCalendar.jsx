import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import smartAlertsManager from '../utils/smartAlerts';
import notificationManager from '../utils/notifications';

// Comprehensive crop calendar data
const CROP_CALENDAR = {
  rice: {
    name: 'Rice',
    sowing: [6, 7, 8, 11, 12], // Jun, Jul, Aug, Nov, Dec
    fertilizing: [
      { month: 6, week: 3, fertilizer: 'Basal - DAP + Urea', description: 'Apply at time of sowing' },
      { month: 7, week: 2, fertilizer: 'First Top Dressing - Urea', description: '20-25 days after sowing' },
      { month: 7, week: 4, fertilizer: 'Second Top Dressing - Urea', description: '40-45 days after sowing' },
      { month: 8, week: 2, fertilizer: 'Third Top Dressing - Urea', description: '60-65 days after sowing' }
    ],
    irrigation: [6, 7, 8, 9, 10, 11, 12],
    harvest: [9, 10, 1, 2], // Sep, Oct, Jan, Feb
    pestControl: [
      { month: 7, period: 'Early', pests: 'Stem borer, Leaf folder', treatment: 'Spray insecticides' },
      { month: 8, period: 'Mid', pests: 'Brown plant hopper, Blast', treatment: 'Apply systemic insecticides' },
      { month: 9, period: 'Late', pests: 'Grain borer', treatment: 'Pre-harvest pest management' }
    ],
    lifecycle: 120 // days
  },
  wheat: {
    name: 'Wheat',
    sowing: [10, 11, 12], // Oct, Nov, Dec
    fertilizing: [
      { month: 10, week: 4, fertilizer: 'Basal - DAP + Urea', description: 'Apply at sowing' },
      { month: 11, week: 3, fertilizer: 'First Top Dressing - Urea', description: '25-30 days after sowing' },
      { month: 12, week: 2, fertilizer: 'Second Top Dressing - Urea', description: '50-55 days after sowing' }
    ],
    irrigation: [10, 11, 12, 1, 2, 3],
    harvest: [3, 4], // Mar, Apr
    pestControl: [
      { month: 11, period: 'Early', pests: 'Aphids, Termites', treatment: 'Seed treatment, foliar spray' },
      { month: 12, period: 'Mid', pests: 'Rust, Powdery mildew', treatment: 'Fungicide application' },
      { month: 2, period: 'Late', pests: 'Aphids, Armyworm', treatment: 'Insecticide spray' }
    ],
    lifecycle: 150
  },
  maize: {
    name: 'Maize',
    sowing: [5, 6, 7], // May, Jun, Jul
    fertilizing: [
      { month: 5, week: 3, fertilizer: 'Basal - NPK', description: 'At sowing' },
      { month: 6, week: 3, fertilizer: 'First Top Dressing - Urea', description: '20-25 days after sowing' },
      { month: 7, week: 2, fertilizer: 'Second Top Dressing - Urea', description: '45-50 days after sowing' }
    ],
    irrigation: [5, 6, 7, 8],
    harvest: [8, 9], // Aug, Sep
    pestControl: [
      { month: 6, period: 'Early', pests: 'Stem borer, Fall armyworm', treatment: 'Early stage pest control' },
      { month: 7, period: 'Mid', pests: 'Earworm, Corn borer', treatment: 'Mid-season management' }
    ],
    lifecycle: 90
  },
  cotton: {
    name: 'Cotton',
    sowing: [4, 5, 6], // Apr, May, Jun
    fertilizing: [
      { month: 4, week: 4, fertilizer: 'Basal - DAP + Urea', description: 'At sowing' },
      { month: 6, week: 2, fertilizer: 'First Top Dressing - Urea', description: '30-35 days' },
      { month: 7, week: 2, fertilizer: 'Second Top Dressing - Urea', description: '60-65 days' },
      { month: 8, week: 1, fertilizer: 'Third Top Dressing - Potash', description: '90-95 days' }
    ],
    irrigation: [4, 5, 6, 7, 8, 9, 10],
    harvest: [10, 11, 12], // Oct, Nov, Dec
    pestControl: [
      { month: 5, period: 'Early', pests: 'Aphids, Thrips', treatment: 'Early pest management' },
      { month: 7, period: 'Mid', pests: 'Bollworm, Pink bollworm', treatment: 'Critical pest control' },
      { month: 9, period: 'Late', pests: 'Whitefly, Bollworm', treatment: 'Late season control' }
    ],
    lifecycle: 180
  },
  tomato: {
    name: 'Tomato',
    sowing: [6, 7, 8, 9, 10], // Jun, Jul, Aug, Sep, Oct
    fertilizing: [
      { month: 6, week: 4, fertilizer: 'Basal - NPK', description: 'At transplanting' },
      { month: 7, week: 3, fertilizer: 'First Top Dressing - Urea', description: '15-20 days' },
      { month: 8, week: 2, fertilizer: 'Second Top Dressing - NPK', description: '30-35 days' },
      { month: 8, week: 4, fertilizer: 'Third Top Dressing - Potash', description: '60-65 days' }
    ],
    irrigation: [6, 7, 8, 9, 10, 11, 12],
    harvest: [9, 10, 11, 12, 1, 2], // Sep, Oct, Nov, Dec, Jan, Feb
    pestControl: [
      { month: 7, period: 'Early', pests: 'Aphids, Whitefly', treatment: 'Early pest control' },
      { month: 8, period: 'Mid', pests: 'Fruit borer, Leaf miner', treatment: 'Mid-season management' },
      { month: 9, period: 'Late', pests: 'Thrips, Mites', treatment: 'Late season control' }
    ],
    lifecycle: 90
  },
  potato: {
    name: 'Potato',
    sowing: [10, 11, 12, 1], // Oct, Nov, Dec, Jan
    fertilizing: [
      { month: 10, week: 4, fertilizer: 'Basal - DAP + Urea', description: 'At planting' },
      { month: 11, week: 3, fertilizer: 'Top Dressing - Urea', description: '30-35 days after planting' },
      { month: 12, week: 2, fertilizer: 'Second Top Dressing - Potash', description: '60-65 days' }
    ],
    irrigation: [10, 11, 12, 1, 2],
    harvest: [2, 3], // Feb, Mar
    pestControl: [
      { month: 11, period: 'Early', pests: 'Aphids, Cutworm', treatment: 'Early pest management' },
      { month: 12, period: 'Mid', pests: 'Late blight, Early blight', treatment: 'Disease control' }
    ],
    lifecycle: 120
  },
  onion: {
    name: 'Onion',
    sowing: [10, 11, 12], // Oct, Nov, Dec
    fertilizing: [
      { month: 10, week: 4, fertilizer: 'Basal - DAP', description: 'At transplanting' },
      { month: 11, week: 3, fertilizer: 'First Top Dressing - Urea', description: '30 days' },
      { month: 12, week: 2, fertilizer: 'Second Top Dressing - Urea', description: '60 days' }
    ],
    irrigation: [10, 11, 12, 1, 2],
    harvest: [2, 3, 4], // Feb, Mar, Apr
    pestControl: [
      { month: 11, period: 'Early', pests: 'Thrips, Onion fly', treatment: 'Early pest control' },
      { month: 12, period: 'Mid', pests: 'Purple blotch, Downy mildew', treatment: 'Disease management' }
    ],
    lifecycle: 120
  }
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CropCalendar = () => {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const cropData = selectedCrop ? CROP_CALENDAR[selectedCrop.toLowerCase()] : null;

  // Check for calendar-based notifications
  useEffect(() => {
    if (notificationsEnabled && cropData) {
      checkCalendarNotifications();
    }
  }, [selectedCrop, currentMonth, notificationsEnabled]);

  const checkCalendarNotifications = async () => {
    if (!cropData) return;

    const cropName = cropData.name;

    // Check sowing time
    if (cropData.sowing.includes(currentMonth)) {
      await notificationManager.showNotification('🌱 Sowing Time Alert', {
        body: `It's the optimal time to sow ${cropName}. Check the calendar for details.`,
        tag: `calendar_sowing_${selectedCrop}`,
        requireInteraction: true,
        onClick: () => window.location.href = '/dashboard/crop-calendar'
      });
    }

    // Check fertilizing schedule
    const currentFertilizer = cropData.fertilizing.find(f => f.month === currentMonth);
    if (currentFertilizer) {
      await notificationManager.showNotification('🌾 Fertilizer Schedule', {
        body: `Time to apply ${currentFertilizer.fertilizer} for ${cropName}. ${currentFertilizer.description}`,
        tag: `calendar_fertilizer_${selectedCrop}_${currentMonth}`,
        requireInteraction: true,
        onClick: () => window.location.href = '/dashboard/crop-calendar'
      });
    }

    // Check pest control
    const currentPest = cropData.pestControl.find(p => p.month === currentMonth);
    if (currentPest) {
      await notificationManager.showNotification('🐛 Pest Control Alert', {
        body: `${cropName}: ${currentPest.pests} - ${currentPest.treatment}`,
        tag: `calendar_pest_${selectedCrop}_${currentMonth}`,
        requireInteraction: true,
        onClick: () => window.location.href = '/dashboard/crop-calendar'
      });
    }

    // Check harvest time
    if (cropData.harvest.includes(currentMonth)) {
      await notificationManager.showNotification('🌾 Harvest Time', {
        body: `Harvest time for ${cropName}! Prepare for harvesting.`,
        tag: `calendar_harvest_${selectedCrop}`,
        requireInteraction: true,
        onClick: () => window.location.href = '/dashboard/crop-calendar'
      });
    }
  };

  const getMonthStatus = (month) => {
    if (!cropData) return null;

    const status = {
      isSowing: cropData.sowing.includes(month),
      isFertilizing: cropData.fertilizing.some(f => f.month === month),
      isIrrigation: cropData.irrigation.includes(month),
      isHarvest: cropData.harvest.includes(month),
      isPestControl: cropData.pestControl.some(p => p.month === month),
      isCurrent: month === currentMonth
    };

    return status;
  };

  const getMonthColor = (status) => {
    if (!status) return 'bg-gray-100';
    if (status.isCurrent) return 'bg-blue-200 border-2 border-blue-500';
    if (status.isSowing) return 'bg-green-100';
    if (status.isHarvest) return 'bg-yellow-100';
    if (status.isFertilizing || status.isPestControl) return 'bg-orange-100';
    if (status.isIrrigation) return 'bg-cyan-100';
    return 'bg-gray-50';
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{t('cropCalendar.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('cropCalendar.description')}</p>
      </div>

      {/* Crop Selection */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 w-full sm:min-w-[200px]">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              {t('cropCalendar.selectCrop')}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('cropCalendar.chooseCrop')}</option>
              {Object.keys(CROP_CALENDAR).map((key) => (
                <option key={key} value={key}>
                  {CROP_CALENDAR[key].name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <input
              type="checkbox"
              id="notifications"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="notifications" className="text-xs sm:text-sm text-gray-700 cursor-pointer">
              {t('cropCalendar.enableNotifications')}
            </label>
          </div>
        </div>
      </div>

      {!cropData ? (
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
          <p className="text-gray-500 text-base sm:text-lg">{t('cropCalendar.selectCropToView')}</p>
        </div>
      ) : (
        <>
          {/* Lifecycle Overview */}
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 overflow-x-auto">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">{cropData.name} {t('cropCalendar.lifecycle')}</h2>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 sm:gap-2 min-w-[400px] sm:min-w-0">
              {MONTHS.map((month, index) => {
                const monthNum = index + 1;
                const status = getMonthStatus(monthNum);
                return (
                  <div
                    key={monthNum}
                    className={`p-1.5 sm:p-2 md:p-3 rounded text-center ${getMonthColor(status)}`}
                  >
                    <div className="font-semibold mb-0.5 sm:mb-1 text-[10px] sm:text-xs md:text-sm">{month.substring(0, 3)}</div>
                    <div className="space-y-0.5 sm:space-y-1">
                      {status?.isSowing && <div className="text-green-700 text-[9px] sm:text-xs">🌱 <span className="hidden sm:inline">{t('cropCalendar.sow')}</span></div>}
                      {status?.isFertilizing && <div className="text-orange-700 text-[9px] sm:text-xs">🌾 <span className="hidden sm:inline">{t('cropCalendar.fert')}</span></div>}
                      {status?.isHarvest && <div className="text-yellow-700 text-[9px] sm:text-xs">✂️ <span className="hidden sm:inline">{t('cropCalendar.harvest')}</span></div>}
                      {status?.isPestControl && <div className="text-red-700 text-[9px] sm:text-xs">🐛 <span className="hidden sm:inline">{t('cropCalendar.pest')}</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              {t('cropCalendar.lifecycleLabel')} {cropData.lifecycle} {t('cropCalendar.days')} | {t('cropCalendar.currentMonth')}: {MONTHS[currentMonth - 1]}
            </div>
          </div>

          {/* Detailed Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Sowing Schedule */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-lg sm:text-xl">🌱</span> <span>{t('cropCalendar.sowingTime')}</span>
              </h3>
              <div className="space-y-2">
                {cropData.sowing.map((month) => (
                  <div
                    key={month}
                    className={`p-2.5 sm:p-3 rounded ${
                      month === currentMonth ? 'bg-green-100 border-2 border-green-500' : 'bg-green-50'
                    }`}
                  >
                    <div className="font-medium text-sm sm:text-base">{MONTHS[month - 1]}</div>
                    {month === currentMonth && (
                      <div className="text-xs sm:text-sm text-green-700 mt-1">← {t('cropCalendar.currentMonth')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fertilizing Schedule */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-lg sm:text-xl">🌾</span> <span>{t('cropCalendar.fertilizingSchedule')}</span>
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {cropData.fertilizing.map((fert, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 sm:p-3 rounded ${
                      fert.month === currentMonth ? 'bg-orange-100 border-2 border-orange-500' : 'bg-orange-50'
                    }`}
                  >
                    <div className="font-medium text-sm sm:text-base">{MONTHS[fert.month - 1]} - Week {fert.week}</div>
                    <div className="text-xs sm:text-sm text-gray-700 mt-1">{fert.fertilizer}</div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-1">{fert.description}</div>
                    {fert.month === currentMonth && (
                      <div className="text-xs sm:text-sm text-orange-700 mt-1 font-semibold">← {t('cropCalendar.dueNow')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Irrigation Schedule */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-lg sm:text-xl">💧</span> <span>{t('cropCalendar.irrigationSchedule')}</span>
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-1.5 sm:gap-2">
                {MONTHS.map((month, index) => {
                  const monthNum = index + 1;
                  const isIrrigation = cropData.irrigation.includes(monthNum);
                  return (
                    <div
                      key={monthNum}
                      className={`p-1.5 sm:p-2 rounded text-center text-xs sm:text-sm ${
                        isIrrigation
                          ? monthNum === currentMonth
                            ? 'bg-cyan-100 border-2 border-cyan-500'
                            : 'bg-cyan-50'
                          : 'bg-gray-50'
                      }`}
                    >
                      {month.substring(0, 3)}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-2 sm:mt-3">
                {t('cropCalendar.irrigationNote')}
              </p>
            </div>

            {/* Harvest Schedule */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-lg sm:text-xl">✂️</span> <span>{t('cropCalendar.harvestTime')}</span>
              </h3>
              <div className="space-y-2">
                {cropData.harvest.map((month) => (
                  <div
                    key={month}
                    className={`p-2.5 sm:p-3 rounded ${
                      month === currentMonth ? 'bg-yellow-100 border-2 border-yellow-500' : 'bg-yellow-50'
                    }`}
                  >
                    <div className="font-medium text-sm sm:text-base">{MONTHS[month - 1]}</div>
                    {month === currentMonth && (
                      <div className="text-xs sm:text-sm text-yellow-700 mt-1">{t('cropCalendar.harvestNow')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pest Control Schedule */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:col-span-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="text-lg sm:text-xl">🐛</span> <span>{t('cropCalendar.pestControl')}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {cropData.pestControl.map((pest, idx) => (
                  <div
                    key={idx}
                    className={`p-3 sm:p-4 rounded ${
                      pest.month === currentMonth ? 'bg-red-100 border-2 border-red-500' : 'bg-red-50'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">
                      {MONTHS[pest.month - 1]} - {pest.period}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 mt-2">
                      <strong>{t('cropCalendar.pests')}:</strong> {pest.pests}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">
                      <strong>{t('cropCalendar.treatment')}:</strong> {pest.treatment}
                    </div>
                    {pest.month === currentMonth && (
                      <div className="text-xs sm:text-sm text-red-700 mt-2 font-semibold">{t('cropCalendar.actionRequired')}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CropCalendar;

