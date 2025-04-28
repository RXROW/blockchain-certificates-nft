import React from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';

// Search and Filter Component
export default function SearchAndFilter({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    showAdvancedFilters,
    setShowAdvancedFilters,
    dateFilter,
    setDateFilter
}) {
    return (
        <div className="mb-6">
            <div className="bg-gradient-to-r from-slate-900 to-violet-900 text-white rounded-lg shadow p-5">
                {/* Basic search and filter options */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search certificates..."
                            className="pl-10 bg-slate-950 outline-none border-none pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 bg-slate-950 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="revoked">Revoked</option>
                    </select>

                    <div className="flex border  rounded-lg overflow-hidden">
                        <button
                            className={`px-4 py-2 flex items-center  gap-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-950'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid className="w-4 h-4" />
                            Grid
                        </button>
                        <button
                            className={`px-4 py-2 flex items-center gap-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-950'}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4" />
                            List
                        </button>
                    </div>
                </div>

                {/* Advanced filters toggle */}
                <div>
                    <button
                        className="flex items-center text-blue-600 hover:text-blue-800"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    >
                        <Filter className="w-4 h-4 mr-1" />
                        {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                    </button>
                </div>

                {/* Advanced filters panel */}
                {showAdvancedFilters && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    className="px-4 bg-slate-950 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={dateFilter.start}
                                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    className="px-4 py-2 bg-slate-950 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={dateFilter.end}
                                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}