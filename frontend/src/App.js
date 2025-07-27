import React, { useState, useEffect } from 'react';
import VideoUpload from './components/VideoUpload';
import VideoList from './components/VideoList';
import Header from './components/Header';
import Stats from './components/Stats';
import { videoService } from './services/videoService';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    processingJobs: 0,
    completedJobs: 0,
    totalSize: 0
  });

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await videoService.getJobs();
      setJobs(response.jobs);
      
      // Calculate stats
      const totalJobs = response.jobs.length;
      const processingJobs = response.jobs.filter(job => job.status === 'processing').length;
      const completedJobs = response.jobs.filter(job => job.status === 'completed').length;
      const totalSize = response.jobs.reduce((sum, job) => sum + (job.file_size || 0), 0);
      
      setStats({
        totalJobs,
        processingJobs,
        completedJobs,
        totalSize
      });
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newJob) => {
    setJobs(prevJobs => [newJob, ...prevJobs]);
    setStats(prevStats => ({
      ...prevStats,
      totalJobs: prevStats.totalJobs + 1,
      processingJobs: prevStats.processingJobs + 1,
      totalSize: prevStats.totalSize + (newJob.file_size || 0)
    }));
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Section */}
          <Stats stats={stats} />
          
          {/* Upload Section */}
          <div className="animate-slideUp">
            <VideoUpload onUploadSuccess={handleUploadSuccess} />
          </div>
          
          {/* Jobs List Section */}
          <div className="animate-fadeIn">
            <VideoList 
              jobs={jobs} 
              loading={loading} 
              onRefresh={loadJobs}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
