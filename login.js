const form = document.getElementById('loginForm');
const designationInput = document.getElementById('designation');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('rememberMe');
const statusBar = document.getElementById('statusBar');

// form validation and submission
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // clear previous errors
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
    });
    document.querySelectorAll('.form-input').forEach(el => {
        el.classList.remove('error', 'success');
    });

    let isValid = true;

    // validate designation
    if (!designationInput.value.trim()) {
        showError('designationError', 'Designation required for assimilation');
        designationInput.classList.add('error');
        isValid = false;
    } else if (designationInput.value.trim().length < 3) {
        showError('designationError', 'Designation must be at least 3 characters');
        designationInput.classList.add('error');
        isValid = false;
    } else {
        designationInput.classList.add('success');
    }

    // validate password
    if (!passwordInput.value) {
        showError('passwordError', 'Encryption code required');
        passwordInput.classList.add('error');
        isValid = false;
    } else if (passwordInput.value.length < 6) {
        showError('passwordError', 'Code must be at least 6 characters');
        passwordInput.classList.add('error');
        isValid = false;
    } else {
        passwordInput.classList.add('success');
    }

    if (isValid) {
        // success state
        statusBar.textContent = 'ASSIMILATION INITIATED...';
        form.style.opacity = '0.7';
        
        // simulate processing
        setTimeout(() => {
            statusBar.textContent = '✓ ASSIMILATION COMPLETE';
            
            // log the form data (to demo)
            console.log('Login Data:', {
                designation: designationInput.value,
                remembered: rememberCheckbox.checked,
                timestamp: new Date().toISOString()
            });

            // display success message
            alert('Welcome, Drone ' + designationInput.value + '\nYou have been successfully assimilated into the collective.');
            
            // reset form
            form.reset();
            form.style.opacity = '1';
            statusBar.textContent = 'SYS.READY';
            document.querySelectorAll('.form-input').forEach(el => {
                el.classList.remove('success');
            });
        }, 1500);
    }
});

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

// real-time validation feedback
designationInput.addEventListener('input', function() {
    const errorEl = document.getElementById('designationError');
    if (this.classList.contains('error') && this.value.trim().length >= 3) {
        this.classList.remove('error');
        errorEl.classList.remove('show');
    }
});

passwordInput.addEventListener('input', function() {
    const errorEl = document.getElementById('passwordError');
    if (this.classList.contains('error') && this.value.length >= 6) {
        this.classList.remove('error');
        errorEl.classList.remove('show');
    }
});

// remember me functionality (local storage for persistence)
rememberCheckbox.addEventListener('change', function() {
    if (this.checked && designationInput.value) {
        localStorage.setItem('borgDesignation', designationInput.value);
    } else {
        localStorage.removeItem('borgDesignation');
    }
});

// load remembered designation on page load
window.addEventListener('load', function() {
    const saved = localStorage.getItem('borgDesignation');
    if (saved) {
        designationInput.value = saved;
        rememberCheckbox.checked = true;
    }
});

// keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (designationInput.value || passwordInput.value)) {
        form.dispatchEvent(new Event('submit'));
    }
});