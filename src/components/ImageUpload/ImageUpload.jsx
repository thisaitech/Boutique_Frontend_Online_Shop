import { useRef, useState } from 'react'
import { FiImage, FiCamera, FiX, FiTrash2 } from 'react-icons/fi'
import { isS3Image, deleteImageFromS3 } from '../../utils/imageUtils'

function ImageUpload({ value, onChange, placeholder = '/images/example.jpg', accept = 'image/*' }) {
  const fileInputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF, WEBP)')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size must be less than 10MB')
        return
      }

      // Create preview and store as base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result
        setPreview(dataUrl)
        // Store as base64 - will be uploaded to S3 on Save
        onChange(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment')
      fileInputRef.current.click()
    }
  }

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture')
      fileInputRef.current.click()
    }
  }

  const handleClear = async () => {
    const currentValue = value

    // If it's an S3 image, delete from S3
    if (currentValue && isS3Image(currentValue)) {
      setIsDeleting(true)
      try {
        await deleteImageFromS3(currentValue)
      } catch (error) {
        console.error('Failed to delete image from S3:', error)
        setIsDeleting(false)
        return
      }
      setIsDeleting(false)
    }

    // Clear local state
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayValue = preview || value

  return (
    <div className="image-upload-wrapper">
      <div className="image-upload-input-group">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => {
            onChange(e.target.value)
            setPreview(null)
          }}
          className="input-field"
          placeholder={placeholder}
          disabled={isDeleting}
        />
        <div className="image-upload-buttons">
          <button
            type="button"
            className="image-upload-btn"
            onClick={handleImageClick}
            title="Upload from device"
            disabled={isDeleting}
          >
            <FiImage />
          </button>
          <button
            type="button"
            className="image-upload-btn"
            onClick={handleCameraClick}
            title="Take photo"
            disabled={isDeleting}
          >
            <FiCamera />
          </button>
          {displayValue && (
            <button
              type="button"
              className="image-upload-btn clear"
              onClick={handleClear}
              title={isS3Image(value) ? "Delete from S3" : "Clear"}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="loader-small"></span>
              ) : isS3Image(value) ? (
                <FiTrash2 />
              ) : (
                <FiX />
              )}
            </button>
          )}
        </div>
      </div>
      {isDeleting && (
        <div className="upload-progress">
          <span className="progress-text">Deleting from S3...</span>
        </div>
      )}
      {displayValue && !isDeleting && (
        <div className="image-preview-container">
          <img
            src={displayValue}
            alt="Preview"
            className="image-preview"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          {isS3Image(displayValue) && (
            <span className="s3-badge">S3</span>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageUpload
