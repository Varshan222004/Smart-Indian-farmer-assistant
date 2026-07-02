import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

const DiseaseDetection = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);

  // --- file upload ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  // --- camera ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setError('');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to access camera. Please allow camera permission.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCameraMode = () => {
    const next = !useCamera;
    setUseCamera(next);
    setResult(null);
    setError('');
    setFile(null);
    setPreview(null);
    if (next) startCamera();
    else stopCamera();
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 224;
    canvas.height = video.videoHeight || 224;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const captured = new File([blob], 'captured_leaf.jpg', { type: 'image/jpeg' });
      setFile(captured);
      setPreview(URL.createObjectURL(blob));
      setError('');
    }, 'image/jpeg', 0.9);
  };

  useEffect(() => () => stopCamera(), []);

  // --- submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or capture an image.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file); // must be "file"

    try {
      // FormData will automatically set Content-Type with boundary
      const res = await api.post('/ml/disease-detect', formData);
      setResult(res.data);
    } catch (err) {
      console.error('Disease detection error:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to detect disease. Please ensure the ML service is running on port 8003.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isWarning =
    error.includes('⚠️') ||
    error.includes('WARNING') ||
    error.toLowerCase().includes('does not appear to be');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Plant Disease Detection
      </h1>

      {/* Upload/Camera card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => useCamera && toggleCameraMode()}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border ${
              !useCamera
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            📁 Upload Image
          </button>
          <button
            type="button"
            onClick={toggleCameraMode}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium border ${
              useCamera
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            📷 Use Camera
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!useCamera && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leaf Image
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          )}

          {useCamera && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Camera Preview
              </label>
              <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-80 object-contain"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={captureFromCamera}
                  disabled={!cameraActive}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  📸 Capture Photo
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-200"
                >
                  🔄 Restart Camera
                </button>
              </div>
            </div>
          )}

          {preview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Selected Image
              </p>
              <img
                src={preview}
                alt="Preview"
                className="max-w-full h-64 object-contain rounded border"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Detecting...' : 'Detect Disease'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div
          className={`border rounded-lg p-4 mb-4 ${
            isWarning ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 text-2xl">
              {isWarning ? '⚠️' : '❌'}
            </div>
            <div className="ml-3 flex-1">
              <p
                className={`font-semibold ${
                  isWarning ? 'text-yellow-800' : 'text-red-800'
                }`}
              >
                {isWarning ? 'Invalid Image Warning' : 'Error'}
              </p>
              <p
                className={`mt-1 ${
                  isWarning ? 'text-yellow-700' : 'text-red-700'
                }`}
              >
                {error.replace('⚠️ WARNING:', '').replace('Warning:', '').trim()}
              </p>
              {!isWarning && (
                <p className="text-red-600 text-sm mt-2">
                  Please try again or check if the ML service is running on port 8003.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6 notranslate">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Detection Result
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <p className="text-lg font-semibold text-blue-800">
                  {result.label || result.disease}
                </p>
                {result.detection_method && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                    {result.detection_method}
                  </span>
                )}
              </div>

              {result.confidence != null && (
                <p className="text-gray-700 mb-2">
                  Confidence:{' '}
                  <span className="font-semibold">
                    {(result.confidence * 100).toFixed(2)}%
                  </span>
                </p>
              )}

              {Array.isArray(result.top3) && result.top3.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Top Predictions
                  </p>
                  <div className="space-y-2">
                    {result.top3.map((p, idx) => (
                      <div
                        key={`${p.label}-${idx}`}
                        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                          idx === 0
                            ? 'bg-green-100 text-green-800 font-semibold'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{p.label}</span>
                        <span>{(p.confidence * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.explanation && (
                <p className="text-gray-700 text-sm italic mt-3">
                  {result.explanation}
                </p>
              )}
            </div>

            {result.cureSteps && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-green-800">
                  Cure Steps
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  {Array.isArray(result.cureSteps)
                    ? result.cureSteps.map((step, i) => <li key={i}>{step}</li>)
                    : <li>{result.cureSteps}</li>}
                </ol>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.recommendedPesticide && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-yellow-800">
                    Recommended Pesticide
                  </h3>
                  <p className="text-gray-700">
                    {result.recommendedPesticide}
                  </p>
                </div>
              )}

              {result.recommendedFertilizer && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-purple-800">
                    Recommended Fertilizer
                  </h3>
                  <p className="text-gray-700">
                    {result.recommendedFertilizer}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;
