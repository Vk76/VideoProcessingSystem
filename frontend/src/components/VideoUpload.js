import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { videoService } from '../services/videoService';

const VideoUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, AVI, MOV)');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await videoService.uploadVideo(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadResult(result);
      onUploadSuccess({
        job_id: result.job_id,
        filename: result.filename,
        status: 'processing',
        created_at: new Date().toISOString(),
        file_size: file.size
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadResult(null);
        setUploadProgress(0);
      }, 3000);

    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov']
    },
    multiple: false,
    disabled: uploading
  });

  return (
    <div className="card">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1f2937' }}>
          Upload Video for Processing
        </h2>
        <p style={{ color: '#6b7280' }}>
          Upload your video file to start processing. Supported formats: MP4, AVI, MOV (max 100MB)
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        style={{
          border: `2px dashed ${
            isDragActive ? '#2563eb' : uploading ? '#d1d5db' : '#d1d5db'
          }`,
          backgroundColor: isDragActive ? '#dbeafe' : uploading ? '#f9fafb' : 'white',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            <div style={{
              padding: '16px',
              backgroundColor: '#eff6ff',
              borderRadius: '50%',
              fontSize: '32px'
            }}>
              📤
            </div>
          )}
          
          <div>
            {uploading ? (
              <>
                <p className="text-lg font-medium mb-2" style={{ color: '#1f2937' }}>
                  Uploading video...
                </p>
                <div className="progress-bar" style={{ width: '256px', margin: '0 auto' }}>
                  <div 
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
                  {uploadProgress}% complete
                </p>
              </>
            ) : isDragActive ? (
              <>
                <p className="text-lg font-medium" style={{ color: '#1d4ed8' }}>
                  Drop your video here
                </p>
                <p className="text-sm" style={{ color: '#2563eb' }}>
                  Release to upload
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium" style={{ color: '#1f2937' }}>
                  Drop your video here, or <span style={{ color: '#2563eb' }}>browse</span>
                </p>
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  MP4, AVI, MOV up to 100MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="mt-6 p-4 bg-green-50 border rounded-lg" style={{ borderColor: '#16a34a' }}>
          <div className="flex items-center space-x-3">
            <span style={{ color: '#16a34a', fontSize: '20px' }}>✅</span>
            <div>
              <p style={{ color: '#166534', fontWeight: '500' }}>
                Upload successful!
              </p>
              <p style={{ color: '#15803d', fontSize: '14px' }}>
                Job ID: {uploadResult.job_id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border rounded-lg" style={{ borderColor: '#dc2626' }}>
          <div className="flex items-center space-x-3">
            <span style={{ color: '#dc2626', fontSize: '20px' }}>❌</span>
            <p style={{ color: '#991b1b' }}>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
