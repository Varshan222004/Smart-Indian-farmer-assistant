const express = require('express');
const axios = require('axios');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Crop cost data (per acre, in INR)
const CROP_COSTS = {
  rice: {
    seed: 2000,
    fertilizer: 8000,
    pesticide: 2000,
    labor: 12000,
    irrigation: 5000,
    harvesting: 8000,
    other: 3000,
    totalPerAcre: 40000
  },
  wheat: {
    seed: 1500,
    fertilizer: 6000,
    pesticide: 1500,
    labor: 10000,
    irrigation: 4000,
    harvesting: 6000,
    other: 2500,
    totalPerAcre: 31500
  },
  maize: {
    seed: 1800,
    fertilizer: 7000,
    pesticide: 1800,
    labor: 11000,
    irrigation: 4500,
    harvesting: 7000,
    other: 2700,
    totalPerAcre: 35800
  },
  cotton: {
    seed: 2500,
    fertilizer: 10000,
    pesticide: 5000,
    labor: 15000,
    irrigation: 6000,
    harvesting: 10000,
    other: 4000,
    totalPerAcre: 52500
  },
  sugarcane: {
    seed: 3000,
    fertilizer: 12000,
    pesticide: 3000,
    labor: 20000,
    irrigation: 8000,
    harvesting: 15000,
    other: 5000,
    totalPerAcre: 66000
  },
  tomato: {
    seed: 4000,
    fertilizer: 15000,
    pesticide: 8000,
    labor: 25000,
    irrigation: 10000,
    harvesting: 12000,
    other: 6000,
    totalPerAcre: 80000
  },
  potato: {
    seed: 5000,
    fertilizer: 12000,
    pesticide: 6000,
    labor: 18000,
    irrigation: 8000,
    harvesting: 10000,
    other: 5000,
    totalPerAcre: 64000
  },
  onion: {
    seed: 3000,
    fertilizer: 10000,
    pesticide: 4000,
    labor: 15000,
    irrigation: 7000,
    harvesting: 8000,
    other: 4000,
    totalPerAcre: 51000
  },
  chilli: {
    seed: 3500,
    fertilizer: 13000,
    pesticide: 7000,
    labor: 20000,
    irrigation: 9000,
    harvesting: 11000,
    other: 5500,
    totalPerAcre: 69000
  },
  brinjal: {
    seed: 3000,
    fertilizer: 12000,
    pesticide: 6000,
    labor: 18000,
    irrigation: 8000,
    harvesting: 10000,
    other: 5000,
    totalPerAcre: 62000
  }
};

// Average market prices (per quintal, in INR)
const MARKET_PRICES = {
  rice: 2200,
  wheat: 2100,
  maize: 1800,
  cotton: 6500,
  sugarcane: 3200,
  tomato: 2500,
  potato: 1500,
  onion: 2000,
  chilli: 12000,
  brinjal: 1800
};

// Average yields (quintals per acre)
const AVERAGE_YIELDS = {
  rice: 25,
  wheat: 20,
  maize: 30,
  cotton: 8,
  sugarcane: 500,
  tomato: 200,
  potato: 150,
  onion: 120,
  chilli: 40,
  brinjal: 180
};

