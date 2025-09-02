// Orders Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initializeOrdersPage();
    
    // Add event listeners
    addEventListeners();
});

// Initialize the orders page
function initializeOrdersPage() {
    console.log('Orders page initialized');
    
    // Set up any initial state
    setupInitialFilters();
    
    // Add loading states if needed
    setupLoadingStates();
}

// Add event listeners
function addEventListeners() {
    // Table row click events
    const tableRows = document.querySelectorAll('.orders-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('click', function(e) {
            // Don't trigger if clicking on a button or link
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            
            selectOrder(this);
        });
    });
    
    // Filter change events
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            filterOrders(this.name || 'priority', this.value);
        });
    });
    
    // Search input events
    const searchInput = document.querySelector('.filter-input[placeholder*="Search"]');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchOrders(this.value);
        });
    }
    
    // Date filter events
    const dateInput = document.querySelector('.filter-input[type="date"]');
    if (dateInput) {
        dateInput.addEventListener('change', function() {
            filterOrders('date', this.value);
        });
    }
}

// Setup initial filters
function setupInitialFilters() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Set initial values for filters based on URL params
    const priorityFilter = document.querySelector('.filter-select[onchange*="priority"]');
    if (priorityFilter && urlParams.get('priority')) {
        priorityFilter.value = urlParams.get('priority');
    }
    
    const dateFilter = document.querySelector('.filter-input[type="date"]');
    if (dateFilter && urlParams.get('date')) {
        dateFilter.value = urlParams.get('date');
    }
    
    const searchFilter = document.querySelector('.filter-input[placeholder*="Search"]');
    if (searchFilter && urlParams.get('search')) {
        searchFilter.value = urlParams.get('search');
        searchOrders(searchFilter.value);
    }
}

// Setup loading states
function setupLoadingStates() {
    // Add loading class to table when filtering
    const tableContainer = document.querySelector('.orders-table-container');
    if (tableContainer) {
        tableContainer.addEventListener('filter-start', function() {
            this.classList.add('loading');
        });
        
        tableContainer.addEventListener('filter-end', function() {
            this.classList.remove('loading');
        });
    }
}

