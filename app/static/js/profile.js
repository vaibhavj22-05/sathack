// Profile Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the profile page
    initializeProfilePage();
    
    // Add event listeners
    addEventListeners();
});

// Initialize the profile page
function initializeProfilePage() {
    console.log('Profile page initialized');
    
    // Set up form submissions
    setupFormSubmissions();
    
    // Initialize any saved states
    initializeSavedStates();
}

// Add event listeners
function addEventListeners() {
    // Form submission events
    const forms = document.querySelectorAll('.edit-form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmission);
    });
    
    // Input validation events
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('blur', validateInput);
        input.addEventListener('input', clearValidation);
    });
    
    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', formatPhoneNumber);
    });
}

// Setup form submissions
function setupFormSubmissions() {
    // Handle form submissions with AJAX
    const forms = document.querySelectorAll('.edit-form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitForm(this);
        });
    });
}

// Initialize saved states
function initializeSavedStates() {
    // Check if any forms were in edit mode
    const editingForms = localStorage.getItem('profileEditingForms');
    if (editingForms) {
        const forms = JSON.parse(editingForms);
        forms.forEach(formType => {
            toggleEdit(formType);
        });
    }
}

// Toggle edit mode for a card
function toggleEdit(cardType) {
    const card = document.getElementById(cardType + 'Card');
    const form = document.getElementById(cardType + 'Form');
    const display = document.getElementById(cardType + 'Display');
    const editButton = card.querySelector('.card-header button');
    
    if (!card || !form || !display) {
        console.error('Card elements not found for:', cardType);
        return;
    }
    
    const isEditing = form.classList.contains('active');
    
    if (isEditing) {
        // Cancel edit mode
        cancelEdit(cardType);
    } else {
        // Enter edit mode
        form.classList.add('active');
        display.classList.add('hidden');
        card.classList.add('editing');
        editButton.innerHTML = '<span class="edit-icon">❌</span> Cancel';
        
        // Focus on first input
        const firstInput = form.querySelector('.form-control');
        if (firstInput) {
            firstInput.focus();
        }
        
        // Save editing state
        saveEditingState(cardType, true);
    }
}

// Cancel edit mode
function cancelEdit(cardType) {
    const card = document.getElementById(cardType + 'Card');
    const form = document.getElementById(cardType + 'Form');
    const display = document.getElementById(cardType + 'Display');
    const editButton = card.querySelector('.card-header button');
    
    if (!card || !form || !display) return;
    
    // Reset form to original values
    resetFormToOriginal(form);
    
    // Exit edit mode
    form.classList.remove('active');
    display.classList.remove('hidden');
    card.classList.remove('editing');
    editButton.innerHTML = '<span class="edit-icon">✏️</span> Edit';
    
    // Clear validation errors
    clearFormValidation(form);
    
    // Remove editing state
    saveEditingState(cardType, false);
}

// Submit form
function submitForm(form) {
    const formData = new FormData(form);
    const cardType = formData.get('form_type');
    
    // Validate form
    if (!validateForm(form)) {
        return;
    }
    
    // Show loading state
    showLoadingState(form, true);
    
    // Submit via AJAX
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        showLoadingState(form, false);
        
        if (data.success) {
            showMessage('Profile updated successfully!', 'success');
            updateDisplayContent(cardType, formData);
            cancelEdit(cardType);
            updateProfileStats();
        } else {
            showMessage(data.message || 'Failed to update profile', 'error');
        }
    })
    .catch(error => {
        showLoadingState(form, false);
        console.error('Error:', error);
        showMessage('An error occurred while updating profile', 'error');
    });
}

// Validate form
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('.form-control[required]');
    
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Validate individual input
function validateInput(input) {
    const value = input.value.trim();
    const type = input.type;
    const name = input.name;
    
    // Clear previous validation
    clearInputValidation(input);
    
    // Required field validation
    if (input.hasAttribute('required') && !value) {
        showInputError(input, 'This field is required');
        return false;
    }
    
    // Email validation
    if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showInputError(input, 'Please enter a valid email address');
            return false;
        }
    }
    
    // Phone validation
    if (name === 'phone' && value) {
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(value.replace(/\D/g, ''))) {
            showInputError(input, 'Please enter a valid 10-digit phone number');
            return false;
        }
    }
    
    // GST validation
    if (name === 'gst_number' && value) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(value.toUpperCase())) {
            showInputError(input, 'Please enter a valid GST number');
            return false;
        }
    }
    
    // PAN validation
    if (name === 'pan_number' && value) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(value.toUpperCase())) {
            showInputError(input, 'Please enter a valid PAN number');
            return false;
        }
    }
    
    return true;
}

