import { useRef, useState } from 'react'
import { FiUpload, FiX, FiTrash2 } from 'react-icons/fi'
import { uploadVideoToS3, isS3Video, deleteVideoFromS3 } from '../../utils/imageUtils'

function VideoUpload({ value, onChange, placeholder = 'Upload a video or enter URL', onUploadStart, onUploadEnd }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please select a video file (MP4, WebM, etc.)')
      return
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('Video file size must be less than 100MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    onUploadStart?.()

    try {
      // Upload directly to S3
      const { url } = await uploadVideoToS3(file, 'banner-videos')

      // Update the value with S3 URL
      onChange(url)
      setUploadProgress(100)

      console.log('Video uploaded to S3:', url)
    } catch (error) {
      console.error('Error uploading video:', error)
      alert(error.message || 'Failed to upload video. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      onUploadEnd?.()
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleClear = async () => {
    const currentValue = value

    // If it's an S3 video, delete from S3
    if (currentValue && isS3Video(currentValue)) {
      setIsDeleting(true)
      try {
        await deleteVideoFromS3(currentValue)
      } catch (error) {
        console.error('Failed to delete video from S3:', error)
        setIsDeleting(false)
        return
      }
      setIsDeleting(false)
    }

    // Clear local state
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="video-upload-wrapper">
      <div className="video-upload-input-group">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="input-field"
          placeholder={placeholder}
          disabled={uploading || isDeleting}
        />
        <div className="video-upload-buttons">
          <button
            type="button"
            className="video-upload-btn"
            onClick={handleUploadClick}
            title="Upload video to S3"
            disabled={uploading || isDeleting}
          >
            {uploading ? <span className="loader-small"></span> : <FiUpload />}
          </button>
          {value && !uploading && (
            <button
              type="button"
              className="video-upload-btn clear"
              onClick={handleClear}
              title={isS3Video(value) ? "Delete from S3" : "Clear"}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="loader-small"></span>
              ) : isS3Video(value) ? (
                <FiTrash2 />
              ) : (
                <FiX />
              )}
            </button>
          )}
        </div>
      </div>
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <span className="progress-text">Uploading video...</span>
        </div>
      )}
      {isDeleting && (
        <div className="upload-progress">
          <span className="progress-text">Deleting from S3...</span>
        </div>
      )}
      {value && !uploading && !isDeleting && (
        <div className="video-preview-container">
          <video
            src={value}
            className="video-preview"
            controls
            muted
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          {isS3Video(value) && (
            <span className="s3-badge">S3</span>
          )}
        </div>
      )}
    </div>
  )
}

export default VideoUpload
