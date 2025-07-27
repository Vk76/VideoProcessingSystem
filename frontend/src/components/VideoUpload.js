import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video, AlertCircle, CheckCircle, Loader } from 'lucide-react';
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
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Upload Video for Processing
        </h2>
        <p className="text-secondary-600">
          Upload your video file to start processing. Supported formats: MP4, AVI, MOV (max 100MB)
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-primary-400 bg-primary-50' 
            : uploading 
            ? 'border-secondary-300 bg-secondary-50 cursor-not-allowed'
            : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <Loader className="w-12 h-12 text-primary-600 animate-spin" />
          ) : (
            <div className="p-4 bg-primary-100 rounded-full">
              <Upload className="w-8 h-8 text-primary-600" />
            </div>
          )}
          
          <div>
            {uploading ? (
              <>
                <p className="text-lg font-medium text-secondary-900 mb-2">
                  Uploading video...
                </p>
                <div className="w-64 bg-secondary-200 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-secondary-600 mt-2">
                  {uploadProgress}% complete
                </p>
              </>
            ) : isDragActive ? (
              <>
                <p className="text-lg font-medium text-primary-700">
                  Drop your video here
                </p>
                <p className="text-sm text-primary-600">
                  Release to upload
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-secondary-900">
                  Drop your video here, or <span className="text-primary-600">browse</span>
                </p>
                <p className="text-sm text-secondary-600">
                  MP4, AVI, MOV up to 100MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">
                Upload successful!
              </p>
              <p className="text-green-700 text-sm">
                Job ID: {uploadResult.job_id}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
