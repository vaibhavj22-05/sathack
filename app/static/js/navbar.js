// Navbar behavior shared across pages

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const profileContainer = document.querySelector('.profile-dropdown');
    const profileBtn = document.querySelector('.profile-btn');
    if (!dropdown || !profileContainer || !profileBtn) return;
    const isActive = dropdown.classList.contains('active');
    dropdown.classList.toggle('active');
    profileContainer.classList.toggle('active');
    profileBtn.setAttribute('aria-expanded', (!isActive).toString());
}

function closeProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const profileContainer = document.querySelector('.profile-dropdown');
    const profileBtn = document.querySelector('.profile-btn');
    if (!dropdown || !profileContainer || !profileBtn) return;
    dropdown.classList.remove('active');
    profileContainer.classList.remove('active');
    profileBtn.setAttribute('aria-expanded', 'false');
}

function showProfile() {
    closeProfileDropdown();
    window.location.href = '/msme/profile';
}

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    if (!mobileNav || !mobileOverlay) return;
    mobileNav.classList.toggle('active');
    mobileOverlay.classList.toggle('active');
    document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : 'auto';
}

function closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileOverlay');
    if (!mobileNav || !mobileOverlay) return;
    mobileNav.classList.remove('active');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function setMobileActive(element) {
    document.querySelectorAll('.mobile-nav-link').forEach(link => link.classList.remove('active'));
    element.classList.add('active');
    const text = element.textContent;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.textContent === text) {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
    closeMobileMenu();
}

function setActive(element) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    element.classList.add('active');
    const text = element.textContent;
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        if (link.textContent === text) {
            document.querySelectorAll('.mobile-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
}

// Outside click handlers
document.addEventListener('click', function(e) {
    const profileDropdown = document.getElementById('profileDropdown');
    const profileBtn = document.querySelector('.profile-btn');
    if (profileDropdown && profileDropdown.classList.contains('active')) {
        if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
            closeProfileDropdown();
        }
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMobileMenu();
        closeProfileDropdown();
    }
});

// Export to window for inline handlers in templates
window.toggleProfileDropdown = toggleProfileDropdown;
window.closeProfileDropdown = closeProfileDropdown;
window.showProfile = showProfile;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.setMobileActive = setMobileActive;
window.setActive = setActive;

// Highlight the current page link in the navbar
function setActiveFromLocation() {
    const rawPath = window.location.pathname.replace(/\/$/, '');
    const PATH_OVERRIDES = {
        '/msme/add_order': '/msme/orders'
    };
    const overridePath = window.NAV_ACTIVE_PATH || PATH_OVERRIDES[rawPath] || null;
    const currentPath = (overridePath || rawPath);

    const allLinks = Array.from(document.querySelectorAll('.nav-link, .mobile-nav-link'))
        .filter(link => link.getAttribute('href') && link.getAttribute('href') !== '#');

    // Build unique link paths
    const pathSet = new Set();
    const linkMeta = allLinks.map(link => {
        const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/$/, '');
        pathSet.add(linkPath);
        return { link, linkPath };
    });

    // Determine best matching path by score, then by longest path length
    let bestPath = null;
    let bestScore = -1;
    let bestLen = -1;
    pathSet.forEach(linkPath => {
        let score = 0;
        if (currentPath === linkPath) {
            score = 2; // exact match preferred
        } else if (linkPath.length > 1 && currentPath.startsWith(linkPath + '/')) {
            score = 1; // section match, ensure it's a proper segment
        } else if (linkPath === '' && currentPath === '') {
            score = 2;
        }

        const len = linkPath.length;
        if (score > bestScore || (score === bestScore && len > bestLen)) {
            bestScore = score;
            bestLen = len;
            bestPath = linkPath;
        }
    });

    // Apply active class only to bestPath links
    linkMeta.forEach(({ link, linkPath }) => {
        if (bestScore <= 0) {
            link.classList.remove('active');
            return;
        }
        if (linkPath === bestPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', setActiveFromLocation);


