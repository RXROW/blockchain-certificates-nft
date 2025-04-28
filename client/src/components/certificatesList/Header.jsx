import React from 'react';

export default function Header() {
    return (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-800 text-white p-8">
            <div className="container mx-auto">
                <h1 className="text-3xl font-bold mb-2">Certificate Management</h1>
                <p className="text-blue-100">
                    Last updated: {new Date().toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
} 