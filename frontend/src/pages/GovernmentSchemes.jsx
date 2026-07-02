import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const GovernmentSchemes = () => {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchemes();
    fetchCategories();
  }, [selectedCategory, searchQuery]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get('/api/government-schemes', { params });
      setSchemes(response.data.schemes || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError(t('governmentSchemes.loadError'));
      // Try to load from IndexedDB if offline
      loadFromIndexedDB();
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/government-schemes/meta/categories');
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const loadFromIndexedDB = async () => {
    try {
      const db = await openDB();
      const schemes = await db.getAll('schemes');
      if (schemes && schemes.length > 0) {
        setSchemes(schemes);
        console.log('Loaded schemes from IndexedDB');
      }
    } catch (err) {
      console.error('Error loading from IndexedDB:', err);
    }
  };

  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FarmerAssistantDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('schemes')) {
          db.createObjectStore('schemes', { keyPath: 'id' });
        }
      };
    });
  };

  const saveToIndexedDB = async (schemesData) => {
    try {
      const db = await openDB();
      const tx = db.transaction('schemes', 'readwrite');
      const store = tx.objectStore('schemes');
      schemesData.forEach(scheme => store.put(scheme));
      await tx.complete;
    } catch (err) {
      console.error('Error saving to IndexedDB:', err);
    }
  };

  useEffect(() => {
    if (schemes.length > 0) {
      saveToIndexedDB(schemes);
    }
  }, [schemes]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('governmentSchemes.title')}
        </h1>
        <p className="text-gray-600">
          {t('governmentSchemes.description')}
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('governmentSchemes.searchPlaceholder')}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('governmentSchemes.searchPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('governmentSchemes.filterCategory')}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('governmentSchemes.allCategories')}</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">{t('governmentSchemes.loading')}</p>
        </div>
      )}

      {/* Schemes Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => (
            <div
              key={scheme.id}
              onClick={() => setSelectedScheme(scheme)}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  {scheme.category}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${
                  scheme.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {scheme.status}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {scheme.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {scheme.description}
              </p>
              <div className="flex items-center text-primary-600 text-sm font-medium">
                {t('governmentSchemes.viewDetails')} →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && schemes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600 text-lg">{t('governmentSchemes.noSchemes')}</p>
        </div>
      )}

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedScheme(null)}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedScheme.name}</h2>
              <button
                onClick={() => setSelectedScheme(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <span className="bg-primary-100 text-primary-800 text-sm font-semibold px-3 py-1 rounded mr-2">
                  {selectedScheme.category}
                </span>
                <span className={`text-sm font-semibold px-3 py-1 rounded ${
                  selectedScheme.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedScheme.status}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('governmentSchemes.descriptionLabel')}</h3>
                <p className="text-gray-700">{selectedScheme.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('governmentSchemes.eligibility')}</h3>
                <p className="text-gray-700">{selectedScheme.eligibility}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('governmentSchemes.benefits')}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {selectedScheme.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('governmentSchemes.applicationProcess')}</h3>
                <p className="text-gray-700">{selectedScheme.applicationProcess}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('governmentSchemes.documentsRequired')}</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {selectedScheme.documentsRequired.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('governmentSchemes.website')}</h3>
                  <a
                    href={selectedScheme.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {selectedScheme.website}
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('governmentSchemes.contact')}</h3>
                  <p className="text-gray-700">{selectedScheme.contact}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {t('governmentSchemes.lastUpdated')}: {new Date(selectedScheme.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernmentSchemes;

