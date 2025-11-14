// Analysis Page JavaScript

// Global variables
let forecastData = null;
let isForecastRunning = false;

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Analysis page loaded');
    initializeCharts();
    setupEventListeners();
});

// Initialize charts and visualizations
function initializeCharts() {
    // Animate chart bars on page load
    setTimeout(() => {
        animateChartBars();
    }, 500);
}

// Setup event listeners
function setupEventListeners() {
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('forecastModal');
        if (event.target === modal) {
            closeForecastModal();
        }
    }
}

// Animate chart bars
function animateChartBars() {
    // Animate priority bars
    const priorityBars = document.querySelectorAll('.priority-chart .bar');
    priorityBars.forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 100);
    });

    // Animate package bars
    const packageBars = document.querySelectorAll('.package-chart .bar-fill');
    packageBars.forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 200);
    });

    // Animate trend bars
    const trendBars = document.querySelectorAll('.trend-chart .month-bar');
    trendBars.forEach((bar, index) => {
        const targetHeight = bar.style.height;
        bar.style.height = '20px';
        setTimeout(() => {
            bar.style.height = targetHeight;
        }, 300 + (index * 100));
    });
}

// Generate AI Forecast
function generateForecast() {
    if (isForecastRunning) {
        return;
    }

    isForecastRunning = true;
    showForecastModal();
    
    // Simulate AI analysis process
    window.location.href = "http://127.0.0.1:5550";
}

// Simulate forecast generation process
function simulateForecastGeneration() {
    const progressBar = document.getElementById('forecastProgress');
    const statusText = document.getElementById('forecastStatus');
    let progress = 0;
    
    const steps = [
        'Analyzing historical data...',
        'Processing order patterns...',
        'Identifying seasonal trends...',
        'Calculating growth metrics...',
        'Generating predictions...',
        'Finalizing forecast...'
    ];
    
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress > 100) progress = 100;
        
        progressBar.style.width = progress + '%';
        
        const stepIndex = Math.floor((progress / 100) * steps.length);
        if (stepIndex < steps.length) {
            statusText.textContent = steps[stepIndex];
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            completeForecast();
        }
    }, 800);
}

// Complete forecast generation
function completeForecast() {
    const statusText = document.getElementById('forecastStatus');
    const forecastResults = document.getElementById('forecastResults');
    
    statusText.textContent = 'Forecast completed successfully!';
    
    // Generate mock forecast data
    forecastData = generateMockForecastData();
    
    // Update modal results
    document.getElementById('modalNextMonth').textContent = forecastData.nextMonth + ' orders';
    document.getElementById('modalPeakSeason').textContent = forecastData.peakSeason;
    document.getElementById('modalGrowthRate').textContent = forecastData.growthRate + '%';
    
    // Show results
    setTimeout(() => {
        forecastResults.style.display = 'block';
    }, 1000);
    
    isForecastRunning = false;
}

// Generate mock forecast data
function generateMockForecastData() {
    const baseOrders = Math.floor(Math.random() * 50) + 30; // 30-80 orders
    const growthRate = Math.floor(Math.random() * 20) + 5; // 5-25% growth
    const nextMonth = Math.floor(baseOrders * (1 + growthRate / 100));
    
    const seasons = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
    const peakSeason = seasons[Math.floor(Math.random() * seasons.length)];
    
    return {
        nextMonth: nextMonth,
        peakSeason: peakSeason,
        growthRate: growthRate
    };
}

// Show forecast modal
function showForecastModal() {
    const modal = document.getElementById('forecastModal');
    const forecastResults = document.getElementById('forecastResults');
    const progressBar = document.getElementById('forecastProgress');
    const statusText = document.getElementById('forecastStatus');
    
    // Reset modal state
    forecastResults.style.display = 'none';
    progressBar.style.width = '0%';
    statusText.textContent = 'Initializing AI analysis...';
    
    modal.style.display = 'block';
}

// Close forecast modal
function closeForecastModal() {
    const modal = document.getElementById('forecastModal');
    modal.style.display = 'none';
    
    if (forecastData) {
        // Update main page forecast values
        updateForecastDisplay();
    }
}

// Update forecast display on main page
function updateForecastDisplay() {
    if (!forecastData) return;
    
    document.getElementById('nextMonthForecast').textContent = forecastData.nextMonth + ' orders';
    document.getElementById('peakSeasonForecast').textContent = forecastData.peakSeason;
    document.getElementById('growthRateForecast').textContent = forecastData.growthRate + '%';
    
    // Add success animation
    const forecastValues = document.querySelectorAll('.forecast-value');
    forecastValues.forEach(value => {
        value.style.animation = 'forecastUpdate 0.5s ease';
        setTimeout(() => {
            value.style.animation = '';
        }, 500);
    });
}

// Apply forecast to system
function applyForecast() {
    if (!forecastData) return;
    
    // Show success message
    showNotification('Forecast applied successfully!', 'success');
    
    // Close modal
    closeForecastModal();
    
    // Here you would typically save the forecast data to the database
    // and update any relevant system configurations
    console.log('Forecast applied:', forecastData);
}

// Refresh forecast
function refreshForecast() {
    if (isForecastRunning) return;
    
    // Clear current forecast
    document.getElementById('nextMonthForecast').textContent = '--';
    document.getElementById('peakSeasonForecast').textContent = '--';
    document.getElementById('growthRateForecast').textContent = '--';
    
    forecastData = null;
    
    // Generate new forecast
    generateForecast();
}

// Export forecast data
function exportForecast() {
    if (!forecastData) {
        showNotification('No forecast data to export', 'warning');
        return;
    }
    
    // Create CSV content
    const csvContent = `Forecast Data,Value
Next Month Orders,${forecastData.nextMonth}
Peak Season,${forecastData.peakSeason}
Growth Rate,${forecastData.growthRate}%
Generated Date,${new Date().toLocaleDateString()}`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forecast_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Forecast exported successfully!', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes forecastUpdate {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.3s ease;
    }
    
    .notification-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style);

// Utility functions
function formatNumber(num) {
    return num.toLocaleString();
}

function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

// Export functions for global access
window.generateForecast = generateForecast;
window.closeForecastModal = closeForecastModal;
window.applyForecast = applyForecast;
window.refreshForecast = refreshForecast;
window.exportForecast = exportForecast;

