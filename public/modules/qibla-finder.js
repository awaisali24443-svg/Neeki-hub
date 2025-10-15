// =========================================
// QIBLA FINDER - SPIRITUAL EDITION
// =========================================

class QiblaFinder {
    constructor() {
        this.userLocation = null;
        this.qiblaDirection = null;
    }
    
    async findQibla() {
        if (!navigator.geolocation) {
            app?.showToast('Geolocation not supported', 'error');
            return;
        }
        
        app?.showToast('Getting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            (position) => this.onLocationSuccess(position),
            (error) => this.onLocationError(error),
            { enableHighAccuracy: true }
        );
    }
    
    async onLocationSuccess(position) {
        const { latitude, longitude } = position.coords;
        this.userLocation = { latitude, longitude };
        
        try {
            const response = await fetch('/api/qibla', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.displayQibla(data.data);
            }
        } catch (error) {
            console.error('Qibla calculation error:', error);
            app?.showToast('Error calculating Qibla', 'error');
        }
    }
    
    onLocationError(error) {
        console.error('Location error:', error);
        app?.showToast('Please enable location access', 'error');
    }
    
    displayQibla(data) {
        const { qiblaDirection, distanceToKaaba } = data;
        
        // Rotate compass
        const compass = document.getElementById('compassCircle');
        if (compass) {
            compass.style.transform = `rotate(${qiblaDirection}deg)`;
        }
        
        // Update direction
        const directionEl = document.getElementById('qiblaDirection');
        if (directionEl) {
            directionEl.textContent = `${qiblaDirection}°`;
        }
        
        // Update distance
        const distanceEl = document.getElementById('qiblaDistance');
        if (distanceEl) {
            distanceEl.textContent = `${distanceToKaaba.toLocaleString()} km`;
        }
        
        app?.showToast('Qibla direction found!', 'success');
        
        // Save for later
        localStorage.setItem('neekihub_qibla', JSON.stringify(data));
    }
}

window.qiblaFinder = new QiblaFinder();