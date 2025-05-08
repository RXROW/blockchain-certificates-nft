import React from 'react';

const StatusCards = ({ 
  totalCertificates, 
  certificatesCount, 
  visibleCount, 
  lastUpdated,
  isLoading,
  onFetchRecent,
  isAdmin = false,
  isInstitute = false
}) => {
  // For regular users, show a simplified version
  if (!isAdmin && !isInstitute) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-700/50 rounded-lg relative overflow-hidden">
            <p className="text-sm text-gray-400">My Certificates</p>
            <div className="text-2xl font-bold text-violet-400">
              {isLoading ? (
                <div className="relative">
                  <span className="opacity-0">0</span>
                  <div className="absolute inset-0 flex justify-center items-center">
                    <div className="flex space-x-1">
                      {[0,1,2].map((i) => (
                        <div 
                          key={i}
                          className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" 
                          style={{ 
                            animationDelay: `${i * 0.15}s`,
                            boxShadow: '0 0 10px 2px rgba(139, 92, 246, 0.5)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <span>{certificatesCount}</span>
                  {/* Glowing bottom border */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500 to-violet-500/0"></div>
                </div>
              )}
            </div>
            {/* Add futuristic accent */}
            <div className="absolute top-0 right-0 w-10 h-10">
              <div className="absolute top-0 right-0 w-10 h-1 bg-violet-500 opacity-50"></div>
              <div className="absolute top-0 right-0 w-1 h-10 bg-violet-500 opacity-50"></div>
            </div>
          </div>
          
          <div className="text-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-600/50 transition-colors relative overflow-hidden group"
               onClick={() => onFetchRecent(10)}>
            <p className="text-sm text-gray-400">View Recent</p>
            <div className="text-lg font-bold text-green-400 relative z-10">Show Latest 10</div>
            {/* Add interactive futuristic accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700/0 via-green-500/5 to-gray-700/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // For admin/institute users, show the full version
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-700/50 rounded-lg relative overflow-hidden">
          <p className="text-sm text-gray-400">Total Certificates</p>
          <div className="text-2xl font-bold text-violet-400">
            {isLoading ? (
              <div className="relative">
                <span className="opacity-0">0</span>
                <div className="absolute inset-0 flex justify-center items-center">
                  <div className="flex space-x-1">
                    {[0,1,2].map((i) => (
                      <div 
                        key={i}
                        className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" 
                        style={{ 
                          animationDelay: `${i * 0.15}s`,
                          boxShadow: '0 0 10px 2px rgba(139, 92, 246, 0.5)'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <span>{totalCertificates}</span>
                {/* Glowing bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500 to-violet-500/0"></div>
              </div>
            )}
          </div>
          {/* Add futuristic accent */}
          <div className="absolute top-0 right-0 w-10 h-10">
            <div className="absolute top-0 right-0 w-10 h-1 bg-violet-500 opacity-50"></div>
            <div className="absolute top-0 right-0 w-1 h-10 bg-violet-500 opacity-50"></div>
          </div>
        </div>
        <div className="text-center p-3 bg-gray-700/50 rounded-lg relative overflow-hidden">
          <p className="text-sm text-gray-400">Loaded</p>
          <div className="text-2xl font-bold text-violet-400">{certificatesCount}</div>
          {/* Add futuristic accent */}
          <div className="absolute top-0 right-0 w-10 h-10">
            <div className="absolute top-0 right-0 w-10 h-1 bg-violet-500 opacity-30"></div>
            <div className="absolute top-0 right-0 w-1 h-10 bg-violet-500 opacity-30"></div>
          </div>
        </div>
        <div className="text-center p-3 bg-gray-700/50 rounded-lg relative overflow-hidden">
          <p className="text-sm text-gray-400">Visible</p>
          <div className="text-2xl font-bold text-violet-400">{visibleCount}</div>
          {/* Add futuristic accent */}
          <div className="absolute top-0 right-0 w-10 h-10">
            <div className="absolute top-0 right-0 w-10 h-1 bg-violet-500 opacity-30"></div>
            <div className="absolute top-0 right-0 w-1 h-10 bg-violet-500 opacity-30"></div>
          </div>
        </div>
        <div className="text-center p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-600/50 transition-colors relative overflow-hidden group"
             onClick={() => onFetchRecent(10)}>
          <p className="text-sm text-gray-400">View Recent</p>
          <div className="text-lg font-bold text-green-400 relative z-10">Show Latest 10</div>
          {/* Add interactive futuristic accent */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700/0 via-green-500/5 to-gray-700/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        </div>
      </div>
    </div>
  );
};

export default StatusCards; 