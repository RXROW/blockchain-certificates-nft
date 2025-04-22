// Utils.js - Utility functions
export const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzJkM2Q0MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2YzcyN2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==";

export const formatGrade = (grade) => {
  if (grade >= 90) return "A";
  if (grade >= 80) return "B";
  if (grade >= 70) return "C";
  if (grade >= 60) return "D";
  return "F";
};

export const getStatusColor = (certificate) => {
  if (certificate.isRevoked) return "bg-red-500 text-white";
  if (certificate.isVerified) return "bg-green-500 text-white";
  return "bg-yellow-500 text-white";
};

export const getStatusText = (certificate) => {
  if (certificate.isRevoked) return "Revoked";
  if (certificate.isVerified) return "Verified";
  return "Pending";
};

export const getStatusBorderColor = (certificate) => {
  if (certificate.isRevoked) return "  hover:border-red-500 border-2";
  if (certificate.isVerified) return "   hover:border-green-500 border-2";
  return "   hover:border-yellow-500 border-2";
};