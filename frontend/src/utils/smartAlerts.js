// Smart Alert System for Farming Notifications
import notificationManager from './notifications';
import api from './api';

// Crop sowing calendar (month-based, can be enhanced with location-specific data)
const SOWING_CALENDAR = {
  rice: { months: [6, 7, 8, 11, 12], name: 'Rice' },
  wheat: { months: [10, 11, 12], name: 'Wheat' },
  maize: { months: [5, 6, 7], name: 'Maize' },
  cotton: { months: [4, 5, 6], name: 'Cotton' },
  sugarcane: { months: [2, 3, 4], name: 'Sugarcane' },
  potato: { months: [10, 11, 12, 1], name: 'Potato' },
  tomato: { months: [6, 7, 8, 9, 10], name: 'Tomato' },
  onion: { months: [10, 11, 12], name: 'Onion' },
  chilli: { months: [6, 7, 8], name: 'Chilli' },
  brinjal: { months: [6, 7, 8], name: 'Brinjal' }
};

// Fertilizer schedule (days after sowing)
const FERTILIZER_SCHEDULE = {
  rice: [
    { days: 20, fertilizer: 'Urea', amount: '50 kg/acre' },
    { days: 40, fertilizer: 'DAP', amount: '30 kg/acre' },
    { days: 60, fertilizer: 'Potash', amount: '25 kg/acre' }
  ],
  wheat: [
    { days: 25, fertilizer: 'Urea', amount: '60 kg/acre' },
    { days: 50, fertilizer: 'DAP', amount: '40 kg/acre' }
  ],
  maize: [
    { days: 20, fertilizer: 'Urea', amount: '45 kg/acre' },
    { days: 45, fertilizer: 'NPK', amount: '50 kg/acre' }
  ],
  cotton: [
    { days: 30, fertilizer: 'Urea', amount: '55 kg/acre' },
    { days: 60, fertilizer: 'DAP', amount: '35 kg/acre' },
    { days: 90, fertilizer: 'Potash', amount: '30 kg/acre' }
  ],
  tomato: [
    { days: 15, fertilizer: 'Urea', amount: '40 kg/acre' },
    { days: 30, fertilizer: 'NPK', amount: '45 kg/acre' },
    { days: 60, fertilizer: 'Potash', amount: '25 kg/acre' }
  ]
};

// Irrigation schedule (days between irrigations)
const IRRIGATION_SCHEDULE = {
  rice: 3, // every 3 days
  wheat: 7, // every 7 days
  maize: 5, // every 5 days
  cotton: 6, // every 6 days
  tomato: 4, // every 4 days
  potato: 5, // every 5 days
  default: 5 // default 5 days
};

class SmartAlertsManager {
  constructor() {
    this.userCrops = [];
    this.lastIrrigationDates = {};
    this.sowingDates = {};
    this.lastFertilizerDates = {};
    this.priceAlerts = {};
    this.checkInterval = null;
  }

  // Initialize with user data
  async initialize(userData) {
    this.userCrops = userData?.favoriteCrops || [];
    await this.loadStoredData();
    this.startPeriodicChecks();
  }

  // Load stored data from IndexedDB
  async loadStoredData() {
    try {
      const db = await this.openDB();
      const tx = db.transaction('farmingData', 'readonly');
      const store = tx.objectStore('farmingData');
      
      const irrigationData = await this.getFromStore(store, 'irrigation');
      const sowingData = await this.getFromStore(store, 'sowing');
      const fertilizerData = await this.getFromStore(store, 'fertilizer');
      const priceData = await this.getFromStore(store, 'priceAlerts');

      this.lastIrrigationDates = irrigationData || {};
      this.sowingDates = sowingData || {};
      this.lastFertilizerDates = fertilizerData || {};
      this.priceAlerts = priceData || {};
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  async getFromStore(store, key) {
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveToStore(key, data) {
    try {
      const db = await this.openDB();
      const tx = db.transaction('farmingData', 'readwrite');
      await tx.objectStore('farmingData').put({ data, timestamp: Date.now() }, key);
    } catch (error) {
      console.error('Error saving to store:', error);
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FarmerAssistantDB', 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('farmingData')) {
          db.createObjectStore('farmingData');
        }
      };
    });
  }

