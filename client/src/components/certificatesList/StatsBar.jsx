import React from 'react';
import { Award, CheckCircle, AlertCircle } from 'lucide-react';

// Stats Bar Component with Dark Theme
export default function StatsBar({ totalCount = 0, filteredCount = 0, verifiedCount = 0 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-slate-900 to-violet-900 text-white rounded-lg shadow p-5">
                <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                    <Award className="w-4 h-4" />
                    Total Certificates
                </div>
                <div className="text-2xl font-bold">{totalCount}</div>
            </div>
            <div className="bg-gradient-to-r from-slate-900 to-violet-900 text-white rounded-lg shadow p-5">
                <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                    <AlertCircle className="w-4 h-4" />
                    Visible Certificates
                </div>
                <div className="text-2xl font-bold text-blue-400">{filteredCount}</div>
            </div>
            <div className="bg-gradient-to-r from-slate-900 to-violet-900 text-white rounded-lg shadow p-5">
                <div className="flex items-center gap-2 text-gray-300 text-sm mb-1">
                    <CheckCircle className="w-4 h-4" />
                    Verified Certificates
                </div>
                <div className="text-2xl font-bold text-green-400">
                    {verifiedCount}
                </div>
            </div>
        </div>
    );
}