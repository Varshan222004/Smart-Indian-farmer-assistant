const axios = require('axios');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Farmer advice tips database (fallback if Gemini API fails)
const FARMER_ADVICE_TIPS = [
  {
    title: "🌾 Crop Rotation Benefits",
    message: "Rotate your crops every season to maintain soil fertility and reduce pest problems. Legumes like beans and peas fix nitrogen in the soil."
  },
  {
    title: "💧 Water Management",
    message: "Water your crops early in the morning or late evening to reduce evaporation. Use drip irrigation for better water efficiency."
  },
  {
    title: "🌱 Soil Health",
    message: "Test your soil pH regularly. Most crops prefer pH between 6.0-7.0. Add organic compost to improve soil structure and nutrients."
  },
  {
    title: "🐛 Pest Control",
    message: "Use natural pest control methods like neem oil and companion planting. Monitor your crops regularly for early pest detection."
  },
  {
    title: "🌤️ Weather Awareness",
    message: "Check weather forecasts regularly. Protect your crops from unexpected rain or heat waves with proper covering or irrigation."
  },
  {
    title: "💰 Market Timing",
    message: "Monitor market prices before harvest. Sell your produce when prices are high for better profits. Store grains properly to avoid losses."
  },
  {
    title: "🌿 Organic Farming",
    message: "Reduce chemical fertilizers and pesticides. Use organic alternatives like cow dung, vermicompost, and bio-pesticides for sustainable farming."
  },
  {
    title: "📅 Seasonal Planning",
    message: "Plan your crops according to seasons. Kharif crops (monsoon) and Rabi crops (winter) have different requirements. Follow the crop calendar."
  },
  {
    title: "🌾 Seed Selection",
    message: "Choose high-quality, certified seeds for better yield. Store seeds properly in dry, cool places to maintain germination rate."
  },
  {
    title: "💪 Labor Management",
    message: "Plan your labor requirements in advance. Train workers on proper farming techniques. Use modern tools to reduce manual labor."
  },
  {
    title: "🌱 Seedling Care",
    message: "Transplant seedlings carefully to avoid root damage. Water immediately after transplanting and provide shade for the first few days."
  },
  {
    title: "🌾 Harvest Timing",
    message: "Harvest crops at the right maturity stage. Too early or too late can reduce quality and yield. Check grain moisture content before storage."
  },
  {
    title: "💧 Irrigation Schedule",
    message: "Create a proper irrigation schedule based on crop needs and weather. Over-irrigation can cause root rot and waste water resources."
  },
  {
    title: "🌿 Weed Management",
    message: "Remove weeds regularly, especially in the first 30-40 days after sowing. Use mulching to suppress weed growth naturally."
  },
  {
    title: "🌾 Post-Harvest Care",
    message: "Dry your harvest properly before storage. Use clean, dry storage containers. Check for pests regularly and maintain proper ventilation."
  }
];

// Get farmer advice from Gemini API or fallback to tips
async function getFarmerAdvice(user = null) {
  try {
    const geminiApiKey = process.env.LLM_API_KEY || 'AIzaSyBCed_tNdNmbm-pgfBFDL4MTT_OIaVU0rU';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`;
    
    // Build context-aware prompt
    let context = "Give a practical farming advice tip for Indian farmers.";
    if (user) {
      context = `Give a practical farming advice tip for a farmer from ${user.location?.state || 'India'}, managing ${user.landSize || 'some'} acres with ${user.landQuality || 'medium'} land quality and ${user.soilType || 'loamy'} soil.`;
    }
    
    const prompt = `${context} Keep it short (2-3 sentences), practical, and actionable. Focus on seasonal advice, crop management, soil health, water management, or pest control. Respond in simple English.`;

    const response = await axios.post(geminiUrl, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      timeout: 10000
    });

    const adviceText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    
    if (adviceText && adviceText.length > 20) {
      // Extract title and message from response
      const lines = adviceText.split('\n').filter(line => line.trim());
      let title = "🌾 Farmer's Advice";
      let message = adviceText;
      
      // Try to extract title if response has structure
      if (lines.length > 1 && lines[0].length < 50) {
        title = lines[0].trim();
        message = lines.slice(1).join(' ').trim();
      } else {
        // Use first sentence as title if it's short
        const firstSentence = adviceText.split('.')[0];
        if (firstSentence.length < 60) {
          title = firstSentence.trim() + '.';
          message = adviceText.substring(firstSentence.length + 1).trim();
        }
      }
      
      return {
        title: title.length > 60 ? "🌾 Farmer's Advice" : title,
        message: message || adviceText
      };
    }
  } catch (error) {
    console.error('Error getting advice from Gemini:', error.message);
  }
  
  // Fallback to random tip from database
  const randomTip = FARMER_ADVICE_TIPS[Math.floor(Math.random() * FARMER_ADVICE_TIPS.length)];
  return randomTip;
}

// Send notification to all users
async function sendAdviceToAllUsers() {
  try {
    console.log('[Farmer Advice Service] Starting hourly advice distribution...');
    
    // Get all active users
    const users = await User.find({}).select('_id location landSize landQuality soilType preferredLanguage');
    
    if (users.length === 0) {
      console.log('[Farmer Advice Service] No users found');
      return { sent: 0, failed: 0 };
    }
    
    console.log(`[Farmer Advice Service] Sending advice to ${users.length} users...`);
    
    let sent = 0;
    let failed = 0;
    
    // Send to users in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        try {
          // Get personalized advice
          const advice = await getFarmerAdvice(user);
          
          // Translate title and message if user has preferred language
          let title = advice.title;
          let message = advice.message;
          
          // Create notification
          const notification = new Notification({
            userId: user._id,
            title: title,
            message: message,
            type: 'advice',
            metadata: {
              source: 'hourly_advice',
              timestamp: new Date().toISOString()
            }
          });
          
          await notification.save();
          sent++;
          
          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`[Farmer Advice Service] Error sending to user ${user._id}:`, error.message);
          failed++;
        }
      }));
      
      // Delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`[Farmer Advice Service] Completed: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error('[Farmer Advice Service] Error in sendAdviceToAllUsers:', error);
    return { sent: 0, failed: 0, error: error.message };
  }
}

module.exports = {
  getFarmerAdvice,
  sendAdviceToAllUsers,
  FARMER_ADVICE_TIPS
};

