const express = require('express');
const router = express.Router();

// Sample Government Schemes Data
const GOVERNMENT_SCHEMES = [
  {
    id: 1,
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    category: 'Direct Benefit Transfer',
    description: 'Direct income support of ₹6,000 per year to all landholding farmer families, payable in three equal installments of ₹2,000 each.',
    eligibility: 'All landholding farmer families',
    benefits: ['₹6,000 per year', 'Direct bank transfer', 'No middlemen'],
    applicationProcess: 'Online application through PM-KISAN portal or Common Service Centers',
    documentsRequired: ['Aadhaar card', 'Bank account details', 'Land ownership documents'],
    website: 'https://pmkisan.gov.in',
    contact: '1800-180-1551',
    status: 'Active',
    lastUpdated: '2024-01-15'
  },
  {
    id: 2,
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'Crop Insurance',
    description: 'Comprehensive crop insurance scheme providing financial support to farmers in case of crop loss due to natural calamities, pests, and diseases.',
    eligibility: 'All farmers growing notified crops in notified areas',
    benefits: ['Premium subsidy up to 90%', 'Quick claim settlement', 'Coverage for pre and post-harvest losses'],
    applicationProcess: 'Apply through banks, insurance companies, or online portal before crop sowing',
    documentsRequired: ['Aadhaar card', 'Bank account details', 'Land records', 'Crop details'],
    website: 'https://pmfby.gov.in',
    contact: '1800-180-1551',
    status: 'Active',
    lastUpdated: '2024-01-10'
  },
  {
    id: 3,
    name: 'Kisan Credit Card (KCC)',
    category: 'Credit Facility',
    description: 'Credit card facility for farmers providing timely and adequate credit support for agricultural and allied activities.',
    eligibility: 'All farmers including tenant farmers, oral lessees, and sharecroppers',
    benefits: ['Interest subvention', 'Flexible repayment', 'Credit limit up to ₹3 lakh'],
    applicationProcess: 'Apply at nearest bank branch with required documents',
    documentsRequired: ['Aadhaar card', 'Land records', 'Bank account', 'Passport size photo'],
    website: 'https://www.india.gov.in/kisan-credit-card-kcc',
    contact: 'Contact nearest bank branch',
    status: 'Active',
    lastUpdated: '2024-01-20'
  },
  {
    id: 4,
    name: 'Soil Health Card Scheme',
    category: 'Soil Management',
    description: 'Provides farmers with soil health cards containing nutrient status of their soil and recommendations for appropriate dosage of nutrients.',
    eligibility: 'All farmers',
    benefits: ['Free soil testing', 'Nutrient recommendations', 'Improved crop yield'],
    applicationProcess: 'Apply at nearest soil testing laboratory or online portal',
    documentsRequired: ['Aadhaar card', 'Land details'],
    website: 'https://soilhealth.dac.gov.in',
    contact: 'Contact state agriculture department',
    status: 'Active',
    lastUpdated: '2024-01-05'
  },
  {
    id: 5,
    name: 'National Mission for Sustainable Agriculture (NMSA)',
    category: 'Sustainable Farming',
    description: 'Promotes sustainable agriculture practices including organic farming, water use efficiency, and soil health management.',
    eligibility: 'Farmers practicing or willing to practice sustainable agriculture',
    benefits: ['Subsidy for organic inputs', 'Training programs', 'Financial assistance'],
    applicationProcess: 'Apply through state agriculture department or online portal',
    documentsRequired: ['Aadhaar card', 'Land records', 'Bank account details'],
    website: 'https://nmsa.dac.gov.in',
    contact: 'Contact state agriculture department',
    status: 'Active',
    lastUpdated: '2024-01-12'
  },
  {
    id: 6,
    name: 'Pradhan Mantri Krishi Sinchai Yojana (PMKSY)',
    category: 'Irrigation',
    description: 'Ensures access to irrigation facilities for every farm and improving water use efficiency.',
    eligibility: 'Farmers with landholdings',
    benefits: ['Subsidy for micro-irrigation', 'Drip and sprinkler systems', 'Water conservation'],
    applicationProcess: 'Apply through state agriculture/horticulture department',
    documentsRequired: ['Aadhaar card', 'Land records', 'Bank account details'],
    website: 'https://pmksy.gov.in',
    contact: 'Contact state agriculture department',
    status: 'Active',
    lastUpdated: '2024-01-18'
  },
  {
    id: 7,
    name: 'Rashtriya Krishi Vikas Yojana (RKVY)',
    category: 'Agricultural Development',
    description: 'State plan scheme for agricultural development with focus on increasing production and productivity.',
    eligibility: 'State governments and farmers through state schemes',
    benefits: ['Infrastructure development', 'Technology adoption', 'Market linkages'],
    applicationProcess: 'State-specific application process',
    documentsRequired: ['As per state requirements'],
    website: 'https://rkvy.nic.in',
    contact: 'Contact state agriculture department',
    status: 'Active',
    lastUpdated: '2024-01-08'
  },
  {
    id: 8,
    name: 'Sub-Mission on Agricultural Mechanization (SMAM)',
    category: 'Farm Machinery',
    description: 'Promotes agricultural mechanization by providing financial assistance for purchase of farm machinery and equipment.',
    eligibility: 'Individual farmers, custom hiring centers, FPOs',
    benefits: ['Subsidy up to 50%', 'Custom hiring centers', 'Modern farm equipment'],
    applicationProcess: 'Apply through state agriculture department or online portal',
    documentsRequired: ['Aadhaar card', 'Land records', 'Bank account details'],
    website: 'https://farmech.gov.in',
    contact: 'Contact state agriculture department',
    status: 'Active',
    lastUpdated: '2024-01-14'
  }
];

// Get all schemes
router.get('/', (req, res) => {
  try {
    const { category, search } = req.query;
    
    let schemes = [...GOVERNMENT_SCHEMES];
    
    // Filter by category
    if (category) {
      schemes = schemes.filter(scheme => 
        scheme.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      schemes = schemes.filter(scheme =>
        scheme.name.toLowerCase().includes(searchLower) ||
        scheme.description.toLowerCase().includes(searchLower) ||
        scheme.category.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      count: schemes.length,
      schemes
    });
  } catch (error) {
    console.error('Error fetching government schemes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching government schemes'
    });
  }
});

// Get scheme by ID
router.get('/:id', (req, res) => {
  try {
    const scheme = GOVERNMENT_SCHEMES.find(s => s.id === parseInt(req.params.id));
    
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }
    
    res.json({
      success: true,
      scheme
    });
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scheme'
    });
  }
});

// Get categories
router.get('/meta/categories', (req, res) => {
  try {
    const categories = [...new Set(GOVERNMENT_SCHEMES.map(s => s.category))];
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

module.exports = router;

