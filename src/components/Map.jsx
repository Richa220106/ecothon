import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getPollutionColor, calculateRoadPollution } from '../utils/pollutionPhysics';

// Component to handle map view updates and auto-fitting bounds
function MapController({ routes, selectedRouteId }) {
  const map = useMap();

  useEffect(() => {
    const activeRoute = routes[selectedRouteId];
    if (activeRoute && activeRoute.roads.length > 0) {
      // Collect all coordinates to find the bounding box
      const allCoords = activeRoute.roads.flatMap(road => road.coordinates);
      if (allCoords.length > 0) {
        map.fitBounds(allCoords, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [routes, selectedRouteId, map]);

  return null;
}

const MapView = ({ routes, selectedRouteId, setSelectedRouteId, setHoveredRoad, userType, isPeak }) => {
  const defaultCenter = [19.0760, 72.8777]; // Mumbai

  return (
    <div className="map-wrapper">
      <div className="map-overlay">
        <div className="legend glass-panel">
          <div className="legend-item"><span style={{ background: '#39ff14' }}></span> Low</div>
          <div className="legend-item"><span style={{ background: '#ffb86c' }}></span> Med</div>
          <div className="legend-item"><span style={{ background: '#ff4b4b' }}></span> High</div>
          <div className="legend-item"><span style={{ background: '#bd93f9' }}></span> Zone</div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={false}
        scrollWheelZoom={true}
        maxZoom={20} // Street-level zoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <MapController routes={routes} selectedRouteId={selectedRouteId} />

        {routes.map((route, rIdx) => {
          const isActive = selectedRouteId === rIdx;
          return (
            <React.Fragment key={`route-${rIdx}`}>
              {route.roads.map((road, sIdx) => {
                const pollution = calculateRoadPollution(road.density, road.congestion, road.weight);
                const color = getPollutionColor(pollution);

                return (
                  <Polyline
                    key={road.id}

                    positions={road.coordinates}
                    pathOptions={{
                      color: isActive ? route.color : color,
                      weight: isActive ? 7 : 3,
                      opacity: isActive ? 1 : 0.3,
                      lineCap: 'round',
                      lineJoin: 'round',
                      dashArray: isActive ? '' : '5, 10' // Dash non-active routes
                    }}
                    eventHandlers={{
                      mouseover: (e) => {
                        if (isActive) {
                          setHoveredRoad(road);
                          e.target.setStyle({ weight: 8, color: '#00ffcc' });
                        }
                      },
                      mouseout: (e) => {
                        if (isActive) {
                          setHoveredRoad(null);
                          e.target.setStyle({ weight: 6, color: color });
                        }
                      },
                      click: () => setSelectedRouteId(rIdx)
                    }}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Start and End Markers for Active Route */}
        {routes[selectedRouteId]?.roads.length > 0 && (
          <>
            <CircleMarker
              center={routes[selectedRouteId].roads[0].coordinates[0]}
              radius={8}
              pathOptions={{ fillColor: '#39ff14', color: 'white', fillOpacity: 1, weight: 2 }}
            >
              <Popup>STREET LEVEL START</Popup>
            </CircleMarker>

            <CircleMarker
              center={routes[selectedRouteId].roads[routes[selectedRouteId].roads.length - 1].coordinates.slice(-1)[0]}
              radius={8}
              pathOptions={{ fillColor: '#ff4b4b', color: 'white', fillOpacity: 1, weight: 2 }}
            >
              <Popup>STREET LEVEL DESTINATION</Popup>
            </CircleMarker>
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
