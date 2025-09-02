// Navbar interactions now handled in navbar.js

// Navigation interactions now handled in navbar.js

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

// Touch handlers moved to navbar.js if needed

// Stats card animation
function animateCard(card) {
    card.style.transform = 'translateY(-5px) scale(0.98)';
    setTimeout(() => {
        card.style.transform = 'translateY(-5px) scale(1)';
    }, 150);
}

// Workspace dropdown functionality
function toggleWorkspace() {
    const selector = document.getElementById('workspaceSelector');
    const options = document.getElementById('workspaceOptions');
    const arrow = document.getElementById('dropdownArrow');
    
    const isActive = options.classList.contains('active');
    console.log('toggleWorkspace called, isActive:', isActive);
    
    if (isActive) {
        // Close dropdown
        console.log('Closing dropdown');
        options.classList.remove('active');
        selector.classList.remove('active');
        arrow.textContent = '▼';
    } else {
        // Open dropdown
        console.log('Opening dropdown');
        options.classList.add('active');
        selector.classList.add('active');
        arrow.textContent = '▲';
        
        // Close dropdown after 5 seconds of inactivity
        setTimeout(() => {
            if (options.classList.contains('active')) {
                console.log('Auto-closing dropdown');
                options.classList.remove('active');
                selector.classList.remove('active');
                arrow.textContent = '▼';
            }
        }, 5000);
    }
}

// Dashboard Map System - Using LTC Logic
class DashboardLogisticsSystem {
    constructor() {
        // Determine how many trucks to simulate based on active orders, capped at 10
        const maxTrucks = 10;
        const requestedTrucks = (typeof window !== 'undefined' && window.TRUCKS_TO_SHOW) ? parseInt(window.TRUCKS_TO_SHOW, 10) : 0;
        this.trucksToShow = Math.max(0, Math.min(maxTrucks, isNaN(requestedTrucks) ? 0 : requestedTrucks));

        this.warehouse = {
            center: { lat: 28.48, lng: 77.02 },
            docksAvailable: 1,
            maxDocks: 1
        };

        this.zones = this.initializeZones();
        this.trucks = this.initializeTrucks();
        this.truckQueue = Array.from({ length: this.trucksToShow }, (_, i) => i + 1);
        this.map = null;
        this.truckMarkers = new Map();
        this.isPaused = false;

        this.initializeMap();
        this.renderAll();
        this.startAutoUpdate();
    }

    initializeZones() {
        // Generate waiting areas in Buffer Zone
        const waitingAreas = [];
        const minSeparation = 0.0005; // ~50m
        
        const areasCount = Math.max(1, this.trucksToShow);
        for (let i = 0; i < areasCount; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const angle = Math.random() * 2 * Math.PI;
                const dist = 0.002 + Math.random() * 0.003; // ~200m to 500m
                const lat = this.warehouse.center.lat + dist * Math.cos(angle);
                const lng = this.warehouse.center.lng + dist * Math.sin(angle);
                
                // Check separation from existing areas
                let tooClose = false;
                for (let area of waitingAreas) {
                    const dx = area.lng - lng;
                    const dy = area.lat - lat;
                    const sep = Math.sqrt(dx * dx + dy * dy);
                    if (sep < minSeparation) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) {
                    waitingAreas.push({ lat, lng, occupied: false });
                    placed = true;
                }
                attempts++;
            }
        }

