import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from 'antd';

interface ImagePreviewProps {
  src: string;
  onClose: () => void;
  progress: number;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ src, onClose, progress }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="bg-white p-4 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Preview" className="w-full h-auto mb-4 rounded max-h-[60vh]" />
        {progress > 0 && progress < 100 && (
          <Progress percent={progress} status="active" />
        )}
        <button
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </motion.div>
  );
};

export default ImagePreview;

