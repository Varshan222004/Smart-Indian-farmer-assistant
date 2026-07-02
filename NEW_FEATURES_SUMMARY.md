# New Features: Profit/Loss Calculator & Crop Calendar

## ✅ Feature 1: Profit/Loss Calculator

### Overview
A comprehensive calculator that helps farmers estimate their profit/loss before planting crops by calculating total costs, revenue, and net profit.

### Features
- **Input Fields:**
  - Land area (acres)
  - Crop selection (with average yield and price info)
  - Expected yield (optional - uses average if not provided)
  - Custom price per quintal (optional - uses market price if not provided)
  - Custom costs breakdown (optional)

- **Calculations:**
  - Total cost (seed, fertilizer, pesticide, labor, irrigation, harvesting, other)
  - Total revenue (based on yield × price)
  - Net profit/loss
  - Profit percentage
  - Per-acre breakdown
  - Break-even analysis

- **Cost Breakdown:**
  - Seed cost
  - Fertilizer cost
  - Pesticide cost
  - Labor cost
  - Irrigation cost
  - Harvesting cost
  - Other expenses

### Backend API
- **POST** `/api/profit-loss/calculate` - Calculate profit/loss
- **GET** `/api/profit-loss/crops` - Get list of crops with average data

### Supported Crops
Rice, Wheat, Maize, Cotton, Sugarcane, Tomato, Potato, Onion, Chilli, Brinjal

### Usage
1. Navigate to Dashboard → Profit/Loss Calculator
2. Enter land area and select crop
3. Optionally enter expected yield and custom price
4. Optionally enable custom costs for detailed breakdown
5. Click "Calculate Profit/Loss"
6. View detailed results with breakdown

---

## ✅ Feature 2: Crop Calendar (Seasonal Planner)

### Overview
A comprehensive month-wise timeline showing the complete lifecycle of crops including sowing, fertilizing, irrigation, harvest, and pest control periods.

### Features
- **Month-wise Timeline:**
  - Sowing time (optimal months)
  - Fertilizing schedule (specific weeks and fertilizers)
  - Irrigation schedule (months requiring irrigation)
  - Harvest time (harvest months)
  - Pest control periods (pests and treatments)

- **Visual Calendar:**
  - 12-month grid view
  - Color-coded activities
  - Current month highlighting
  - Activity indicators

- **Smart Notifications:**
  - Sowing time alerts
  - Fertilizer schedule reminders
  - Pest control alerts
  - Harvest time notifications

### Supported Crops
Rice, Wheat, Maize, Cotton, Tomato, Potato, Onion

### Calendar Data Includes:
1. **Sowing Time:** Optimal months for sowing
2. **Fertilizing Schedule:**
   - Month and week
   - Fertilizer type and amount
   - Application description
3. **Irrigation Schedule:** Months requiring regular irrigation
4. **Harvest Time:** Optimal harvest months
5. **Pest Control:**
   - Month and period (Early/Mid/Late)
   - Common pests
   - Treatment recommendations

### Usage
1. Navigate to Dashboard → Crop Calendar
2. Select a crop from dropdown
3. View complete lifecycle calendar
4. Enable notifications for automatic alerts
5. Check month-wise activities

### Notifications
- **Sowing Alert:** When current month matches sowing period
- **Fertilizer Alert:** When fertilizer application is due
- **Pest Control Alert:** When pest management is needed
- **Harvest Alert:** When harvest time arrives

---

## Integration

### Dashboard
Both features are added to the main dashboard:
- Profit/Loss Calculator card
- Crop Calendar card

### Smart Alerts System
Crop Calendar notifications are integrated into the Smart Alerts system:
- Automatic checks for calendar events
- Harvest time alerts
- Integrated with existing alert types

### Routes
- `/dashboard/profit-loss` - Profit/Loss Calculator
- `/dashboard/crop-calendar` - Crop Calendar

---

## Technical Details

### Backend Files
- `backend/routes/profitLoss.js` - Profit/Loss calculation API
- `backend/server.js` - Route registration

### Frontend Files
- `frontend/src/pages/ProfitLossCalculator.jsx` - Calculator UI
- `frontend/src/pages/CropCalendar.jsx` - Calendar UI
- `frontend/src/utils/smartAlerts.js` - Enhanced with calendar alerts
- `frontend/src/pages/Dashboard.jsx` - Added feature cards
- `frontend/src/App.jsx` - Added routes

### Data Structure

**Crop Costs (per acre):**
```javascript
{
  seed: number,
  fertilizer: number,
  pesticide: number,
  labor: number,
  irrigation: number,
  harvesting: number,
  other: number,
  totalPerAcre: number
}
```

**Crop Calendar:**
```javascript
{
  name: string,
  sowing: [months],
  fertilizing: [{ month, week, fertilizer, description }],
  irrigation: [months],
  harvest: [months],
  pestControl: [{ month, period, pests, treatment }],
  lifecycle: days
}
```

---

## Example Calculations

### Profit/Loss Calculator
**Input:**
- Land Area: 2.5 acres
- Crop: Rice
- Expected Yield: 25 q/acre
- Price: ₹2,200/quintal

**Output:**
- Total Cost: ₹100,000
- Total Revenue: ₹137,500
- Net Profit: ₹37,500 (37.5%)
- Break-even: 18.2 q/acre

### Crop Calendar
**Rice Example:**
- Sowing: Jun, Jul, Aug, Nov, Dec
- Fertilizing: 
  - Jun Week 3: Basal - DAP + Urea
  - Jul Week 2: First Top Dressing - Urea
  - Jul Week 4: Second Top Dressing - Urea
  - Aug Week 2: Third Top Dressing - Urea
- Irrigation: Jun - Dec
- Harvest: Sep, Oct, Jan, Feb
- Pest Control:
  - Jul Early: Stem borer, Leaf folder
  - Aug Mid: Brown plant hopper, Blast
  - Sep Late: Grain borer

---

## Benefits

### Profit/Loss Calculator
1. **Financial Planning:** Plan expenses before planting
2. **Decision Making:** Compare profitability of different crops
3. **Cost Optimization:** Identify high-cost areas
4. **Break-even Analysis:** Know minimum yield needed
5. **Customization:** Adjust costs and prices for accuracy

### Crop Calendar
1. **Planning:** Plan entire crop lifecycle in advance
2. **Timing:** Know exact timing for each activity
3. **Prevention:** Schedule pest control proactively
4. **Optimization:** Optimize fertilizer and irrigation schedules
5. **Notifications:** Never miss important dates

---

## Future Enhancements

### Profit/Loss Calculator
- [ ] Historical price trends
- [ ] Multiple crop comparison
- [ ] Export to PDF/Excel
- [ ] Save calculations
- [ ] Location-specific pricing

### Crop Calendar
- [ ] More crops
- [ ] Location-specific calendars
- [ ] Weather-based adjustments
- [ ] Integration with irrigation schedule
- [ ] Export calendar to PDF
- [ ] Reminder scheduling

---

## Testing

### Profit/Loss Calculator
1. Test with different crops
2. Test with custom costs
3. Test with custom prices
4. Verify break-even calculations
5. Check cost breakdown accuracy

### Crop Calendar
1. Test all crops
2. Verify month highlighting
3. Test notifications
4. Check calendar accuracy
5. Verify notification timing

---

Both features are fully integrated and ready to use! 🎉


