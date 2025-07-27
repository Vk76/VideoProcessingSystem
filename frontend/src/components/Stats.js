import React from 'react';

const Stats = ({ stats }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      icon: '📊',
      color: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      title: 'Processing',
      value: stats.processingJobs,
      icon: '⏳',
      color: '#ca8a04',
      bgColor: '#fefce8',
    },
    {
      title: 'Completed',
      value: stats.completedJobs,
      icon: '✅',
      color: '#16a34a',
      bgColor: '#f0fdf4',
    },
    {
      title: 'Total Size',
      value: formatFileSize(stats.totalSize),
      icon: '💾',
      color: '#7c3aed',
      bgColor: '#f3e8ff',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <div key={index} className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                {stat.title}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#1f2937' }}>
                {stat.value}
              </p>
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: stat.bgColor,
              borderRadius: '8px',
              fontSize: '20px'
            }}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Stats;
