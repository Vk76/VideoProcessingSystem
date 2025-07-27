import React from 'react';
import { Video, Zap } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">
                Video Processing System
              </h1>
              <p className="text-secondary-600 text-sm">
                Upload, process, and download your videos with ease
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-lg">
            <Zap className="w-4 h-4 text-primary-600" />
            <span className="text-primary-700 font-medium text-sm">
              Powered by AWS & Docker
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
