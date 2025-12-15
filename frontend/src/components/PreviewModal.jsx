const PreviewModal = ({ preview, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <button
        className="absolute top-4 right-4 text-white text-xl"
        onClick={onClose}
      >
        ✕
      </button>

      {preview.type === "image" ? (
        <img
          src={preview.src}
          className="max-w-[90%] max-h-[90%]"
        />
      ) : (
        <iframe
          src={preview.src}
          className="w-[90%] h-[90%] bg-white"
        />
      )}
    </div>
  );
};

export default PreviewModal;
