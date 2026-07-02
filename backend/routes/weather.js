const express = require('express');
const axios = require('axios');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/weather
// @desc    Get weather forecast and irrigation advice
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        message: 'Weather API key not configured',
        weather: null,
        irrigationAdvice: {
          shouldIrrigate: null,
          reason: 'Weather service not configured'
        }
      });
    }

    const currentUrl = `${process.env.OPENWEATHER_API_URL || 'https://api.openweathermap.org/data/2.5/weather'}`;
    const forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(currentUrl, {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: 'metric'
        },
        timeout: 10000
      }),
      axios.get(forecastUrl, {
        params: {
          lat,
          lon,
          appid: apiKey,
          units: 'metric',
          cnt: 8 // roughly next 24 hours (3h intervals)
        },
        timeout: 10000
      })
    ]);

    const current = currentResponse.data;
    const forecastList = forecastResponse.data.list || [];
    const firstForecast = forecastList[0] || {};
    const rainVolume = firstForecast?.rain?.['3h'] || 0;
    const precipitationProb = (firstForecast?.pop || 0) * 100;

    // Simple irrigation advice logic
    const expectedRainfall = rainVolume; // Expected rainfall in mm (next 3h)
    const shouldIrrigate = !(precipitationProb > 50 || expectedRainfall > 5);

    const irrigationAdvice = {
      shouldIrrigate,
      reason: shouldIrrigate
        ? 'Weather conditions are suitable for irrigation'
        : `High chance of rain (${precipitationProb.toFixed(0)}% probability, ${expectedRainfall.toFixed(1)}mm expected). Skip irrigation.`,
      precipitationProbability: precipitationProb,
      expectedRainfall: expectedRainfall
    };

    res.json({
      current: {
        temperature: current.main?.temp,
        humidity: current.main?.humidity,
        pressure: current.main?.pressure,
        windSpeed: current.wind?.speed,
        description: current.weather?.[0]?.description,
        icon: current.weather?.[0]?.icon
      },
      forecast: {
        today: {
          high: forecastList.length ? Math.max(...forecastList.map(f => f.main.temp_max)) : current.main?.temp,
          low: forecastList.length ? Math.min(...forecastList.map(f => f.main.temp_min)) : current.main?.temp,
          precipitation: expectedRainfall,
          precipitationProbability: precipitationProb
        }
      },
      irrigationAdvice
    });
  } catch (error) {
    console.error('Weather fetch error:', error.message);
    if (error.response) {
      const upstreamStatus = error.response.status;
      const statusCode = upstreamStatus === 401 ? 502 : upstreamStatus;
      return res.status(statusCode).json({
        message: 'Error fetching weather data',
        error: error.response.data
      });
    }
    res.status(500).json({
      message: 'Error fetching weather data',
      error: error.message
    });
  }
});

module.exports = router;

