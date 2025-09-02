// Logistics Traffic Control System - Vanilla JavaScript Version

// Data structures
class Coordinates {
    constructor(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    }
}

class WaitingArea {
    constructor(lat, lng, occupied = false) {
        this.lat = lat;
        this.lng = lng;
        this.occupied = occupied;
    }
}

class Truck {
    constructor(id, type, zone, coordinates, status, unloadTimer = 0, queuePosition = null, waitingArea = null, incomingDirection = 0, redirectTo = '') {
        this.id = id;
        this.type = type;
        this.zone = zone;
        this.coordinates = coordinates;
        this.status = status;
        this.unloadTimer = unloadTimer;
        this.queuePosition = queuePosition;
        this.waitingArea = waitingArea;
        this.incomingDirection = incomingDirection;
        this.redirectTo = redirectTo;
    }
}

class Warehouse {
    constructor(center, docksAvailable, maxDocks) {
        this.center = center;
        this.docksAvailable = docksAvailable;
        this.maxDocks = maxDocks;
    }
}

class Zones {
    constructor(warehouse, buffer, approach) {
        this.warehouse = warehouse;
        this.buffer = buffer;
        this.approach = approach;
    }
}

// Main application class
class LogisticsControlSystem {
    constructor() {
        this.warehouse = new Warehouse(
            new Coordinates(28.48, 77.02),
            1,
            1
        );

        this.zones = this.initializeZones();
        this.trucks = this.initializeTrucks();
        this.truckQueue = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        this.map = null;
        this.truckMarkers = new Map();
        this.isPaused = false;

        this.initializeMap();
        this.renderAll();
        this.startAutoUpdate();
    }