        return {
            warehouse: { radius: 0.001, capacity: 1 }, // ~100m
            buffer: { radius: 0.005, waitingAreas }, // ~500m
            approach: { radius: 0.01 } // ~1km
        };
    }

    initializeTrucks() {
        const trucksArray = [];
        const minTruckSeparation = 0.001; // ~100m
        
        for (let i = 1; i <= this.trucksToShow; i++) {
            let placed = false;
            let attempts = 0;
            let lat, lng, angle;
            
            while (!placed && attempts < 100) {
                angle = Math.random() * 2 * Math.PI;
                const dist = 0.005 + Math.random() * 0.005; // ~500m to 1km
                lat = this.warehouse.center.lat + dist * Math.cos(angle);
                lng = this.warehouse.center.lng + dist * Math.sin(angle);
                
                // Check separation from other trucks
                let tooClose = false;
                for (let j = 0; j < trucksArray.length; j++) {
                    const dx = trucksArray[j].coordinates.lng - lng;
                    const dy = trucksArray[j].coordinates.lat - lat;
                    const sep = Math.sqrt(dx * dx + dy * dy);
                    if (sep < minTruckSeparation) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) {
                    placed = true;
                }
                attempts++;
            }
            
            trucksArray.push({
                id: i,
                type: 'Truck',
                zone: i === 1 ? 'Approach Zone' : 'Outside',
                coordinates: { lat, lng },
                status: i === 1 ? 'Heading to Dock' : 'En Route',
                unloadTimer: 0,
                queuePosition: null,
                waitingArea: null,
                incomingDirection: angle,
                redirectTo: i === 1 ? 'Warehouse Zone' : 'Checking...'
            });
        }
        
        return trucksArray;
    }

    initializeMap() {
        const mapContainer = document.getElementById('dashboardMap');
        if (!mapContainer) return;

        // Fix for default markers in Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Initialize map
        this.map = L.map('dashboardMap').setView(
            [this.warehouse.center.lat, this.warehouse.center.lng], 
            15
        );

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add zone circles
        L.circle([this.warehouse.center.lat, this.warehouse.center.lng], {
            color: '#22c55e',
            fillColor: '#22c55e',
            fillOpacity: 0.2,
            radius: this.zones.warehouse.radius * 100000,
            weight: 2
        }).addTo(this.map).bindPopup('<strong>Warehouse Zone</strong><br/>Loading/Unloading Area');

        L.circle([this.warehouse.center.lat, this.warehouse.center.lng], {
            color: '#eab308',
            fillColor: '#eab308',
            fillOpacity: 0.15,
            radius: this.zones.buffer.radius * 100000,
            weight: 2
        }).addTo(this.map).bindPopup('<strong>Buffer Zone</strong><br/>Waiting Areas');

        L.circle([this.warehouse.center.lat, this.warehouse.center.lng], {
            color: '#64748b',
            fillColor: '#64748b',
            fillOpacity: 0.1,
            radius: this.zones.approach.radius * 100000,
            weight: 2
        }).addTo(this.map).bindPopup('<strong>Approach Zone</strong><br/>Entry Detection Area');

        // Add waiting areas
        this.zones.buffer.waitingAreas.forEach((area, index) => {
            const bounds = [
                [area.lat - 0.0002, area.lng - 0.0002],
                [area.lat + 0.0002, area.lng + 0.0002]
            ];
            L.rectangle(bounds, {
                color: '#f97316',
                fillColor: '#f97316',
                fillOpacity: area.occupied ? 0.6 : 0.3,
                weight: 1
            }).addTo(this.map).bindPopup(`<strong>Waiting Area ${index + 1}</strong><br/>${area.occupied ? 'Occupied' : 'Available'}`);
        });
    }

    updateMap() {
        if (!this.map) return;

        // Clear existing truck markers
        this.truckMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.truckMarkers.clear();

        // Add truck markers
        this.trucks.forEach(truck => {
            if (truck.status !== 'Departed') {
                let color = '#3b82f6'; // Default blue
                if (truck.status === 'Unloading') color = '#22c55e'; // Green
                else if (truck.status === 'Waiting') color = '#ef4444'; // Red
                else if (truck.status === 'Heading to Dock') color = '#8b5cf6'; // Purple

                const marker = L.circleMarker([truck.coordinates.lat, truck.coordinates.lng], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.8,
                    radius: 8,
                    weight: 2
                }).addTo(this.map)
                  .bindPopup(`
                    <div style="font-size: 0.875rem;">
                        <strong>Truck ${truck.id}</strong><br/>
                        Zone: ${truck.zone}<br/>
                        Status: ${truck.status}<br/>
                        Redirect: ${truck.redirectTo}
                    </div>
                  `);

                this.truckMarkers.set(truck.id, marker);
            }
        });
    }

    findNearestWaitingArea(truck) {
        const waitingAreas = this.zones.buffer.waitingAreas;
        let nearest = null;
        let minDist = Infinity;
        const truckDirection = truck.incomingDirection;
        
        waitingAreas.forEach(area => {
            if (!area.occupied) {
                const dx = area.lng - truck.coordinates.lng;
                const dy = area.lat - truck.coordinates.lat;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angleDiff = Math.abs(Math.atan2(dy, dx) - truckDirection);
                const adjustedDist = dist * (1 + angleDiff / Math.PI);
                
                if (adjustedDist < minDist) {
                    minDist = adjustedDist;
                    nearest = area;
                }
            }
        });
        
        if (nearest) {
            nearest.occupied = true;
            return nearest;
        }
        
        return null;
    }

    releaseWaitingArea(truck) {
        if (truck.waitingArea) {
            truck.waitingArea.occupied = false;
            truck.waitingArea = null;
        }
    }

    simulateMovement(truck) {
        if (truck.status === 'Waiting' || truck.status === 'Unloading') {
            if (truck.waitingArea) {
                truck.coordinates.lat = truck.waitingArea.lat;
                truck.coordinates.lng = truck.waitingArea.lng;
            }
            return;
        }
        
        let targetLat = this.warehouse.center.lat;
        let targetLng = this.warehouse.center.lng;
        
        if (truck.redirectTo === 'Waiting Area' && truck.waitingArea) {
            targetLat = truck.waitingArea.lat;
            targetLng = truck.waitingArea.lng;
        }
        
        const deltaLat = (targetLat - truck.coordinates.lat) * 0.05;
        const deltaLng = (targetLng - truck.coordinates.lng) * 0.05;
        truck.coordinates.lat += deltaLat;
        truck.coordinates.lng += deltaLng;
        
        // Check if arrived at target
        if (Math.abs(targetLat - truck.coordinates.lat) < 0.0001 && 
            Math.abs(targetLng - truck.coordinates.lng) < 0.0001) {
            if (truck.redirectTo === 'Waiting Area') {
                truck.status = 'Waiting';
            } else if (truck.redirectTo === 'Warehouse Zone') {
                truck.status = 'Unloading';
                truck.unloadTimer = 5;
            }
        }
    }

    checkAndRedirect() {
        if (this.isPaused) return;

        const activeTrucks = this.trucks.filter(truck => truck.status !== 'Departed');
        
        activeTrucks.forEach(truck => {
            // Update queue position
            truck.queuePosition = this.truckQueue.indexOf(truck.id);

            const distance = Math.sqrt(
                Math.pow(truck.coordinates.lat - this.warehouse.center.lat, 2) +
                Math.pow(truck.coordinates.lng - this.warehouse.center.lng, 2)
            );

            // Determine current zone
            let assignedZone = 'Outside';
            if (distance <= this.zones.warehouse.radius) {
                assignedZone = 'Warehouse Zone';
            } else if (distance <= this.zones.buffer.radius) {
                assignedZone = 'Buffer Zone';
            } else if (distance <= this.zones.approach.radius) {
                assignedZone = 'Approach Zone';
            }
            truck.zone = assignedZone;

            // Redirect logic
            if (truck.id !== 1 && assignedZone === 'Buffer Zone' && 
                !truck.waitingArea && truck.redirectTo !== 'Warehouse Zone') {
                const waitingArea = this.findNearestWaitingArea(truck);
                if (waitingArea) {
                    truck.waitingArea = waitingArea;
                    truck.redirectTo = 'Waiting Area';
                    truck.status = 'En Route';
                }
            }

            // Handle advancement to warehouse
            if (truck.queuePosition === 0 && this.warehouse.docksAvailable > 0 && 
                truck.status === 'Waiting') {
                this.releaseWaitingArea(truck);
                truck.redirectTo = 'Warehouse Zone';
                truck.status = 'Heading to Dock';
                this.warehouse.docksAvailable--;
            }

            // Handle arrival at warehouse
            if (assignedZone === 'Warehouse Zone' && truck.status !== 'Unloading') {
                truck.status = 'Unloading';
                truck.unloadTimer = 5;
                truck.redirectTo = 'Warehouse Zone';
                const queueIndex = this.truckQueue.indexOf(truck.id);
                if (queueIndex > -1) {
                    this.truckQueue.splice(queueIndex, 1);
                }
            }

            // Handle unloading
            if (truck.status === 'Unloading') {
                truck.unloadTimer--;
                if (truck.unloadTimer <= 0) {
                    truck.status = 'Departed';
                    this.warehouse.docksAvailable++;
                }
            }

            this.simulateMovement(truck);
        });
    }

    renderAll() {
        this.updateMap();
    }

    startAutoUpdate() {
        setInterval(() => {
            this.checkAndRedirect();
            this.renderAll();
        }, 300);
    }

    reset() {
        // Clear existing map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.truckMarkers.clear();
        
        // Reinitialize everything
        this.warehouse.docksAvailable = 1;
        this.zones = this.initializeZones();
        this.trucks = this.initializeTrucks();
        this.truckQueue = Array.from({ length: this.trucksToShow }, (_, i) => i + 1);
        
        // Reinitialize the map
        setTimeout(() => {
            this.initializeMap();
            this.renderAll();
        }, 100);
    }
}

