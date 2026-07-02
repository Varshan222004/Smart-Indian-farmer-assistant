import { useEffect, useState } from 'react';

const GoogleTranslateWidget = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Google Translate is already loaded and initialized
    const checkAndInit = () => {
      const element = document.getElementById('google_translate_element');
      if (!element) return false;

      // Check if already initialized (has children)
      if (element.hasChildNodes()) {
        setIsLoaded(true);
        return true;
      }

      // Try to initialize
      if (window.google && window.google.translate && typeof window.googleTranslateElementInit === 'function') {
        try {
          window.googleTranslateElementInit();
          setIsLoaded(true);
          return true;
        } catch (e) {
          console.error('Error calling googleTranslateElementInit:', e);
          setError('Failed to initialize');
        }
      }
      return false;
    };

    // Immediate check
    if (checkAndInit()) {
      return;
    }

    // Wait for script to load (max 10 seconds)
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds at 100ms intervals
    
    const checkGoogleTranslate = setInterval(() => {
      attempts++;
      
      if (checkAndInit()) {
        clearInterval(checkGoogleTranslate);
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkGoogleTranslate);
        setError('Google Translate failed to load');
        console.error('Google Translate script did not load within timeout');
      }
    }, 100);

    // Cleanup
    return () => {
      clearInterval(checkGoogleTranslate);
    };
  }, []);

  return (
    <div className="google-translate-widget">
      <div id="google_translate_element" className="inline-block">
        {!isLoaded && !error && (
          <span className="text-white text-sm opacity-75">Loading...</span>
        )}
        {error && (
          <div className="inline-block">
            <a 
              href={`https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-sm hover:underline"
              title="Open Google Translate"
            >
              Translate
            </a>
          </div>
        )}
      </div>
      <style>{`
        /* Hide Google Translate branding and improve styling */
        #google_translate_element {
          display: inline-block;
          vertical-align: middle;
        }
        
        /* Hide Google Translate banner and balloon */
        .goog-te-banner-frame {
          display: none !important;
        }
        .goog-te-balloon-frame {
          display: none !important;
        }
        .goog-text-highlight {
          background: none !important;
          box-shadow: none !important;
        }
        body {
          top: 0 !important;
        }
        
        /* Hide the "Select Language" text and Google branding */
        .goog-te-gadget {
          color: transparent !important;
          font-size: 0 !important;
        }
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .goog-te-gadget-icon {
          display: none !important;
        }
        
        /* Style the select dropdown to match website theme */
        .goog-te-combo {
          padding: 6px 32px 6px 10px !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 6px !important;
          background-color: rgba(255, 255, 255, 0.1) !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 10px center !important;
          color: white !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          min-width: 120px !important;
          height: 36px !important;
        }
        
        .goog-te-combo:hover {
          background-color: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
        }
        
        .goog-te-combo:focus {
          outline: none !important;
          border-color: rgba(255, 255, 255, 0.6) !important;
          background-color: rgba(255, 255, 255, 0.15) !important;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
        }
        
        /* Style dropdown options */
        .goog-te-combo option {
          background-color: #16a34a !important;
          color: white !important;
          padding: 8px !important;
        }
        
        /* Hide Google branding text */
        .goog-te-gadget .goog-te-combo {
          margin: 0 !important;
        }
        
        /* Additional styling for better integration */
        #google_translate_element * {
          box-sizing: border-box;
        }
        
        /* Mobile responsive */
        @media (max-width: 640px) {
          .goog-te-combo {
            min-width: 100px !important;
            font-size: 12px !important;
            padding: 5px 28px 5px 8px !important;
            height: 32px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GoogleTranslateWidget;

