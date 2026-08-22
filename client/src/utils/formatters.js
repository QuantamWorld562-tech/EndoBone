/**
 * Utility functions for formatting dates, numbers, and clinical metrics.
 */

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatScore = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return Number(val).toFixed(decimals);
};

export const getRiskColorClass = (riskLevel) => {
  switch (riskLevel?.toLowerCase()) {
    case 'high':
    case 'critical':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-700 ring-red-200',
      };
    case 'moderate':
    case 'medium':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700 ring-amber-200',
      };
    case 'low':
    case 'normal':
    default:
      return {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        badge: 'bg-teal-100 text-teal-700 ring-teal-200',
      };
  }
};
