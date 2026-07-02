// Smart Notifications System

class NotificationManager {
  constructor() {
    this.permission = null;
    this.scheduledNotifications = [];
    this.init();
  }

  async init() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    // Check current permission
    this.permission = Notification.permission;

    // Request permission if not granted
    if (this.permission === 'default') {
      this.permission = await this.requestPermission();
    }

    // Load scheduled notifications from IndexedDB
    await this.loadScheduledNotifications();

    // Set up periodic checks
    this.startPeriodicChecks();
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Show immediate notification
  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: options.tag || 'default',
      requireInteraction: options.requireInteraction || false,
      ...options
    });

    // Handle click
    if (options.onClick) {
      notification.onclick = options.onClick;
    } else {
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Auto close after 5 seconds if not requireInteraction
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  }

  // Schedule notification
  async scheduleNotification(title, options = {}) {
    const {
      delay = 0, // milliseconds
      date = null, // Date object
      repeat = false, // repeat daily
      ...notificationOptions
    } = options;

    if (!date && delay <= 0) {
      console.error('Must provide either date or delay > 0');
      return null;
    }

    const scheduledDate = date || new Date(Date.now() + delay);
    const notificationId = `notif_${Date.now()}_${Math.random()}`;

    const scheduled = {
      id: notificationId,
      title,
      options: notificationOptions,
      scheduledDate: scheduledDate.getTime(),
      repeat,
      createdAt: Date.now()
    };

    this.scheduledNotifications.push(scheduled);
    await this.saveScheduledNotification(scheduled);

    // Set timeout for notification
    const timeUntil = scheduledDate.getTime() - Date.now();
    if (timeUntil > 0) {
      setTimeout(() => {
        this.triggerScheduledNotification(notificationId);
      }, timeUntil);
    }

    return notificationId;
  }

  async triggerScheduledNotification(id) {
    const scheduled = this.scheduledNotifications.find(n => n.id === id);
    if (!scheduled) return;

    this.showNotification(scheduled.title, scheduled.options);

    // Handle repeat
    if (scheduled.repeat) {
      const nextDate = new Date(scheduled.scheduledDate + 24 * 60 * 60 * 1000); // Next day
      scheduled.scheduledDate = nextDate.getTime();
      const timeUntil = nextDate.getTime() - Date.now();
      if (timeUntil > 0) {
        setTimeout(() => {
          this.triggerScheduledNotification(id);
        }, timeUntil);
      }
    } else {
      // Remove from scheduled list
      this.scheduledNotifications = this.scheduledNotifications.filter(n => n.id !== id);
      await this.deleteScheduledNotification(id);
    }
  }

  // Smart notification types
  async notifyIrrigationTime(crop, daysSinceLastIrrigation) {
    return this.showNotification(
      '🌾 Irrigation Reminder',
      {
        body: `Your ${crop} crop needs irrigation. It's been ${daysSinceLastIrrigation} days since last irrigation.`,
        tag: 'irrigation',
        requireInteraction: true,
        onClick: () => {
          window.location.href = '/dashboard/weather';
        }
      }
    );
  }

  async notifyFertilizerTime(crop, fertilizer, daysUntil) {
    return this.showNotification(
      '🌱 Fertilizer Reminder',
      {
        body: `Time to apply ${fertilizer} to your ${crop} crop in ${daysUntil} days.`,
        tag: 'fertilizer',
        requireInteraction: true,
        onClick: () => {
          window.location.href = '/dashboard/fertilizer';
        }
      }
    );
  }

  async notifyWeatherAlert(alert) {
    return this.showNotification(
      '⚠️ Weather Alert',
      {
        body: alert.message || 'Important weather update for your area.',
        tag: 'weather',
        requireInteraction: true,
        onClick: () => {
          window.location.href = '/dashboard/weather';
        }
      }
    );
  }

  async notifyDiseaseDetected(disease, crop) {
    return this.showNotification(
      '🔬 Disease Detected',
      {
        body: `${disease} detected in your ${crop} crop. Check treatment recommendations.`,
        tag: 'disease',
        requireInteraction: true,
        onClick: () => {
          window.location.href = '/dashboard/disease';
        }
      }
    );
  }

  async notifyNewScheme(schemeName) {
    return this.showNotification(
      '🏛️ New Government Scheme',
      {
        body: `New scheme available: ${schemeName}. Check eligibility now!`,
        tag: 'scheme',
        onClick: () => {
          window.location.href = '/dashboard/government-schemes';
        }
      }
    );
  }

  // Schedule daily reminders
  async scheduleDailyReminder(time, title, body) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduledDate < now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    return this.scheduleNotification(title, {
      date: scheduledDate,
      repeat: true,
      body,
      tag: 'daily-reminder'
    });
  }

  // Periodic checks for smart notifications
  startPeriodicChecks() {
    // Check every hour
    setInterval(() => {
      this.checkScheduledNotifications();
    }, 60 * 60 * 1000);

    // Check immediately
    this.checkScheduledNotifications();
  }

  async checkScheduledNotifications() {
    const now = Date.now();
    const due = this.scheduledNotifications.filter(
      n => n.scheduledDate <= now && n.scheduledDate > now - 60000 // Within last minute
    );

    for (const notification of due) {
      await this.triggerScheduledNotification(notification.id);
    }
  }

  // IndexedDB operations
  async saveScheduledNotification(notification) {
    try {
      const db = await this.openDB();
      const tx = db.transaction('notifications', 'readwrite');
      await tx.objectStore('notifications').put(notification, notification.id);
    } catch (error) {
      console.error('Error saving scheduled notification:', error);
    }
  }

  async loadScheduledNotifications() {
    try {
      const db = await this.openDB();
      const tx = db.transaction('notifications', 'readonly');
      const store = tx.objectStore('notifications');
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          this.scheduledNotifications = request.result || [];
          // Re-schedule all notifications
          this.scheduledNotifications.forEach(notif => {
            const timeUntil = notif.scheduledDate - Date.now();
            if (timeUntil > 0) {
              setTimeout(() => {
                this.triggerScheduledNotification(notif.id);
              }, timeUntil);
            }
          });
          resolve(this.scheduledNotifications);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
      return [];
    }
  }

  async deleteScheduledNotification(id) {
    try {
      const db = await this.openDB();
      const tx = db.transaction('notifications', 'readwrite');
      await tx.objectStore('notifications').delete(id);
    } catch (error) {
      console.error('Error deleting scheduled notification:', error);
    }
  }

  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FarmerAssistantDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications');
        }
      };
    });
  }

  // Cancel scheduled notification
  async cancelNotification(id) {
    this.scheduledNotifications = this.scheduledNotifications.filter(n => n.id !== id);
    await this.deleteScheduledNotification(id);
  }

  // Get all scheduled notifications
  getScheduledNotifications() {
    return [...this.scheduledNotifications];
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;

