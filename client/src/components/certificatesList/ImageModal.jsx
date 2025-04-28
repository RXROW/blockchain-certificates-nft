import React from 'react';
import { X, Award, User } from 'lucide-react';

// Image Modal Component
export default function ImageModal({ certificate, onClose }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b p-5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        {certificate.courseName} - Certificate
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-gray-100 p-4 rounded-lg">
                        <img
                            src={certificate.imageUrl}
                            alt="Certificate"
                            className="w-full h-auto"
                        />
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-500">Issued to:</span>
                            <span className="ml-2 font-medium">{certificate.student}</span>
                        </div>

                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}