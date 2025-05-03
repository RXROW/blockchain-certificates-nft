import React from 'react';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';

const PaginationControls = ({
  loadingMore,
  hasMore,
  loadMoreCertificates,
  certificates
}) => {
  return (
    <>
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center items-center py-4">
          <div className="mr-2">
            <FuturisticSpinner size="sm" color="violet" />
          </div>
          <span>Loading more certificates...</span>
        </div>
      )}
      
      {/* Load more button */}
      {hasMore && !loadingMore && (
        <div className="flex justify-center p-4">
          <button
            onClick={loadMoreCertificates}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
            disabled={loadingMore}
          >
            {loadingMore ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4">
                  <FuturisticSpinner size="sm" color="white" />
                </div>
                <span>Loading...</span>
              </div>
            ) : (
              "Load More Certificates"
            )}
          </button>
        </div>
      )}
      
      {/* End of list indicator */}
      {!hasMore && certificates.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          End of certificates list
        </div>
      )}
    </>
  );
};

export default PaginationControls; 