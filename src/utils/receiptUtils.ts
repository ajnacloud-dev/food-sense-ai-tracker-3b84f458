
interface ReceiptEntry {
  id: string;
  vendor: string;
  receipt_date: string;
  total_amount: number;
  items: any;
  image_url: string;
  tags: string[];
  created_at: string;
  user_id: string;
  description?: string;
  category?: string;
}

export const filterReceipts = (receipts: ReceiptEntry[], filters: any) => {
  return receipts.filter(receipt => {
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const vendorMatch = receipt.vendor?.toLowerCase().includes(searchLower);
      const itemsMatch = receipt.items && Array.isArray(receipt.items) 
        ? receipt.items.some((item: any) => item.name?.toLowerCase().includes(searchLower))
        : false;
      
      if (!vendorMatch && !itemsMatch) return false;
    }

    // Vendor filter
    if (filters.vendor && receipt.vendor !== filters.vendor) {
      return false;
    }

    // Amount filters
    if (filters.minAmount && receipt.total_amount < parseFloat(filters.minAmount)) {
      return false;
    }
    if (filters.maxAmount && receipt.total_amount > parseFloat(filters.maxAmount)) {
      return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const receiptDate = new Date(receipt.receipt_date || receipt.created_at);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          if (receiptDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (receiptDate < weekAgo) return false;
          break;
        case 'month':
          if (receiptDate.getMonth() !== now.getMonth() || receiptDate.getFullYear() !== now.getFullYear()) return false;
          break;
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const receiptQuarter = Math.floor(receiptDate.getMonth() / 3);
          if (receiptQuarter !== currentQuarter || receiptDate.getFullYear() !== now.getFullYear()) return false;
          break;
        case 'year':
          if (receiptDate.getFullYear() !== now.getFullYear()) return false;
          break;
      }
    }

    return true;
  });
};

export const sortReceipts = (receipts: ReceiptEntry[], sortBy: string) => {
  return [...receipts].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.receipt_date || b.created_at).getTime() - new Date(a.receipt_date || a.created_at).getTime();
      case 'date-asc':
        return new Date(a.receipt_date || a.created_at).getTime() - new Date(b.receipt_date || b.created_at).getTime();
      case 'amount-desc':
        return (b.total_amount || 0) - (a.total_amount || 0);
      case 'amount-asc':
        return (a.total_amount || 0) - (b.total_amount || 0);
      case 'vendor-asc':
        return (a.vendor || '').localeCompare(b.vendor || '');
      case 'vendor-desc':
        return (b.vendor || '').localeCompare(a.vendor || '');
      default:
        return 0;
    }
  });
};

export const getUniqueVendors = (receipts: ReceiptEntry[]) => {
  return Array.from(new Set(receipts.map(receipt => receipt.vendor).filter(Boolean))).sort();
};

export const calculateSpendingStats = (receipts: ReceiptEntry[]) => {
  const total = receipts.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);
  const average = receipts.length > 0 ? total / receipts.length : 0;
  
  // Calculate monthly spending
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonth = receipts.filter(receipt => {
    const date = new Date(receipt.receipt_date || receipt.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  const lastMonth = receipts.filter(receipt => {
    const date = new Date(receipt.receipt_date || receipt.created_at);
    const lastMonthDate = new Date(currentYear, currentMonth - 1);
    return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
  });

  const thisMonthTotal = thisMonth.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);
  const lastMonthTotal = lastMonth.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);
  
  const monthlyChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return {
    total,
    average,
    thisMonthTotal,
    lastMonthTotal,
    monthlyChange,
    totalReceipts: receipts.length,
    thisMonthReceipts: thisMonth.length
  };
};

export const getSpendingByCategory = (receipts: ReceiptEntry[]) => {
  const categories: { [key: string]: number } = {};
  
  receipts.forEach(receipt => {
    // Simple categorization based on vendor name
    const vendor = receipt.vendor?.toLowerCase() || '';
    let category = 'Other';
    
    if (vendor.includes('grocery') || vendor.includes('market') || vendor.includes('food')) {
      category = 'Groceries';
    } else if (vendor.includes('restaurant') || vendor.includes('cafe') || vendor.includes('dining')) {
      category = 'Dining';
    } else if (vendor.includes('gas') || vendor.includes('fuel') || vendor.includes('station')) {
      category = 'Gas';
    } else if (vendor.includes('pharmacy') || vendor.includes('drug') || vendor.includes('cvs') || vendor.includes('walgreens')) {
      category = 'Pharmacy';
    } else if (vendor.includes('retail') || vendor.includes('store') || vendor.includes('walmart') || vendor.includes('target')) {
      category = 'Retail';
    }
    
    categories[category] = (categories[category] || 0) + (receipt.total_amount || 0);
  });
  
  return Object.entries(categories)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
};
