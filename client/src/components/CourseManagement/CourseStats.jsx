import React, { useMemo } from 'react';
import { FaBookOpen, FaGraduationCap, FaCertificate } from 'react-icons/fa';

const CourseStats = ({ courses, loading }) => {
  const stats = useMemo(() => {
    if (!courses || courses.length === 0) {
      return {
        totalCourses: 0,
        totalCertificates: 0,
        avgCertificatesPerCourse: 0
      };
    }
    
    const totalCourses = courses.length;
    const totalCertificates = courses.reduce((sum, course) => sum + (course.certificateCount || 0), 0);
    const avgCertificatesPerCourse = totalCourses > 0 
      ? Math.round((totalCertificates / totalCourses) * 10) / 10
      : 0;
      
    return {
      totalCourses,
      totalCertificates,
      avgCertificatesPerCourse
    };
  }, [courses]);
  
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Courses */}
      <div className="relative overflow-hidden rounded-xl p-0.5 bg-gradient-to-br from-blue-600/20 to-purple-600/20">
        <div className="rounded-lg bg-gray-900 p-5 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-full p-3 bg-blue-500/10 mr-4">
              <FaBookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Total Courses</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">
                  {loading ? 
                    <div className="h-9 w-12 bg-gray-800 animate-pulse rounded"></div> : 
                    stats.totalCourses
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Total Certificates */}
      <div className="relative overflow-hidden rounded-xl p-0.5 bg-gradient-to-br from-green-600/20 to-teal-600/20">
        <div className="rounded-lg bg-gray-900 p-5 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-full p-3 bg-green-500/10 mr-4">
              <FaCertificate className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Total Certificates</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">
                  {loading ? 
                    <div className="h-9 w-16 bg-gray-800 animate-pulse rounded"></div> : 
                    stats.totalCertificates
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Average Certificates per Course */}
      <div className="relative overflow-hidden rounded-xl p-0.5 bg-gradient-to-br from-purple-600/20 to-pink-600/20">
        <div className="rounded-lg bg-gray-900 p-5 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-full p-3 bg-purple-500/10 mr-4">
              <FaGraduationCap className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Avg. Certificates / Course</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-white">
                  {loading ? 
                    <div className="h-9 w-10 bg-gray-800 animate-pulse rounded"></div> : 
                    stats.avgCertificatesPerCourse
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseStats; 