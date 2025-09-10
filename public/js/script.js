const socket = io();
let myId = null;
let myMarker = null;

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; Sahil Jadhav'
}).addTo(map);

const markers = {};

// Red marker icon for others
const redIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

socket.on('connect', () => {
    myId = socket.id;
    console.log('Connected with ID:', myId);

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                // Emit location to server
                socket.emit('send-location', { latitude, longitude });

                // Show own marker in blue
                if (myMarker) {
                    myMarker.setLatLng([latitude, longitude]);
                } else {
                    myMarker = L.marker([latitude, longitude]).addTo(map);
                    myMarker.bindPopup('You').openPopup();
                }

                map.setView([latitude, longitude], 10);
            },
            (err) => console.log(err),
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    }
});

socket.on('location-received', (data) => {
    const { id, latitude, longitude } = data;

    if (id === myId) return;  // Prevent showing your own marker again

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude], { icon: redIcon }).addTo(map);
        markers[id].bindPopup(`User: ${id}`).openPopup();
    }
});

socket.on('user-disconnected', (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
