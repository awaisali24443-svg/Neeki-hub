// =========================================
// SPIRITUAL UI ENHANCEMENTS
// Animations and Visual Effects
// =========================================

class SpiritualUI {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupScrollAnimations();
        this.setupParallax();
        this.setupHoverEffects();
        this.setupThemeToggle();
    }
    
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe all spiritual cards
        document.querySelectorAll('.spiritual-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });
    }
    
    setupParallax() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const crescent = document.querySelector('.crescent-moon');
            
            if (crescent) {
                crescent.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
        });
    }
    
    setupHoverEffects() {
        // Add ripple effect to buttons
        const buttons = document.querySelectorAll('.spiritual-btn, .nav-btn, .refresh-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }
    
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        themeToggle.addEventListener('click', () => {
            themeToggle.classList.toggle('active');
            
            // Future: implement light theme
            // For now, just toggle the button state
            const isActive = themeToggle.classList.contains('active');
            
            if (isActive) {
                // Dark theme (current)
                document.documentElement.style.setProperty('--gold', '#d4af37');
            } else {
                // Could switch to lighter gold
                document.documentElement.style.setProperty('--gold', '#f4d03f');
            }
        });
    }
}

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    new SpiritualUI();
});