// Filter orders based on criteria
function filterOrders(filterType, value) {
    console.log(`Filtering orders by ${filterType}: ${value}`);
    
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    let visibleCount = 0;
    
    // Show loading state
    const tableContainer = document.querySelector('.orders-table-container');
    if (tableContainer) {
        tableContainer.dispatchEvent(new Event('filter-start'));
    }
    
    rows.forEach(row => {
        let shouldShow = true;
        
        switch (filterType) {
            case 'priority':
                shouldShow = filterByPriority(row, value);
                break;
            case 'date':
                shouldShow = filterByDate(row, value);
                break;
            case 'status':
                shouldShow = filterByStatus(row, value);
                break;
            default:
                shouldShow = true;
        }
        
        if (shouldShow) {
            row.style.display = '';
            visibleCount++;
            // Add animation
            row.style.animation = 'fadeInUp 0.3s ease forwards';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update URL with filter parameters
    updateURLWithFilters(filterType, value);
    
    // Show/hide empty state
    showEmptyStateIfNeeded(visibleCount);
    
    // Hide loading state
    setTimeout(() => {
        if (tableContainer) {
            tableContainer.dispatchEvent(new Event('filter-end'));
        }
    }, 300);
}

// Filter by priority
function filterByPriority(row, priority) {
    if (!priority) return true;
    
    const priorityCell = row.querySelector('.priority-badge');
    if (!priorityCell) return true;
    
    const rowPriority = priorityCell.textContent.toLowerCase().trim();
    return rowPriority === priority.toLowerCase();
}

// Filter by date
function filterByDate(row, date) {
    if (!date) return true;
    
    const dateCell = row.querySelector('td:nth-child(4) .primary-text');
    if (!dateCell) return true;
    
    const rowDate = dateCell.textContent;
    const filterDate = new Date(date);
    const rowDateObj = parseDate(rowDate);
    
    if (!rowDateObj) return true;
    
    return rowDateObj.toDateString() === filterDate.toDateString();
}

// Filter by status (if implemented)
function filterByStatus(row, status) {
    if (!status) return true;
    
    const statusCell = row.querySelector('.status-badge');
    if (!statusCell) return true;
    
    const rowStatus = statusCell.textContent.toLowerCase().trim();
    return rowStatus === status.toLowerCase();
}

// Search orders
function searchOrders(searchTerm) {
    console.log(`Searching orders: ${searchTerm}`);
    
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');
    let visibleCount = 0;
    
    // Show loading state
    const tableContainer = document.querySelector('.orders-table-container');
    if (tableContainer) {
        tableContainer.dispatchEvent(new Event('filter-start'));
    }
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const shouldShow = !searchTerm || text.includes(searchTerm.toLowerCase());
        
        if (shouldShow) {
            row.style.display = '';
            visibleCount++;
            // Add animation
            row.style.animation = 'fadeInUp 0.3s ease forwards';
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update URL with search parameter
    updateURLWithFilters('search', searchTerm);
    
    // Show/hide empty state
    showEmptyStateIfNeeded(visibleCount);
    
    // Hide loading state
    setTimeout(() => {
        if (tableContainer) {
            tableContainer.dispatchEvent(new Event('filter-end'));
        }
    }, 300);
}

// Select order row
function selectOrder(row) {
    // Remove previous selection
    const selectedRows = document.querySelectorAll('.orders-table tbody tr.selected');
    selectedRows.forEach(selectedRow => {
        selectedRow.classList.remove('selected');
    });
    
    // Add selection to current row
    row.classList.add('selected');
    
    // Get order ID
    const orderId = row.getAttribute('data-order-id');
    console.log(`Selected order: ${orderId}`);
    
    // You can add additional functionality here
    // For example, show order details in a modal or sidebar
    showOrderDetails(orderId);
}

// Show order details (placeholder function)
function showOrderDetails(orderId) {
    // This function can be expanded to show order details
    // For now, it just logs the order ID
    console.log(`Showing details for order: ${orderId}`);
    
    // You could implement:
    // - Modal popup with order details
    // - Sidebar with order information
    // - Highlight related orders
    // - Show order timeline
}

// Update URL with filter parameters
function updateURLWithFilters(filterType, value) {
    const url = new URL(window.location);
    
    if (value && value.trim() !== '') {
        url.searchParams.set(filterType, value);
    } else {
        url.searchParams.delete(filterType);
    }
    
    // Update URL without reloading the page
    window.history.replaceState({}, '', url);
}

// Show empty state if no orders are visible
function showEmptyStateIfNeeded(visibleCount) {
    const emptyState = document.querySelector('.empty-state');
    const tableContainer = document.querySelector('.orders-table-container');
    
    if (visibleCount === 0 && tableContainer) {
        // Create temporary empty state for filtered results
        if (!emptyState) {
            const tempEmptyState = document.createElement('div');
            tempEmptyState.className = 'empty-state';
            tempEmptyState.innerHTML = `
                <h3>No Orders Found</h3>
                <p>No orders match your current filters. Try adjusting your search criteria.</p>
                <button class="btn btn-outline" onclick="clearAllFilters()">Clear All Filters</button>
            `;
            tableContainer.appendChild(tempEmptyState);
        }
    } else if (emptyState && emptyState.parentElement === tableContainer) {
        // Remove temporary empty state
        emptyState.remove();
    }
}

// Clear all filters
function clearAllFilters() {
    // Clear filter inputs
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.value = '';
    });
    
    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        input.value = '';
    });
    
    // Show all rows
    const tableBody = document.getElementById('ordersTableBody');
    if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            row.style.display = '';
            row.style.animation = 'fadeInUp 0.3s ease forwards';
        });
    }
    
    // Clear URL parameters
    const url = new URL(window.location);
    url.search = '';
    window.history.replaceState({}, '', url);
    
    // Remove temporary empty state
    const tempEmptyState = document.querySelector('.empty-state');
    if (tempEmptyState && tempEmptyState.parentElement === document.querySelector('.orders-table-container')) {
        tempEmptyState.remove();
    }
}

// Parse date from string (helper function)
function parseDate(dateString) {
    // Handle different date formats
    const formats = [
        /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/ // DD/MM/YYYY
    ];
    
    for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
            const [, day, month, year] = match;
            return new Date(year, month - 1, day);
        }
    }
    
    return null;
}

// Export functions for global access
window.filterOrders = filterOrders;
window.searchOrders = searchOrders;
window.selectOrder = selectOrder;
window.clearAllFilters = clearAllFilters;

// Add some utility functions
window.ordersUtils = {
    // Format date for display
    formatDate: function(date) {
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    
    // Format currency
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },
    
    // Debounce function for search
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Apply debouncing to search
const debouncedSearch = window.ordersUtils.debounce(searchOrders, 300);
const searchInput = document.querySelector('.filter-input[placeholder*="Search"]');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        debouncedSearch(this.value);
    });
}