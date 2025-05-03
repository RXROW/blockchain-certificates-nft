import React from 'react';

const DateRangeFilter = ({
  showDateFilter,
  setShowDateFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}) => {
  return (
    <>
      <div className="flex items-center mb-4">
        <button
          type="button"
          onClick={() => setShowDateFilter(!showDateFilter)}
          className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          <svg 
            className={`w-4 h-4 mr-2 transform ${showDateFilter ? 'rotate-180' : ''} transition-transform`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
          {showDateFilter ? 'Hide Date Filter' : 'Show Date Filter'}
        </button>
      </div>

      {showDateFilter && (
        <div className="p-4 bg-gray-700/40 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-400 mb-1 text-sm">Start Date</label>
              <input
                type="date"
                value={startDate ? new Date(startDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value).getTime() / 1000 : null)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 text-sm">End Date</label>
              <input
                type="date"
                value={endDate ? new Date(endDate * 1000).toISOString().split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value).getTime() / 1000 : null)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
            >
              Clear Dates
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DateRangeFilter; 