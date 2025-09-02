// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Fade in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

document.querySelectorAll('.about-card, .service-card').forEach(el => {
    observer.observe(el);
});

// Mobile menu toggle (if needed)
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.mainNav');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });
}