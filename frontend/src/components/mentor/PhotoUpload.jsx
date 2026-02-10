import { useState, useRef, useCallback } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * PhotoUpload - Drag & drop photo upload component
 *
 * @param {Object} props
 * @param {string} props.currentPhotoURL - Current photo URL
 * @param {function} props.onUpload - Callback when photo is uploaded, receives File
 * @param {boolean} props.isUploading - Whether upload is in progress
 * @param {string} props.error - Error message to display
 */
export default function PhotoUpload({
  currentPhotoURL,
  onUpload,
  isUploading = false,
  error,
}) {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Formato invalido. Use JPG, PNG ou WebP.';
    }
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Maximo 5MB.';
    }
    return null;
  };

  const handleFile = useCallback((file) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Call upload handler
    onUpload(file);
  }, [onUpload]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemovePreview = () => {
    setPreview(null);
    setValidationError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const displayError = validationError || error;
  const displayPhoto = preview || currentPhotoURL;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Foto de Perfil
      </label>

      <div className="flex items-start gap-6">
        {/* Current/Preview photo */}
        <div className="relative shrink-0">
          {displayPhoto ? (
            <div className="relative">
              <img
                src={displayPhoto}
                alt="Foto de perfil"
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
              />
              {preview && !isUploading && (
                <button
                  type="button"
                  onClick={handleRemovePreview}
                  className="absolute -top-1 -right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
              <PhotoIcon className="h-10 w-10 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload area */}
        <div className="flex-1">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors
              ${dragActive
                ? 'border-patronos-accent bg-patronos-accent/5'
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleChange}
              className="hidden"
              disabled={isUploading}
            />

            <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-patronos-accent">Clique para enviar</span>
              {' '}ou arraste e solte
            </p>
            <p className="mt-1 text-xs text-gray-500">
              JPG, PNG ou WebP (max. 5MB)
            </p>
          </div>

          {displayError && (
            <p className="mt-2 text-sm text-red-600">{displayError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
