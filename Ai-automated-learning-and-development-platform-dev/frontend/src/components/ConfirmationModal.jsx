import React from 'react';
import { FaExclamationTriangle, FaTimes, FaSignOutAlt } from 'react-icons/fa';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  icon = null  // ✅ ADDED: Custom icon prop
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          icon: <FaExclamationTriangle className="w-12 h-12" />
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-600',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
          icon: <FaExclamationTriangle className="w-12 h-12" />
        };
      case 'success':
        return {
          iconColor: 'text-green-600',
          buttonColor: 'bg-green-600 hover:bg-green-700',
          icon: <FaExclamationTriangle className="w-12 h-12" />
        };
      default:
        return {
          iconColor: 'text-primary-600',
          buttonColor: 'bg-primary-600 hover:bg-primary-700',
          icon: <FaExclamationTriangle className="w-12 h-12" />
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-black bg-opacity-70"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center py-4">
              {/* ✅ ADDED: Custom icon support */}
              {icon ? (
                <div className="mb-4">
                  {icon}
                </div>
              ) : (
                <div className={`${styles.iconColor} mb-4`}>
                  {styles.icon}
                </div>
              )}

              <p className="text-gray-600 mb-6">{message}</p>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
            <button
              onClick={onConfirm}
              className={`${styles.buttonColor} text-white font-medium py-3 px-6 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;