// src/utils/notificationHelpers.js

/**
 * Format notification timestamp to a readable string
 * @param {string|Date} timestamp 
 * @returns {string}
 */
export const formatNotificationTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  } catch (error) {
    return 'Just now';
  }
};

/**
 * Get category-specific display configurations (colors, titles, icons)
 * @param {string} category 
 * @returns {object}
 */
export const getCategoryConfig = (category) => {
  const configs = {
    order: { icon: '🛍️', color: '#25D366', title: 'Order Update' },
    inventory: { icon: '⚠️', color: '#F44336', title: 'Inventory Alert' },
    payment: { icon: '💰', color: '#FF9800', title: 'Payment Alert' },
    promotion: { icon: '🎉', color: '#9C27B0', title: 'Special Promo' },
    system: { icon: '🔔', color: '#607D8B', title: 'System Notification' },
  };
  return configs[category] || configs.system;
};
