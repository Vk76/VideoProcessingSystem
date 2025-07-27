import React, { useState } from 'react';
import { 
  Download, 
  Image, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Video,
  Calendar,
  HardDrive
} from 'lucide-react';
import { videoService } from '../services/videoService';

const VideoList = ({ jobs, loading, onRefresh }) => {
  const [downloadingJobs, setDownloadingJobs] = useState(new Set());
  const [thumbnailUrls, setThumbnailUrls] = useState({});

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-secondary-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'processing':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-secondary-100 text-secondary-800`;
    }
  };

  const handleDownload = async (jobId) => {
    try {
      setDownloadingJobs(prev => new Set(prev).add(jobId));
      const response = await videoService.downloadVideo(jobId);
      
      // Open download URL in new tab
      window.open(response.download_url, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. The video might not be ready yet.');
    } finally {
      setDownloadingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const handleThumbnail = async (jobId) => {
    try {
      const response = await videoService.getThumbnail(jobId);
      setThumbnailUrls(prev => ({
        ...prev,
        [jobId]: response.thumbnail_url
      }));
    } catch (error) {
      console.error('Thumbnail failed:', error);
      alert('Thumbnail not available. The video might not be processed yet.');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-secondary-600">Loading jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-secondary-900">
          Processing Jobs
        </h2>
        <button
          onClick={onRefresh}
          className="btn-secondary flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-600 text-lg">No jobs found</p>
          <p className="text-secondary-400 text-sm">Upload a video to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.job_id} className="border border-secondary-200 rounded-lg p-6 hover:bg-secondary-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(job.status)}
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {job.filename}
                    </h3>
                    <span className={getStatusBadge(job.status)}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-secondary-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4" />
                      <span>{formatFileSize(job.file_size)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4" />
                      <span className="font-mono text-xs">{job.job_id.slice(0, 8)}...</span>
                    </div>
                  </div>

                  {/* Thumbnail Preview */}
                  {thumbnailUrls[job.job_id] && (
                    <div className="mt-4">
                      <img
                        src={thumbnailUrls[job.job_id]}
                        alt="Video thumbnail"
                        className="w-32 h-20 object-cover rounded-lg border border-secondary-200"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 ml-6">
                  <button
                    onClick={() => handleThumbnail(job.job_id)}
                    className="btn-secondary flex items-center space-x-2"
                    title="View Thumbnail"
                  >
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">Thumbnail</span>
                  </button>
                  
                  <button
                    onClick={() => handleDownload(job.job_id)}
                    disabled={job.status !== 'completed' || downloadingJobs.has(job.job_id)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200
                      ${job.status === 'completed' && !downloadingJobs.has(job.job_id)
                        ? 'bg-primary-600 hover:bg-primary-700 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                        : 'bg-secondary-200 text-secondary-400 cursor-not-allowed'
                      }
                    `}
                    title={job.status === 'completed' ? 'Download Video' : 'Video not ready'}
                  >
                    {downloadingJobs.has(job.job_id) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {downloadingJobs.has(job.job_id) ? 'Downloading...' : 'Download'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoList;