    initializeZones() {
        // Generate 10 scattered waiting areas in Buffer Zone
        const waitingAreas = [];
        const minSeparation = 0.0005; // ~50m
        
        for (let i = 0; i < 10; i++) {
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
                    waitingAreas.push(new WaitingArea(lat, lng, false));
                    placed = true;
                }
                attempts++;
            }
        }

        return new Zones(
            { radius: 0.001, capacity: 1 }, // ~100m
            { radius: 0.005, waitingAreas }, // ~500m
            { radius: 0.01 } // ~1km
        );
    }

    initializeTrucks() {
        const trucksArray = [];
        const minTruckSeparation = 0.001; // ~100m
        
        for (let i = 1; i <= 10; i++) {
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
            
            trucksArray.push(new Truck(
                i,
                'Truck',
                i === 1 ? 'Approach Zone' : 'Outside',
                new Coordinates(lat, lng),
                i === 1 ? 'Heading to Dock' : 'En Route',
                0,
                null,
                null,
                angle,
                i === 1 ? 'Warehouse Zone' : 'Checking...'
            ));
        }
        
        return trucksArray;
    }

    initializeMap() {
        // Fix for default markers in Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Initialize map
        this.map = L.map('logisticsMap').setView(
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

    manualCheck() {
        this.checkAndRedirect();
        this.renderAll();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.renderControlPanel();
    }

    resetSystem() {
        location.reload();
    }

    startAutoUpdate() {
        setInterval(() => {
            this.checkAndRedirect();
            this.renderAll();
        }, 300);
    }

    // Rendering methods
    renderStatusCards() {
        const activeTrucks = this.trucks.filter(truck => truck.status !== 'Departed');
        const trucksInBuffer = this.trucks.filter(truck => truck.zone === 'Buffer Zone' && truck.status !== 'Departed');
        const unloadingTrucks = this.trucks.filter(truck => truck.status === 'Unloading');
        const waitingTrucks = this.trucks.filter(truck => truck.status === 'Waiting');

        const statusCardsHTML = `
            <div class="status-card">
                <div class="status-card-header">
                    <div class="status-card-title">Active Trucks</div>
                    <i class="fas fa-truck status-card-icon"></i>
                </div>
                <div class="status-card-value">${activeTrucks.length}</div>
                <div class="status-card-description">Currently in system</div>
            </div>

            <div class="status-card">
                <div class="status-card-header">
                    <div class="status-card-title">Dock Status</div>
                    <i class="fas fa-building status-card-icon"></i>
                </div>
                <div class="status-card-value">${this.warehouse.docksAvailable}/${this.warehouse.maxDocks}</div>
                <div class="status-card-description">Available docks</div>
            </div>

            <div class="status-card">
                <div class="status-card-header">
                    <div class="status-card-title">Buffer Zone</div>
                    <i class="fas fa-clock status-card-icon"></i>
                </div>
                <div class="status-card-value">${trucksInBuffer.length}</div>
                <div class="status-card-description">Trucks waiting</div>
            </div>

            <div class="status-card">
                <div class="status-card-header">
                    <div class="status-card-title">Processing</div>
                    <i class="fas fa-users status-card-icon"></i>
                </div>
                <div class="status-card-value">${unloadingTrucks.length}</div>
                <div class="status-card-description">Currently unloading</div>
            </div>
        `;

        document.getElementById('statusCards').innerHTML = statusCardsHTML;
    }

    renderTruckTable() {
        const activeTrucks = this.trucks.filter(truck => truck.status !== 'Departed');

        const getStatusBadge = (status) => {
            switch (status) {
                case 'Unloading':
                    return '<span class="badge badge-success">Unloading</span>';
                case 'Waiting':
                    return '<span class="badge badge-waiting">Waiting</span>';
                case 'Heading to Dock':
                    return '<span class="badge badge-info">Heading to Dock</span>';
                case 'En Route':
                    return '<span class="badge badge-active">En Route</span>';
                case 'Departed':
                    return '<span class="badge badge-secondary">Departed</span>';
                default:
                    return `<span class="badge badge-outline">${status}</span>`;
            }
        };

        const getZoneBadge = (zone) => {
            switch (zone) {
                case 'Warehouse Zone':
                    return '<span class="badge badge-warehouse">Warehouse</span>';
                case 'Buffer Zone':
                    return '<span class="badge badge-buffer">Buffer</span>';
                case 'Approach Zone':
                    return '<span class="badge badge-approach">Approach</span>';
                default:
                    return `<span class="badge badge-outline">${zone}</span>`;
            }
        };

        const tableHTML = `
            <div class="card-header">
                <h2>Active Trucks (${activeTrucks.length})</h2>
            </div>
            <div class="card-content">
                <div class="truck-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Current Zone</th>
                                <th>Redirect To</th>
                                <th>Status</th>
                                <th style="text-align: center;">Queue #</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${activeTrucks.map(truck => `
                                <tr>
                                    <td style="font-weight: 500;">#${truck.id}</td>
                                    <td>${getZoneBadge(truck.zone)}</td>
                                    <td class="text-muted-foreground">${truck.redirectTo}</td>
                                    <td>${getStatusBadge(truck.status)}</td>
                                    <td style="text-align: center;">
                                        ${truck.queuePosition !== null ? 
                                            `<span class="badge badge-secondary">${truck.queuePosition + 1}</span>` : 
                                            '<span class="text-muted-foreground">-</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('truckTable').innerHTML = tableHTML;
    }

    renderControlPanel() {
        const controlPanelHTML = `
            <div class="card-header">
                <h2>Control Panel</h2>
            </div>
            <div class="card-content">
                <div class="control-panel">
                    <button class="control-button control-button-primary" onclick="logisticsSystem.manualCheck()">
                        <i class="fas fa-redo"></i>
                        Manual Check & Redirect
                    </button>
                    
                    <div class="control-buttons-grid">
                        <button class="control-button control-button-outline" onclick="logisticsSystem.togglePause()">
                            <i class="fas fa-${this.isPaused ? 'play' : 'pause'}"></i>
                            ${this.isPaused ? 'Resume' : 'Pause'}
                        </button>
                        
                        <button class="control-button control-button-secondary" onclick="logisticsSystem.resetSystem()">
                            Reset System
                        </button>
                    </div>
                    
                    <div class="control-info">
                        <p>• System auto-updates every 800ms</p>
                        <p>• Trucks are redirected based on dock availability</p>
                        <p>• FIFO queue system for fair processing</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('controlPanel').innerHTML = controlPanelHTML;
    }

    renderBufferZoneStatus() {
        const trucksInBuffer = this.trucks.filter(truck => 
            truck.zone === 'Buffer Zone' && truck.status !== 'Departed'
        );

        const waitingTrucks = trucksInBuffer.filter(truck => truck.status === 'Waiting');
        const enRouteTrucks = trucksInBuffer.filter(truck => truck.status === 'En Route');

        let bufferZoneHTML = `
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-map-marker-alt" style="color: var(--zone-buffer);"></i>
                    <h2>Buffer Zone Status</h2>
                </div>
            </div>
            <div class="card-content">
                <div class="buffer-zone-content">
        `;

        if (trucksInBuffer.length === 0) {
            bufferZoneHTML += `
                <div class="buffer-zone-empty">
                    <i class="fas fa-clock"></i>
                    <p>No trucks in buffer zone</p>
                    <p>All clear for incoming traffic</p>
                </div>
            `;
        } else {
            bufferZoneHTML += `
                <div class="buffer-zone-stats">
                    <span>Total in Buffer:</span>
                    <span class="badge badge-buffer">${trucksInBuffer.length}</span>
                </div>
                
                <div class="separator"></div>
            `;

            if (waitingTrucks.length > 0) {
                bufferZoneHTML += `
                    <div class="buffer-zone-section">
                        <h4>
                            <div class="status-dot" style="background: var(--truck-waiting);"></div>
                            Waiting (${waitingTrucks.length})
                        </h4>
                        <div class="buffer-zone-trucks">
                            ${waitingTrucks.map(truck => `
                                <div class="buffer-zone-truck">
                                    <span>Truck #${truck.id}</span>
                                    <span class="badge badge-secondary" style="font-size: 0.75rem;">In Queue</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            if (enRouteTrucks.length > 0) {
                bufferZoneHTML += `
                    <div class="buffer-zone-section">
                        <h4>
                            <div class="status-dot" style="background: var(--truck-active);"></div>
                            En Route (${enRouteTrucks.length})
                        </h4>
                        <div class="buffer-zone-trucks">
                            ${enRouteTrucks.map(truck => `
                                <div class="buffer-zone-truck">
                                    <span>Truck #${truck.id}</span>
                                    <span class="badge badge-active" style="font-size: 0.75rem;">Moving</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }

        bufferZoneHTML += `
                </div>
            </div>
        `;

        document.getElementById('bufferZoneStatus').innerHTML = bufferZoneHTML;
    }

    renderAll() {
        this.renderStatusCards();
        this.renderTruckTable();
        this.renderControlPanel();
        this.renderBufferZoneStatus();
        this.updateMap();
    }
}

// Initialize the system when the page loads
let logisticsSystem;
document.addEventListener('DOMContentLoaded', () => {
    logisticsSystem = new LogisticsControlSystem();
});
