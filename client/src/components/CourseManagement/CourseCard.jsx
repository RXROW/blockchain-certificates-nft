import React from 'react';
import { FaGraduationCap } from 'react-icons/fa';

const CourseCard = ({ course }) => {
  return (
    <div 
      className={`relative overflow-hidden rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 p-1 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group ${course._isOptimistic ? 'opacity-60' : ''}`}
    >
      {/* Glow effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Card inner content */}
      <div className="relative rounded-lg bg-gray-900 p-5 h-full flex flex-col">
        {/* Course ID chip */}
        <div className="flex justify-between mb-4">
          <div className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full border border-blue-500/30 inline-flex items-center">
            <span className="text-xs mr-1 text-blue-300/70">ID:</span> {course.id}
          </div>
        </div>
        
        {/* Course name */}
        <h3 className="text-xl font-semibold text-white mb-4 flex-grow">
          {course.name}
        </h3>
        
        {/* Certificate count - bottom section */}
        <div className="mt-auto pt-4 border-t border-gray-700/50">
          <div className="flex items-center">
            <div className="flex items-center gap-3 bg-gray-800/70 rounded-lg px-4 py-3 w-full">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/30">
                <FaGraduationCap size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">{course.certificateCount || 0}</span>
                <span className="text-xs text-gray-400">Certificates Issued</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard; 