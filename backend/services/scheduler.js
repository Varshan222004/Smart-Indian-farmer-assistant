const farmerAdviceService = require('./farmerAdviceService');

class Scheduler {
  constructor() {
    this.intervals = [];
    this.isRunning = false;
  }

  // Start hourly farmer advice notifications
  startHourlyAdvice() {
    if (this.isRunning) {
      console.log('[Scheduler] Hourly advice already running');
      return;
    }

    console.log('[Scheduler] Starting hourly farmer advice service...');
    
    // Send immediately on start
    farmerAdviceService.sendAdviceToAllUsers().catch(err => {
      console.error('[Scheduler] Error in initial advice send:', err);
    });

    // Then send every hour (3600000 ms)
    const interval = setInterval(() => {
      console.log('[Scheduler] Running scheduled hourly advice...');
      farmerAdviceService.sendAdviceToAllUsers().catch(err => {
        console.error('[Scheduler] Error in scheduled advice send:', err);
      });
    }, 60 * 60 * 1000); // 1 hour

    this.intervals.push(interval);
    this.isRunning = true;
    
    console.log('[Scheduler] Hourly advice service started (runs every 60 minutes)');
  }

  // Stop all scheduled tasks
  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
    console.log('[Scheduler] All scheduled tasks stopped');
  }

  // Get status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeIntervals: this.intervals.length
    };
  }
}

// Create singleton instance
const scheduler = new Scheduler();

module.exports = scheduler;

