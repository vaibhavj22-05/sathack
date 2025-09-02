// Mobile navigation functionality
function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    mobileNav.classList.toggle('active');
    mobileOverlay.classList.toggle('active');
    
    // Prevent body scrolling when menu is open
    document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : 'auto';
}

function closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    
    mobileNav.classList.remove('active');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function setMobileActive(element) {
    // Remove active class from all mobile nav links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
    
    // Also update desktop nav if visible
    const text = element.textContent;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent === text) {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
    
    closeMobileMenu();
}

// Navigation functionality
function setActive(element) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
    
    // Also update mobile nav
    const text = element.textContent;
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        if (link.textContent === text) {
            document.querySelectorAll('.mobile-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
}

// Window resize handler for responsive adjustments
window.addEventListener('resize', function() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 767) {
        closeMobileMenu();
    }
    
    // Adjust table scroll on resize
    const tableScroll = document.querySelector('.table-scroll');
    if (window.innerWidth <= 767 && tableScroll) {
        tableScroll.style.maxHeight = window.innerHeight < 600 ? '300px' : '400px';
    }
});

// Touch event handlers for better mobile interaction
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    if (!touchStartX || !touchStartY) return;

    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;

    let diffX = touchStartX - touchEndX;
    let diffY = touchStartY - touchEndY;

    // Swipe detection (only if horizontal swipe is more significant than vertical)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        const mobileNav = document.getElementById('mobileNav');
        
        if (diffX > 0 && mobileNav.classList.contains('active')) {
            // Swipe left - close menu
            closeMobileMenu();
        } else if (diffX < -100 && window.innerWidth <= 767 && touchStartX < 50) {
            // Swipe right from left edge - open menu
            toggleMobileMenu();
        }
    }

    touchStartX = 0;
    touchStartY = 0;
});
let currentStep = 1;

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.textContent = '';
    });
}

function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + '-error');
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function validateCurrentStep() {
    clearErrors();
    
    const requiredFields = {
        1: [
            { id: 'pickup-address', name: 'Pickup Address' },
            { id: 'delivery-address', name: 'Delivery Address' },
            { id: 'customer-name', name: 'Customer Name' },
            { id: 'customer-phone', name: 'Customer Phone' }
        ],
        2: [
            { id: 'package-type', name: 'Package Type' },
            { id: 'weight', name: 'Weight' },
            { id: 'priority', name: 'Priority' }
        ],
        3: [
            { id: 'driver-name', name: 'Driver Name' },
            { id: 'driver-phone', name: 'Driver Phone' },
            { id: 'logistic-company', name: 'Logistic Company' },
            { id: 'receiver-company', name: 'Receiver Company' }
        ],
        4: [
            { id: 'delivery-date', name: 'Delivery Date' },
            { id: 'time-slot', name: 'Time Slot' }
        ]
    };

    const fields = requiredFields[currentStep];
    if (!fields) return true;

    let isValid = true;
    let firstErrorField = null;

    for (const field of fields) {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            showError(field.id, `${field.name} is required`);
            if (!firstErrorField) {
                firstErrorField = element;
            }
            isValid = false;
        }
    }

    // Additional validation for specific fields
    if (currentStep === 2) {
        const weight = document.getElementById('weight').value;
        if (weight && parseFloat(weight) <= 0) {
            showError('weight', 'Weight must be greater than 0');
            isValid = false;
        }
    }

    if (currentStep === 4) {
        const deliveryDate = document.getElementById('delivery-date').value;
        if (deliveryDate) {
            const selectedDate = new Date(deliveryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                showError('delivery-date', 'Delivery date cannot be in the past');
                isValid = false;
            }
        }
    }

    if (!isValid && firstErrorField) {
        firstErrorField.focus();
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
}

function updateProgressSteps(step) {
    // Update step circles
    for (let i = 1; i <= 5; i++) {
        const circle = document.getElementById(`step${i}-circle`);
        
        if (i < step) {
            circle.className = 'step-circle completed';
            circle.innerHTML = '✓';
        } else if (i === step) {
            circle.className = 'step-circle active';
            circle.innerHTML = i;
        } else {
            circle.className = 'step-circle pending';
            circle.innerHTML = i;
        }
    }
    
    // Update connecting line
    const line = document.querySelector('.step-line');
    if (step > 1) {
        line.className = 'step-line completed';
    } else {
        line.className = 'step-line';
    }
}

function showPage(pageNum) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show current page
    const targetPage = document.getElementById(`page${pageNum}`);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Update progress steps
    updateProgressSteps(pageNum);
    
    currentStep = pageNum;
}

function nextStep(step) {
    if (!validateCurrentStep()) return;
    
    showPage(step + 1);
}

function previousStep(step) {
    showPage(step - 1);
}

function getTimeSlotText(value) {
    const timeSlots = {
        'morning': 'Morning (9 AM - 12 PM)',
        'afternoon': 'Afternoon (12 PM - 4 PM)',
        'evening': 'Evening (4 PM - 7 PM)',
        'anytime': 'Anytime'
    };
    return timeSlots[value] || value;
}

function scheduleDelivery() {
    if (!validateCurrentStep()) return;
    
    // Fill in summary details
    document.getElementById('summary-from').textContent = 
        document.getElementById('pickup-address').value || '...';
    document.getElementById('summary-to').textContent = 
        document.getElementById('delivery-address').value || '...';
    
    const deliveryDate = document.getElementById('delivery-date').value;
    if (deliveryDate) {
        const date = new Date(deliveryDate);
        document.getElementById('summary-date').textContent = 
            date.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
    }
    
    const timeSlot = document.getElementById('time-slot').value;
    document.getElementById('summary-time').textContent = 
        getTimeSlotText(timeSlot);
    
    // Generate random delivery ID
    const deliveryId = '#DEL' + Math.floor(Math.random() * 900 + 100);
    document.getElementById('delivery-id').textContent = deliveryId;
    
    // Generate random cost based on weight and priority
    const weight = parseFloat(document.getElementById('weight').value || 1);
    const priority = document.getElementById('priority').value;
    let baseCost = Math.max(200, weight * 50);
    
    if (priority === 'high') baseCost *= 1.5;
    else if (priority === 'medium') baseCost *= 1.2;
    
    document.getElementById('estimated-cost').textContent = 
        '₹' + Math.round(baseCost);
    
    showPage(5);
}

function backToDashboard() {
    alert('Redirecting to Dashboard...');
    // In a real app, this would navigate to the dashboard
}

function scheduleAnother() {
    // Reset form
    document.querySelectorAll('input, select, textarea').forEach(field => {
        field.value = '';
    });
    clearErrors();
    showPage(1);
}

// Set minimum date to today
window.addEventListener('load', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('delivery-date').min = today;
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const nextButton = document.querySelector('.page.active .btn-primary, .page.active .btn-success');
        if (nextButton && !nextButton.disabled) {
            nextButton.click();
        }
    }
});