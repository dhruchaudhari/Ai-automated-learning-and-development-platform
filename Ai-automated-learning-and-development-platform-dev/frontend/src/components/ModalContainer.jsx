import React from 'react';
import { FaTimes } from 'react-icons/fa';

const ModalContainer = ({ isOpen, onClose, title, children, size = "large", footer }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    large: "max-w-6xl max-h-[90vh]",
    medium: "max-w-4xl max-h-[85vh]",
    small: "max-w-2xl max-h-[80vh]"
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[90] p-4 animate-fade-in">
      <div className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
              title="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Modal Footer */}
        {footer !== null && (
          <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
            {footer ? (
              footer
            ) : (
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalContainer;