// utils/ejsHelpers.js

function getStatusClass(status) {
  const statusClasses = {
    'Processing': 'bg-blue-100 text-blue-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Shipped': 'bg-purple-100 text-purple-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Return Request': 'bg-orange-100 text-orange-800',
    'Returned': 'bg-gray-100 text-gray-800',
    'Return Rejected': 'bg-red-100 text-red-800',
    'Return Accepted': 'bg-green-100 text-green-800'
  };
  return statusClasses[status] || 'bg-gray-100 text-gray-800';
}

function getStatusIcon(status) {
  const statusIcons = {
    'Processing': 'fas fa-cog fa-spin',
    'Pending': 'fas fa-clock',
    'Shipped': 'fas fa-truck',
    'Delivered': 'fas fa-check-circle',
    'Cancelled': 'fas fa-times-circle',
    'Return Request': 'fas fa-undo',
    'Returned': 'fas fa-box-open',
    'Return Rejected': 'fas fa-times',
    'Return Accepted': 'fas fa-check'
  };
  return statusIcons[status] || 'fas fa-info-circle';
}

function getPaymentStatusClass(status) {
  const paymentClasses = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Paid': 'bg-green-100 text-green-800',
    'Failed': 'bg-red-100 text-red-800'
  };
  return paymentClasses[status] || 'bg-gray-100 text-gray-800';
}

export { getStatusClass, getStatusIcon, getPaymentStatusClass };