// Global dashboard system instance
let dashboardSystem = null;

// Map functionality
function openFullMap() {
    window.open('https://www.google.com/maps/@28.7144068,77.0909803,15z?entry=ttu&g_ep=EgoyMDI1MDgxMy4wIKXMDSoASAFQAw%3D%3D', '_blank');
}

function openLTC() {
    window.location.href = '/msme/ltc';
}

function refreshMap() {
    if (dashboardSystem) {
        dashboardSystem.reset();
    }
}

function initializeDashboardMap() {
    dashboardSystem = new DashboardLogisticsSystem();
}

// Function to select warehouse
function selectWorkspace(warehouseId, warehouseName) {
    console.log('selectWorkspace called with:', warehouseId, warehouseName);
    
    // Update the display
    document.getElementById('selectedWorkspace').textContent = warehouseName;
    
    // Close the dropdown
    const options = document.getElementById('workspaceOptions');
    const selector = document.getElementById('workspaceSelector');
    const arrow = document.getElementById('dropdownArrow');
    
    options.classList.remove('active');
    selector.classList.remove('active');
    arrow.textContent = '▼';
    
    // Redirect to set the warehouse
    console.log('Redirecting to:', "/msme/set-warehouse/" + warehouseId);
    window.location.href = "/msme/set-warehouse/" + warehouseId;
}

