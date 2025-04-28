import React, { useState } from 'react';
import LoadingSpinner from '../Shared/LoadingSpinner';
import toast from 'react-hot-toast';

const InstitutionsForm = ({ onSuccess, onError }) => {
    const [newInstitution, setNewInstitution] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [institutionToDelete, setInstitutionToDelete] = useState(null);

    const validateEthereumAddress = (address) => {
        // Simple regex for Ethereum address validation
        const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        return ethereumAddressRegex.test(address);
    };

    const addInstitution = async () => {
        if (!validateEthereumAddress(newInstitution)) {
            const errorMsg = 'Please enter a valid Ethereum address';
            setError(errorMsg);
            if (onError) onError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        if (!institutionName.trim()) {
            const errorMsg = 'Please enter an institution name';
            setError(errorMsg);
            if (onError) onError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const successMsg = `${newInstitution} added successfully`;
            setSuccess(successMsg);
            if (onSuccess) onSuccess(successMsg);
            setNewInstitution('');
            setInstitutionName('');
            toast.success(successMsg);
        } catch (err) {
            console.error('Error adding institution:', err);
            const errorMsg = err.message || 'Failed to add institution';
            setError(errorMsg);
            if (onError) onError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteInstitution = (address) => {
        setInstitutionToDelete(address);
        setShowConfirmDialog(true);
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setInstitutionToDelete(null);
    };

    const deleteInstitution = async () => {
        if (!institutionToDelete) return;

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const successMsg = `Institution deleted successfully`;
            setSuccess(successMsg);
            if (onSuccess) onSuccess(successMsg);
            toast.success(successMsg);
        } catch (err) {
            console.error('Error deleting institution:', err);
            const errorMsg = err.message || 'Failed to delete institution';
            setError(errorMsg);
            if (onError) onError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
            setShowConfirmDialog(false);
            setInstitutionToDelete(null);
        }
    };

    return (
        <div className="bg-gray-900/50 p-6 rounded border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Institution</h3>

          

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                    <label htmlFor="institution-name" className="block text-sm font-medium text-gray-300 mb-1">
                        Institution Name
                    </label>
                    <input
                        id="institution-name"
                        type="text"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="Enter institution name"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="institution-address" className="block text-sm font-medium text-gray-300 mb-1">
                        Ethereum Address
                    </label>
                    <div className="relative">
                        <input
                            id="institution-address"
                            type="text"
                            value={newInstitution}
                            onChange={(e) => setNewInstitution(e.target.value)}
                            placeholder="Enter institution address"
                            className={`w-full px-4 py-2 bg-gray-800 border ${newInstitution && !validateEthereumAddress(newInstitution)
                                ? 'border-red-500'
                                : 'border-gray-700'
                                } rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500`}
                        />
                        {newInstitution && !validateEthereumAddress(newInstitution) && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    {newInstitution && !validateEthereumAddress(newInstitution) && (
                        <p className="mt-1 text-sm text-red-400">Please enter a valid Ethereum address</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={addInstitution}
                    disabled={loading || !newInstitution || !institutionName.trim() || !validateEthereumAddress(newInstitution)}
                    className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading ? (
                        <>
                            <LoadingSpinner size="small" />
                            <span className="ml-2">Adding...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Institution
                        </>
                    )}
                </button>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded p-6 max-w-md w-full mx-4 border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Confirm Deletion</h3>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete the institution at address <span className="font-mono text-violet-300">{institutionToDelete}</span>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteInstitution}
                                disabled={loading}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span className="ml-2">Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Institution
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstitutionsForm;
