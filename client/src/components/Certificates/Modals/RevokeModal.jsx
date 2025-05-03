import React from 'react';
import { FaBan } from 'react-icons/fa';
import FuturisticSpinner from '../../../components/ui/FuturisticSpinner';

const RevokeModal = ({
  showRevokeModal,
  selectedCertificate,
  revocationReason,
  setRevocationReason,
  closeRevokeModal,
  handleRevokeSubmit,
  revokeLoading
}) => {
  if (!showRevokeModal || !selectedCertificate) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-red-900/30 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-red-400">Revoke Certificate</h3>
          <button
            onClick={closeRevokeModal}
            className="text-gray-400 hover:text-white text-xl"
          >
            &times;
          </button>
        </div>

        <p className="mb-4 text-gray-300">
          You are about to revoke certificate <span className="font-semibold">#{selectedCertificate.id}</span> for course <span className="font-semibold">{selectedCertificate.courseName}</span>.
        </p>

        <form onSubmit={handleRevokeSubmit}>
          <div className="mb-4">
            <label htmlFor="revocationReason" className="block text-gray-400 mb-1">Reason for Revocation</label>
            <textarea
              id="revocationReason"
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
              rows={3}
              placeholder="Enter reason for revocation..."
              required
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeRevokeModal}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={revokeLoading[selectedCertificate.id]}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              {revokeLoading[selectedCertificate.id] ? (
                <div className="mr-2 h-5 w-5">
                  <FuturisticSpinner size="sm" color="white" />
                </div>
              ) : <FaBan className="mr-2" />}
              Confirm Revocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RevokeModal; 