  // Check for suitable sowing time
  async checkSowingTime() {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const alerts = [];

    for (const crop of this.userCrops) {
      const cropLower = crop.toLowerCase();
      const calendar = SOWING_CALENDAR[cropLower];
      
      if (calendar && calendar.months.includes(currentMonth)) {
        // Check if already sown this season
        const lastSowing = this.sowingDates[cropLower];
        const daysSinceSowing = lastSowing 
          ? Math.floor((Date.now() - lastSowing) / (1000 * 60 * 60 * 24))
          : Infinity;

        // Alert if not sown in last 30 days and it's sowing season
        if (daysSinceSowing > 30) {
          alerts.push({
            type: 'sowing',
            crop: calendar.name,
            message: `It's the perfect time to sow ${calendar.name}. Optimal sowing window is now!`,
            action: '/dashboard/crop'
          });
        }
      }
    }

    return alerts;
  }

  // Check irrigation schedule
  async checkIrrigationSchedule() {
    const alerts = [];

    for (const crop of this.userCrops) {
      const cropLower = crop.toLowerCase();
      const irrigationInterval = IRRIGATION_SCHEDULE[cropLower] || IRRIGATION_SCHEDULE.default;
      const lastIrrigation = this.lastIrrigationDates[cropLower];

      if (lastIrrigation) {
        const daysSince = Math.floor((Date.now() - lastIrrigation) / (1000 * 60 * 60 * 24));
        
        if (daysSince >= irrigationInterval) {
          alerts.push({
            type: 'irrigation',
            crop: crop,
            daysSince,
            message: `Your ${crop} crop needs irrigation. It's been ${daysSince} days since last irrigation.`,
            action: '/dashboard/weather'
          });
        }
      } else {
        // First irrigation reminder (assume sown 7 days ago)
        alerts.push({
          type: 'irrigation',
          crop: crop,
          daysSince: 7,
          message: `Time for first irrigation of your ${crop} crop.`,
          action: '/dashboard/weather'
        });
      }
    }

    return alerts;
  }

  // Check next fertilizer date
  async checkFertilizerSchedule() {
    const alerts = [];

    for (const crop of this.userCrops) {
      const cropLower = crop.toLowerCase();
      const schedule = FERTILIZER_SCHEDULE[cropLower];
      const sowingDate = this.sowingDates[cropLower];

      if (schedule && sowingDate) {
        const daysSinceSowing = Math.floor((Date.now() - sowingDate) / (1000 * 60 * 60 * 24));

        for (const fert of schedule) {
          const daysUntil = fert.days - daysSinceSowing;
          const lastFertDate = this.lastFertilizerDates[`${cropLower}_${fert.fertilizer}`];

          // Alert 2 days before and on the day
          if (daysUntil >= 0 && daysUntil <= 2 && !lastFertDate) {
            alerts.push({
              type: 'fertilizer',
              crop: crop,
              fertilizer: fert.fertilizer,
              amount: fert.amount,
              daysUntil: daysUntil === 0 ? 'today' : `in ${daysUntil} days`,
              message: `Apply ${fert.fertilizer} (${fert.amount}) to your ${crop} crop ${daysUntil === 0 ? 'today' : `in ${daysUntil} days`}.`,
              action: '/dashboard/fertilizer'
            });
          }
        }
      }
    }

    return alerts;
  }

