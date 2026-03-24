import React, { useState } from 'react';
import { FaTimes, FaDownload, FaPrint, FaSpinner, FaEye } from 'react-icons/fa';

const PreviewModal = ({ preview, onClose }) => {
  const [loading, setLoading] = useState(true);

  if (!preview || !preview.src) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = preview.src;
    link.download = preview.src.split('/').pop() || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open(preview.src, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4 md:p-8 animate-fade-in">
      {/* Viewer Container */}
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-scale-up">

        {/* Viewer Header */}
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <FaEye className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-none">Document Preview</h3>
              <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px] md:max-w-md">
                {preview.src.split('/').pop()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white group"
              title="Print Document"
            >
              <FaPrint className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white group"
              title="Download Document"
            >
              <FaDownload className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-700 mx-1" />
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-red-500 rounded-lg transition-colors text-gray-300 hover:text-white"
              title="Close Preview"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
              <FaSpinner className="w-10 h-10 text-primary-600 animate-spin mb-4" />
              <p className="text-gray-500 font-medium">Loading preview...</p>
            </div>
          )}

          {preview.type === "image" ? (
            <div className="w-full h-full overflow-auto p-4 flex items-center justify-center">
              <img
                src={preview.src}
                alt="Preview"
                className={`max-w-full max-h-full object-contain shadow-lg transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          ) : (
            <iframe
              src={`${preview.src}#toolbar=0`}
              className={`w-full h-full bg-white transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setLoading(false)}
              title="Document Preview"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