// Function to add new delivery
function addNewDelivery() {
    window.location.href = "/msme/add_order";
}

// Function to animate card
function animateCard(card) {
    card.style.transform = 'scale(1.05)';
    setTimeout(() => {
        card.style.transform = 'scale(1)';
    }, 200);
}



// Real-time updates simulation
const deliveryIds = ['DEL-58823', 'JXK-26543', 'MNP-78912', 'QRS-45678', 'ABC-12345', 'XYZ-67890'];

setInterval(() => {
    const randomId = deliveryIds[Math.floor(Math.random() * deliveryIds.length)];
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        if (row.textContent.includes(randomId)) {
            row.classList.add('highlight');
            setTimeout(() => {
                row.classList.remove('highlight');
            }, 1000);
        }
    });
}, 7000);

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard map
    initializeDashboardMap();
    
    // Start truck movement simulation
    // setInterval(simulateDashboardTruckMovement, 300); // This line is removed as per the new_code
    
    // Close mobile menu on outside click
    document.addEventListener('click', function(e) {
        const mobileNav = document.getElementById('mobileNav');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (mobileNav && mobileNav.classList.contains('active')) {
            if (!mobileNav.contains(e.target) && e.target !== mobileMenuBtn) {
                closeMobileMenu();
            }
        }
    });
    
    // Close profile dropdown on outside click
    document.addEventListener('click', function(e) {
        const profileDropdown = document.getElementById('profileDropdown');
        const profileBtn = document.querySelector('.profile-btn');
        
        if (profileDropdown && profileDropdown.classList.contains('active')) {
            if (!profileDropdown.contains(e.target) && e.target !== profileBtn) {
                closeProfileDropdown();
            }
        }
    });
    
         // Close workspace dropdown on outside click
     document.addEventListener('click', function(e) {
         const workspaceOptions = document.getElementById('workspaceOptions');
         const workspaceSelector = document.getElementById('workspaceSelector');
         
         if (workspaceOptions && workspaceOptions.classList.contains('active')) {
             if (!workspaceOptions.contains(e.target) && !workspaceSelector.contains(e.target)) {
                 console.log('Closing workspace dropdown - clicked outside');
                 workspaceOptions.classList.remove('active');
                 workspaceSelector.classList.remove('active');
                 document.getElementById('dropdownArrow').textContent = '▼';
             }
         }
     });

    // Handle escape key for mobile menu, profile dropdown, and workspace dropdown
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
            closeProfileDropdown();
            
            // Close workspace dropdown
            const workspaceOptions = document.getElementById('workspaceOptions');
            const workspaceSelector = document.getElementById('workspaceSelector');
            if (workspaceOptions && workspaceOptions.classList.contains('active')) {
                workspaceOptions.classList.remove('active');
                workspaceSelector.classList.remove('active');
                document.getElementById('dropdownArrow').textContent = '▼';
            }
        }
    });

    // Optimize scroll performance
    let ticking = false;
    function updateScroll() {
        // Add navbar scroll effect
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'white';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateScroll);
            ticking = true;
        }
    });

    // Add loading animations
    const cards = document.querySelectorAll('.stat-card, .map-container, .upcoming-deliveries, .active-deliveries');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Enhanced table interaction for mobile
if (window.innerWidth <= 767) {
    const tableRows = document.querySelectorAll('.deliveries-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('click', function() {
            // Highlight selected row on mobile
            tableRows.forEach(r => r.style.background = '');
            this.style.background = '#f0fdfa';
        });
    });
}