// Helper function to get market price from Gemini API
async function getMarketPriceFromGemini(cropName) {
  try {
    const geminiApiKey = 'AIzaSyBCed_tNdNmbm-pgfBFDL4MTT_OIaVU0rU';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;

    const prompt = `What is the current market price per quintal (in Indian Rupees) for ${cropName} in India? 

Respond with ONLY a number (the price in rupees per quintal). No text, no explanation, just the number. Example: 2100`;

    const response = await axios.post(geminiUrl, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    console.log(`Gemini price response for ${cropName}:`, text);
    
    // Extract price number
    const priceMatch = text.match(/(\d{1,6}(?:,\d{3})*(?:\.\d{2})?)/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : parseFloat(text.replace(/[^\d.]/g, ''));
    
    if (!isNaN(price) && price > 0 && price < 100000) {
      console.log(`Extracted price for ${cropName}: ₹${price}`);
      return price;
    }
    console.log(`Could not extract valid price for ${cropName}, got: ${text}`);
    return null;
  } catch (error) {
    console.error('Error fetching price from Gemini:', error.message);
    if (error.response) {
      console.error('Gemini API error:', error.response.status, error.response.data);
    }
    return null;
  }
}

// Helper function to get profit/loss analysis from Gemini
async function getProfitLossAnalysisFromGemini(cropName, landArea, totalCost, totalRevenue, profit) {
  try {
    const geminiApiKey = 'AIzaSyBCed_tNdNmbm-pgfBFDL4MTT_OIaVU0rU';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;

    const profitPercentage = ((profit / totalCost) * 100).toFixed(1);
    const profitStatus = profit >= 0 ? 'profitable' : 'loss-making';

    const prompt = `Analyze the profit/loss for ${cropName} cultivation in India:
- Land Area: ${landArea} acres
- Total Cost: ₹${totalCost.toLocaleString()}
- Total Revenue: ₹${totalRevenue.toLocaleString()}
- Net Profit: ₹${profit.toLocaleString()} (${profitPercentage}% ${profitStatus})

Provide a brief 2-3 sentence analysis about whether this cultivation is profitable and any practical recommendations for the farmer. Respond in simple, clear English.`;

    const response = await axios.post(geminiUrl, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const analysis = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    console.log(`Gemini analysis for ${cropName}:`, analysis?.substring(0, 100));
    return analysis;
  } catch (error) {
    console.error('Error getting analysis from Gemini:', error.message);
    if (error.response) {
      console.error('Gemini API error:', error.response.status, error.response.data);
    }
    return null;
  }
}

// @route   POST /api/profit-loss/calculate
// @desc    Calculate profit/loss for a crop
// @access  Private
router.post('/calculate', protect, async (req, res) => {
  try {
    const { landArea, cropName, expectedYield, customPrice, customCosts } = req.body;

    if (!landArea || !cropName) {
      return res.status(400).json({
        success: false,
        message: 'Land area and crop name are required'
      });
    }

    const cropLower = cropName.toLowerCase();
    const landAreaNum = parseFloat(landArea);
    const expectedYieldNum = expectedYield ? parseFloat(expectedYield) : null;

    // Get cost data
    const costData = CROP_COSTS[cropLower] || CROP_COSTS.rice;
    const baseCostPerAcre = customCosts?.totalPerAcre || costData.totalPerAcre;

    // Calculate total cost
    let totalCost = baseCostPerAcre * landAreaNum;

    // If custom costs provided, use them
    if (customCosts) {
      const customTotal = Object.values(customCosts).reduce((sum, val) => {
        return sum + (parseFloat(val) || 0);
      }, 0);
      totalCost = customTotal * landAreaNum;
    }

    // Get market price - try Gemini API first, then fallback to default
    let pricePerQuintal = customPrice;
    
    if (!pricePerQuintal) {
      // Try to get from Gemini API
      const geminiPrice = await getMarketPriceFromGemini(cropName);
      pricePerQuintal = geminiPrice || MARKET_PRICES[cropLower] || 2000;
    }

    // Calculate expected yield if not provided
    const yieldPerAcre = expectedYieldNum || AVERAGE_YIELDS[cropLower] || 20;
    const totalYield = yieldPerAcre * landAreaNum;

    // Calculate revenue
    const totalRevenue = totalYield * pricePerQuintal;

    // Calculate profit/loss
    const profit = totalRevenue - totalCost;
    const profitPercentage = (profit / totalCost) * 100;
    const revenuePerAcre = totalRevenue / landAreaNum;
    const costPerAcre = totalCost / landAreaNum;
    const profitPerAcre = profit / landAreaNum;

    // Break-even analysis
    const breakEvenYield = totalCost / pricePerQuintal;
    const breakEvenYieldPerAcre = breakEvenYield / landAreaNum;

    // Get AI analysis from Gemini
    const aiAnalysis = await getProfitLossAnalysisFromGemini(
      cropName,
      landAreaNum,
      Math.round(totalCost),
      Math.round(totalRevenue),
      Math.round(profit)
    );

    res.json({
      success: true,
      calculation: {
        crop: cropName,
        landArea: landAreaNum,
        expectedYield: totalYield,
        yieldPerAcre: yieldPerAcre,
        pricePerQuintal: pricePerQuintal,
        priceSource: customPrice ? 'custom' : (pricePerQuintal !== MARKET_PRICES[cropLower] ? 'gemini' : 'default'),
        totalCost: Math.round(totalCost),
        totalRevenue: Math.round(totalRevenue),
        profit: Math.round(profit),
        profitPercentage: parseFloat(profitPercentage.toFixed(2)),
        revenuePerAcre: Math.round(revenuePerAcre),
        costPerAcre: Math.round(costPerAcre),
        profitPerAcre: Math.round(profitPerAcre),
        breakEvenYield: Math.round(breakEvenYield),
        breakEvenYieldPerAcre: parseFloat(breakEvenYieldPerAcre.toFixed(2)),
        aiAnalysis: aiAnalysis
      },
      breakdown: {
        costs: {
          seed: Math.round((customCosts?.seed || costData.seed) * landAreaNum),
          fertilizer: Math.round((customCosts?.fertilizer || costData.fertilizer) * landAreaNum),
          pesticide: Math.round((customCosts?.pesticide || costData.pesticide) * landAreaNum),
          labor: Math.round((customCosts?.labor || costData.labor) * landAreaNum),
          irrigation: Math.round((customCosts?.irrigation || costData.irrigation) * landAreaNum),
          harvesting: Math.round((customCosts?.harvesting || costData.harvesting) * landAreaNum),
          other: Math.round((customCosts?.other || costData.other) * landAreaNum)
        }
      }
    });
  } catch (error) {
    console.error('Profit/Loss calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating profit/loss',
      error: error.message
    });
  }
});

// @route   GET /api/profit-loss/crops
// @desc    Get list of available crops with their data and profit/loss ranking
// @access  Private
router.get('/crops', protect, async (req, res) => {
  try {
    const crops = await Promise.all(
      Object.keys(CROP_COSTS).map(async (crop) => {
        const cropName = crop.charAt(0).toUpperCase() + crop.slice(1);
        const averageYield = AVERAGE_YIELDS[crop] || 20;
        const defaultPrice = MARKET_PRICES[crop] || 2000;
        
        // Try to get current price from Gemini
        const geminiPrice = await getMarketPriceFromGemini(cropName);
        const averagePrice = geminiPrice || defaultPrice;
        const averageCostPerAcre = CROP_COSTS[crop]?.totalPerAcre || 40000;
        
        // Calculate profitability (assuming 1 acre)
        const revenue = averageYield * averagePrice;
        const profit = revenue - averageCostPerAcre;
        const profitPercentage = (profit / averageCostPerAcre) * 100;

        return {
          name: cropName,
          averageYield: averageYield,
          averagePrice: averagePrice,
          priceSource: geminiPrice ? 'gemini' : 'default',
          averageCostPerAcre: averageCostPerAcre,
          estimatedProfitPerAcre: Math.round(profit),
          estimatedProfitPercentage: parseFloat(profitPercentage.toFixed(2))
        };
      })
    );

    // Sort by profitability
    crops.sort((a, b) => b.estimatedProfitPercentage - a.estimatedProfitPercentage);

    res.json({
      success: true,
      crops
    });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crop data'
    });
  }
});

module.exports = router;

