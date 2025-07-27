import React from 'react';
import { videoService } from '../services/videoService';

const VideoList = ({ jobs, loading, onRefresh }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '⏳';
      case 'failed':
        return '❌';
      case 'pending':
        return '⏸️';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'processing':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      case 'pending':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const handleDownload = async (jobId, filename) => {
    try {
      const blob = await videoService.downloadVideo(jobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `video_${jobId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download video. Please try again.');
    }
  };

  const handleDownloadThumbnail = async (jobId) => {
    try {
      const blob = await videoService.downloadThumbnail(jobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thumbnail_${jobId}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Thumbnail download failed:', error);
      alert('Failed to download thumbnail. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-4">
              <span className="sr-only">Loading...</span>
            </div>
            <p style={{ color: '#6b7280' }}>Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: '#1f2937' }}>
          📋 Processing Jobs
        </h2>
        <button
          onClick={onRefresh}
          className="btn btn-secondary flex items-center space-x-2"
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📹</div>
          <h3 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>
            No jobs yet
          </h3>
          <p style={{ color: '#6b7280' }}>
            Upload your first video to get started with processing
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="card-hover"
              style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div style={{ fontSize: '24px' }}>
                    {getStatusIcon(job.status)}
                  </div>
                  <div>
                    <h3 style={{ 
                      color: '#1f2937', 
                      fontWeight: '600',
                      marginBottom: '4px',
                      fontSize: '16px'
                    }}>
                      {job.filename || `Job ${job.job_id}`}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm">
                      <span style={{ 
                        color: getStatusColor(job.status),
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {job.status}
                      </span>
                      {job.file_size && (
                        <span style={{ color: '#6b7280' }}>
                          📦 {formatFileSize(job.file_size)}
                        </span>
                      )}
                      <span style={{ color: '#6b7280' }}>
                        🕒 {formatDuration(job.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {job.status === 'completed' && (
                    <>
                      <button
                        onClick={() => handleDownloadThumbnail(job.job_id)}
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        🖼️ Thumbnail
                      </button>
                      <button
                        onClick={() => handleDownload(job.job_id, job.filename)}
                        className="btn btn-primary"
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        📥 Download
                      </button>
                    </>
                  )}
                  {job.status === 'processing' && (
                    <div style={{
                      padding: '6px 12px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      ⏳ Processing...
                    </div>
                  )}
                  {job.status === 'failed' && (
                    <div style={{
                      padding: '6px 12px',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      ❌ Failed
                    </div>
                  )}
                </div>
              </div>

              {job.error && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  <strong>Error:</strong> {job.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;