  // Check weather threats
  async checkWeatherThreats(lat, lon) {
    try {
      const response = await api.get('/api/weather', {
        params: { lat, lon }
      });

      const weather = response.data;
      const alerts = [];

      // Check for extreme temperatures
      if (weather.current?.temperature) {
        const temp = weather.current.temperature;
        if (temp > 40) {
          alerts.push({
            type: 'weather',
            threat: 'extreme_heat',
            message: `Extreme heat warning: ${temp.toFixed(1)}°C. Protect your crops with shade and extra irrigation.`,
            action: '/dashboard/weather'
          });
        } else if (temp < 5) {
          alerts.push({
            type: 'weather',
            threat: 'frost',
            message: `Frost warning: ${temp.toFixed(1)}°C. Cover sensitive crops to prevent damage.`,
            action: '/dashboard/weather'
          });
        }
      }

      // Check for heavy rain
      if (weather.forecast?.today?.precipitation > 50) {
        alerts.push({
          type: 'weather',
          threat: 'heavy_rain',
          message: `Heavy rainfall expected (${weather.forecast.today.precipitation.toFixed(1)}mm). Ensure proper drainage.`,
          action: '/dashboard/weather'
        });
      }

      // Check for high precipitation probability
      if (weather.forecast?.today?.precipitationProbability > 80) {
        alerts.push({
          type: 'weather',
          threat: 'rain_alert',
          message: `High chance of rain (${weather.forecast.today.precipitationProbability.toFixed(0)}%). Plan irrigation accordingly.`,
          action: '/dashboard/weather'
        });
      }

      // Check for strong winds
      if (weather.current?.windSpeed > 15) {
        alerts.push({
          type: 'weather',
          threat: 'strong_wind',
          message: `Strong winds expected (${weather.current.windSpeed.toFixed(1)} m/s). Secure crops and structures.`,
          action: '/dashboard/weather'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error checking weather threats:', error);
      return [];
    }
  }

  // Check price rise alerts
  async checkPriceRiseAlerts() {
    try {
      const response = await api.get('/api/market');
      const marketData = response.data?.prices || [];
      const alerts = [];

      for (const crop of this.userCrops) {
        const cropPrice = marketData.find(p => 
          p.commodity?.toLowerCase().includes(crop.toLowerCase())
        );

        if (cropPrice) {
          const priceChange = cropPrice.change_percent || 0;
          const threshold = this.priceAlerts[crop]?.threshold || 5; // Default 5% threshold

          // Alert on significant price rise
          if (priceChange > threshold) {
            const lastAlert = this.priceAlerts[crop]?.lastAlert || 0;
            const hoursSinceAlert = (Date.now() - lastAlert) / (1000 * 60 * 60);

            // Only alert once per 24 hours
            if (hoursSinceAlert > 24) {
              alerts.push({
                type: 'price',
                crop: crop,
                price: cropPrice.price,
                change: priceChange,
                message: `Price alert: ${crop} price increased by ${priceChange.toFixed(1)}% to ₹${cropPrice.price}/quintal. Good time to sell!`,
                action: '/dashboard/market'
              });

              // Update last alert time
              this.priceAlerts[crop] = {
                threshold,
                lastAlert: Date.now()
              };
              await this.saveToStore('priceAlerts', this.priceAlerts);
            }
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking price alerts:', error);
      return [];
    }
  }

  // Check crop calendar events
  async checkCropCalendarEvents() {
    const alerts = [];
    const currentMonth = new Date().getMonth() + 1;
    
    // Import crop calendar data
    const CROP_CALENDAR = {
      rice: { sowing: [6, 7, 8, 11, 12], harvest: [9, 10, 1, 2] },
      wheat: { sowing: [10, 11, 12], harvest: [3, 4] },
      maize: { sowing: [5, 6, 7], harvest: [8, 9] },
      cotton: { sowing: [4, 5, 6], harvest: [10, 11, 12] },
      tomato: { sowing: [6, 7, 8, 9, 10], harvest: [9, 10, 11, 12, 1, 2] },
      potato: { sowing: [10, 11, 12, 1], harvest: [2, 3] },
      onion: { sowing: [10, 11, 12], harvest: [2, 3, 4] }
    };

    for (const crop of this.userCrops) {
      const cropLower = crop.toLowerCase();
      const calendar = CROP_CALENDAR[cropLower];
      
      if (calendar) {
        // Check harvest time
        if (calendar.harvest && calendar.harvest.includes(currentMonth)) {
          alerts.push({
            type: 'calendar',
            subType: 'harvest',
            crop: crop,
            message: `Harvest time for ${crop}! Prepare for harvesting this month.`,
            action: '/dashboard/crop-calendar'
          });
        }
      }
    }

    return alerts;
  }

  // Run all checks
  async runAllChecks(userLocation = null) {
    const allAlerts = [];

    // Check sowing time
    const sowingAlerts = await this.checkSowingTime();
    allAlerts.push(...sowingAlerts);

    // Check irrigation
    const irrigationAlerts = await this.checkIrrigationSchedule();
    allAlerts.push(...irrigationAlerts);

    // Check fertilizer
    const fertilizerAlerts = await this.checkFertilizerSchedule();
    allAlerts.push(...fertilizerAlerts);

    // Check weather threats (if location available)
    if (userLocation?.lat && userLocation?.lon) {
      const weatherAlerts = await this.checkWeatherThreats(userLocation.lat, userLocation.lon);
      allAlerts.push(...weatherAlerts);
    }

    // Check price alerts
    const priceAlerts = await this.checkPriceRiseAlerts();
    allAlerts.push(...priceAlerts);

    // Check crop calendar events
    const calendarAlerts = await this.checkCropCalendarEvents();
    allAlerts.push(...calendarAlerts);

    // Send notifications
    for (const alert of allAlerts) {
      await this.sendAlert(alert);
    }

    return allAlerts;
  }

  // Send alert notification
  async sendAlert(alert) {
    const icons = {
      sowing: '🌱',
      irrigation: '💧',
      fertilizer: '🌾',
      weather: '⚠️',
      price: '💰',
      calendar: '📅'
    };

    const icon = icons[alert.type] || '📢';
    const title = `${icon} ${this.getAlertTitle(alert.type)}`;

    notificationManager.showNotification(title, {
      body: alert.message,
      tag: `alert_${alert.type}_${alert.crop || alert.threat || alert.subType || 'general'}`,
      requireInteraction: true,
      onClick: () => {
        if (alert.action) {
          window.location.href = alert.action;
        }
        window.focus();
      }
    });
  }

  getAlertTitle(type) {
    const titles = {
      sowing: 'Suitable Sowing Time',
      irrigation: 'Irrigation Reminder',
      fertilizer: 'Fertilizer Schedule',
      weather: 'Weather Alert',
      price: 'Price Rise Alert',
      calendar: 'Crop Calendar Event'
    };
    return titles[type] || 'Farming Alert';
  }

  // Start periodic checks (every 6 hours)
  startPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Run immediately
    this.runAllChecks();

    // Then every 6 hours
    this.checkInterval = setInterval(() => {
      this.runAllChecks();
    }, 6 * 60 * 60 * 1000);
  }

  // Record irrigation
  async recordIrrigation(crop) {
    const cropLower = crop.toLowerCase();
    this.lastIrrigationDates[cropLower] = Date.now();
    await this.saveToStore('irrigation', this.lastIrrigationDates);
  }

  // Record sowing
  async recordSowing(crop) {
    const cropLower = crop.toLowerCase();
    this.sowingDates[cropLower] = Date.now();
    await this.saveToStore('sowing', this.sowingDates);
  }

  // Record fertilizer application
  async recordFertilizer(crop, fertilizer) {
    const key = `${crop.toLowerCase()}_${fertilizer}`;
    this.lastFertilizerDates[key] = Date.now();
    await this.saveToStore('fertilizer', this.lastFertilizerDates);
  }

  // Set price alert threshold
  async setPriceAlertThreshold(crop, threshold) {
    if (!this.priceAlerts[crop]) {
      this.priceAlerts[crop] = {};
    }
    this.priceAlerts[crop].threshold = threshold;
    await this.saveToStore('priceAlerts', this.priceAlerts);
  }
}

// Create singleton instance
const smartAlertsManager = new SmartAlertsManager();

export default smartAlertsManager;

