// IndexedDB utilities for offline storage

const DB_NAME = 'FarmerAssistantDB';
const DB_VERSION = 1;

// Open database connection
export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      const stores = [
        'cropRecommendations',
        'fertilizerRecommendations',
        'diseaseDetections',
        'weather',
        'schemes',
        'chatHistory',
        'notifications'
      ];
      
      stores.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      });
    };
  });
};

// Save data to IndexedDB
export const saveToDB = async (storeName, key, data) => {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).put({
      data,
      timestamp: Date.now()
    }, key);
    return true;
  } catch (error) {
    console.error(`Error saving to ${storeName}:`, error);
    return false;
  }
};

// Get data from IndexedDB
export const getFromDB = async (storeName, key) => {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const result = await tx.objectStore(storeName).get(key);
    return result?.data || null;
  } catch (error) {
    console.error(`Error getting from ${storeName}:`, error);
    return null;
  }
};

// Get all data from a store
export const getAllFromDB = async (storeName) => {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result.map(item => item.data || item);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting all from ${storeName}:`, error);
    return [];
  }
};

// Delete data from IndexedDB
export const deleteFromDB = async (storeName, key) => {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).delete(key);
    return true;
  } catch (error) {
    console.error(`Error deleting from ${storeName}:`, error);
    return false;
  }
};

// Clear all data from a store
export const clearStore = async (storeName) => {
  try {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    return true;
  } catch (error) {
    console.error(`Error clearing ${storeName}:`, error);
    return false;
  }
};

// Check if offline
export const isOffline = () => {
  return !navigator.onLine;
};

// Check if data is stale (older than maxAge)
export const isStale = (timestamp, maxAge = 3600000) => {
  return Date.now() - timestamp > maxAge;
};

// Save crop recommendation
export const saveCropRecommendation = async (data) => {
  const key = `crop_${Date.now()}`;
  return await saveToDB('cropRecommendations', key, data);
};

// Get crop recommendations
export const getCropRecommendations = async () => {
  return await getAllFromDB('cropRecommendations');
};

// Save fertilizer recommendation
export const saveFertilizerRecommendation = async (data) => {
  const key = `fertilizer_${Date.now()}`;
  return await saveToDB('fertilizerRecommendations', key, data);
};

// Get fertilizer recommendations
export const getFertilizerRecommendations = async () => {
  return await getAllFromDB('fertilizerRecommendations');
};

// Save disease detection
export const saveDiseaseDetection = async (data) => {
  const key = `disease_${Date.now()}`;
  return await saveToDB('diseaseDetections', key, data);
};

// Get disease detections
export const getDiseaseDetections = async () => {
  return await getAllFromDB('diseaseDetections');
};

// Save weather data
export const saveWeather = async (lat, lon, data) => {
  const key = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
  return await saveToDB('weather', key, { data, timestamp: Date.now() });
};

// Get weather data
export const getWeather = async (lat, lon) => {
  const key = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
  const result = await getFromDB('weather', key);
  if (result && !isStale(result.timestamp, 3600000)) { // 1 hour cache
    return result.data;
  }
  return null;
};