// Show input error
function showInputError(input, message) {
    input.classList.add('error');
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '5px';
    
    input.parentNode.appendChild(errorDiv);
}

// Clear input validation
function clearInputValidation(input) {
    input.classList.remove('error');
    const errorMessage = input.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Clear form validation
function clearFormValidation(form) {
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => {
        clearInputValidation(input);
    });
}

// Clear validation on input
function clearValidation(event) {
    clearInputValidation(event.target);
}

// Format phone number
function formatPhoneNumber(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.substring(0, 10);
    }
    event.target.value = value;
}

// Show loading state
function showLoadingState(form, isLoading) {
    const submitButton = form.querySelector('button[type="submit"]');
    const card = form.closest('.profile-card');
    
    if (isLoading) {
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        card.classList.add('loading');
    } else {
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
        card.classList.remove('loading');
    }
}

// Update display content
function updateDisplayContent(cardType, formData) {
    const display = document.getElementById(cardType + 'Display');
    if (!display) return;
    
    // Update info items based on form data
    for (let [key, value] of formData.entries()) {
        const infoItem = display.querySelector(`[data-field="${key}"]`);
        if (infoItem) {
            const valueSpan = infoItem.querySelector('.info-value');
            if (valueSpan) {
                valueSpan.textContent = value || 'Not provided';
            }
        }
    }
}

// Update profile stats
function updateProfileStats() {
    // This function can be called to refresh profile statistics
    // For now, we'll just log that stats should be updated
    console.log('Profile stats should be updated');
}

// Show message
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    container.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Save editing state
function saveEditingState(cardType, isEditing) {
    let editingForms = JSON.parse(localStorage.getItem('profileEditingForms') || '[]');
    
    if (isEditing) {
        if (!editingForms.includes(cardType)) {
            editingForms.push(cardType);
        }
    } else {
        editingForms = editingForms.filter(form => form !== cardType);
    }
    
    localStorage.setItem('profileEditingForms', JSON.stringify(editingForms));
}

// Reset form to original values
function resetFormToOriginal(form) {
    // This function would reset the form to its original values
    // For now, we'll just clear the form
    form.reset();
}

// Profile action functions
function changeAvatar() {
    showMessage('Avatar change functionality coming soon!', 'info');
}

function changePassword() {
    showMessage('Password change functionality coming soon!', 'info');
}

function enable2FA() {
    showMessage('Two-factor authentication coming soon!', 'info');
}

function viewLoginHistory() {
    showMessage('Login history functionality coming soon!', 'info');
}

function upgradePlan() {
    showMessage('Plan upgrade functionality coming soon!', 'info');
}

function viewBilling() {
    showMessage('Billing information coming soon!', 'info');
}

function exportData() {
    showMessage('Data export functionality coming soon!', 'info');
}

function downloadInvoice() {
    showMessage('Invoice download functionality coming soon!', 'info');
}

function contactSupport() {
    showMessage('Support contact functionality coming soon!', 'info');
}

function viewPrivacyPolicy() {
    window.open('/privacy-policy', '_blank');
}

function viewTerms() {
    window.open('/terms-of-service', '_blank');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        showMessage('Account deletion functionality coming soon!', 'info');
    }
}

// Export functions for global access
window.toggleEdit = toggleEdit;
window.cancelEdit = cancelEdit;
window.changeAvatar = changeAvatar;
window.changePassword = changePassword;
window.enable2FA = enable2FA;
window.viewLoginHistory = viewLoginHistory;
window.upgradePlan = upgradePlan;
window.viewBilling = viewBilling;
window.exportData = exportData;
window.downloadInvoice = downloadInvoice;
window.contactSupport = contactSupport;
window.viewPrivacyPolicy = viewPrivacyPolicy;
window.viewTerms = viewTerms;
window.deleteAccount = deleteAccount;

// Utility functions
window.profileUtils = {
    // Format phone number for display
    formatPhoneDisplay: function(phone) {
        if (!phone) return 'Not provided';
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    },
    
    // Format date for display
    formatDate: function(date) {
        if (!date) return 'Not available';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    },
    
    // Validate email
    validateEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validate phone
    validatePhone: function(phone) {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    },
    
    // Debounce function
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

// Apply debouncing to form validation
const debouncedValidation = window.profileUtils.debounce(validateInput, 300);
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('form-control')) {
        debouncedValidation(e.target);
    }
});
