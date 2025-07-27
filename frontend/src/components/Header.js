import React from 'react';

const Header = () => {
  return (
    <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb' }}>
      <div className="container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              📹
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1f2937' }}>
                Video Processing System
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Upload, process, and download your videos with ease
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-2" style={{
            backgroundColor: '#eff6ff',
            padding: '8px 16px',
            borderRadius: '8px'
          }}>
            <span style={{ color: '#2563eb', fontSize: '16px' }}>⚡</span>
            <span style={{ color: '#1d4ed8', fontWeight: '500', fontSize: '14px' }}>
              Powered by AWS & Docker
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
