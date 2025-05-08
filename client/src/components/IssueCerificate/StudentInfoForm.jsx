import React from 'react';
import LoadingSpinner from '../Shared/LoadingSpinner';
import ErrorDisplay from '../../components/Certificates/ErrorDisplay';

function StudentInfoForm({
    formData,
    onInputChange,
    validationErrors,
    touchedFields,
    loading,
    courses,
    loadingCourses
}) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onInputChange(name, value);
    };

    return (
        <div className="space-y-6">
            {/* Futuristic toast for invalid address */}
            {validationErrors.studentAddress && touchedFields.studentAddress && (
                <ErrorDisplay error={validationErrors.studentAddress} />
            )}
            <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                    Student Address
                </label>
                <input
                    type="text"
                    name="studentAddress"
                    value={formData.studentAddress}
                    onChange={handleChange}
                    placeholder="0x... (Ethereum address)"
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-cyan-900/40 text-cyan-100 outline-none rounded-xl border-2 border-cyan-400/80 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 shadow-cyan-400/30 font-mono tracking-widest transition-all duration-200 futuristic-input ${validationErrors.studentAddress && touchedFields.studentAddress ? 'border-red-500 ring-2 ring-red-400' : ''}`}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                    Course
                </label>
                <select
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleChange}
                    disabled={loading || loadingCourses}
                    className={`w-full px-4 py-3 bg-cyan-900/40 text-cyan-100 outline-none rounded-xl border-2 border-cyan-400/80 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 shadow-cyan-400/30 font-mono tracking-widest transition-all duration-200 futuristic-input ${validationErrors.courseId && touchedFields.courseId ? 'border-red-500 ring-2 ring-red-400' : ''}`}
                >
                    <option value="" className=' text-slate-900' >Select a course</option>
                    {loadingCourses ? (
                        <option disabled>Loading courses...</option>
                    ) : (
                        courses.map(course => (
                            <option key={course.id} value={course.id}  className=' text-slate-900'>
                                {course.name}
                            </option>
                        ))
                    )}
                </select>
                {validationErrors.courseId && touchedFields.courseId && (
                    <p className="mt-2 text-sm text-red-400">{validationErrors.courseId}</p>
                )}
                {loadingCourses && (
                    <div className="mt-2 flex items-center gap-2 text-gray-400">
                        <LoadingSpinner size="small" />
                        <span className="text-sm">Loading courses...</span>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                    Grade
                </label>
                <input
                    type="number"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    onInput={e => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val) {
                            let num = Math.max(1, Math.min(100, parseInt(val)));
                            e.target.value = num;
                        }
                        else {
                            e.target.value = '';
                        }
                        onInputChange('grade', e.target.value);
                    }}
                    placeholder="Grade (1-100)"
                    min={1}
                    max={100}
                    step={1}
                    pattern="[0-9]*"
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-cyan-900/40 text-cyan-100 outline-none rounded-xl border-2 border-cyan-400/80 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 shadow-cyan-400/30 font-mono tracking-widest transition-all duration-200 futuristic-input ${validationErrors.grade && touchedFields.grade ? 'border-red-500 ring-2 ring-red-400' : ''}`}
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield', appearance: 'textfield' }}
                />
                {validationErrors.grade && touchedFields.grade && (
                    <p className="mt-2 text-sm text-red-400">{validationErrors.grade}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                    Certificate Title
                </label>
                <input
                    type="text"
                    name="certificateData"
                    value={formData.certificateData}
                    onChange={handleChange}
                    placeholder="Certificate Title (letters only, max 40)"
                    maxLength={40}
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-cyan-900/40 text-cyan-100 outline-none rounded-xl border-2 border-cyan-400/80 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-300 shadow-cyan-400/30 font-mono tracking-widest transition-all duration-200 futuristic-input ${validationErrors.certificateData && touchedFields.certificateData ? 'border-red-500 ring-2 ring-red-400' : ''}`}
                />
                {validationErrors.certificateData && touchedFields.certificateData && (
                    <p className="mt-2 text-sm text-red-400">{validationErrors.certificateData}</p>
                )}
            </div>
        </div>
    );
}

export default StudentInfoForm;

/*
// Add this CSS globally or in your main CSS file for all number inputs:
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
// Optionally, add a .futuristic-input class for extra effects:
.futuristic-input {
  box-shadow: 0 0 12px 0 #06b6d4cc, 0 0 0 2px #0ff3  inset;
  background: linear-gradient(120deg, #0a1022cc 60%, #0e1a2fcc 100%);
  transition: box-shadow 0.3s, border-color 0.3s;
}
.futuristic-input:focus {
  box-shadow: 0 0 24px 2px #06b6d4cc, 0 0 0 2px #0ff9  inset;
  border-color: #67e8f9;
}
*/


 