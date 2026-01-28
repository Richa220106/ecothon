import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from './components/Map';
import Sidebar from './components/Sidebar';
import AnalyticsPanel from './components/AnalyticsPanel';
import {
  calculateRoadPollution,
  calculateHealthExposure,
  calculateAdjustedPollution,
  calculateRiskIndex,
  VULNERABILITY_MULTIPLIERS
} from './utils/pollutionPhysics';


const App = () => {
  const [startLoc, setStartLoc] = useState('Mumbai, MH');
  const [destLoc, setDestLoc] = useState('Pune, MH');
  const [isPeak, setIsPeak] = useState(false);
  const [userType, setUserType] = useState('NORMAL');
  const [transportMode, setTransportMode] = useState('CAR');
  const [selectedRouteId, setSelectedRouteId] = useState(0);
  const [hoveredRoad, setHoveredRoad] = useState(null);

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Geocoding helper
  const geocode = async (query) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      if (!response.ok) throw new Error("Geocoding service unavailable");
      const data = await response.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch (err) {
      console.error("Geocoding failed:", err);
      throw err;
    }
  };

  const calculateRouteMetrics = (roads, uType, peak, tMode) => {
    let totalPollution = 0;
    let totalDistance = 0;
    let totalTime = 0;

    const multiplier = tMode === 'WALK' ? 1.2 : (tMode === 'BIKE' ? 1.1 : 1.0);
    const vulnMultiplier = VULNERABILITY_MULTIPLIERS[uType] || 1.0;

    roads.forEach(road => {
      const roadPollution = calculateRoadPollution(road.density, road.congestion, 1.0);
      const healthExposure = calculateHealthExposure(roadPollution, vulnMultiplier);
      const finalExposure = calculateAdjustedPollution(healthExposure, peak);

      const segmentDist = parseFloat(road.length);
      totalPollution += finalExposure * segmentDist * multiplier;
      totalDistance += segmentDist;
      totalTime += road.duration || 0;
    });

    return {
      totalPollution: parseFloat(totalPollution.toFixed(2)),
      avgPerKm: parseFloat((totalPollution / (totalDistance || 1)).toFixed(2)),
      distance: parseFloat(totalDistance.toFixed(2)),
      riskScore: calculateRiskIndex(totalPollution),
      duration: totalTime
    };

  };

  const fetchStreetRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const startCoords = await geocode(startLoc);
      const destCoords = await geocode(destLoc);

      if (!startCoords || !destCoords) {
        throw new Error(`Could not find location: ${!startCoords ? startLoc : destLoc}`);
      }

      // Map user transport mode to OSRM profiles
      const baseProfile = transportMode === 'CAR' ? 'driving' : (transportMode === 'BIKE' ? 'bicycle' : 'foot');

      // We still fetch some diversity, but prioritize the selected mode
      const fetchProfiles = [baseProfile, baseProfile, baseProfile === 'driving' ? 'bicycle' : 'foot'];

      const profilePromises = fetchProfiles.map((profile, idx) =>
        fetch(`https://router.project-osrm.org/route/v1/${profile}/${startCoords[1]},${startCoords[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson&alternatives=true&steps=true`)
          .then(res => res.json())
      );


      const profileResults = await Promise.all(profilePromises);

      let allFoundRoutes = [];
      profileResults.forEach((data, pIdx) => {
        if (data.code === 'Ok' && data.routes) {
          data.routes.forEach((route, rIdx) => {
            const roads = route.legs[0].steps.map((step, sIdx) => {
              const profile = fetchProfiles[pIdx];
              return {
                id: `seg-${pIdx}-${rIdx}-${sIdx}`,
                name: step.name || "Street",
                type: profile === 'driving' ? 'Main Road' : 'Local Way',
                // Dynamic density calculation
                density: Math.floor(Math.random() * (profile === 'driving' ? 70 : 30)) + (profile === 'driving' ? 25 : 5),
                congestion: (Math.random() * (profile === 'driving' ? 1.8 : 0.6) + 1).toFixed(1),
                weight: profile === 'driving' ? 1.0 : 0.6,
                length: (step.distance / 1000).toFixed(2),
                duration: step.duration,
                coordinates: step.geometry.coordinates.map(c => [c[1], c[0]])
              };
            });

            allFoundRoutes.push({
              profile: fetchProfiles[pIdx],
              roads,
              totalDistance: route.distance,
              totalDuration: route.duration
            });

          });
        }
      });

      if (allFoundRoutes.length === 0) throw new Error("No routes found.");

      // Backend Scoring for all candidates
      let scoredRoutes;
      try {
        const scoreResponse = await fetch('http://localhost:3001/api/score-routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ routes: allFoundRoutes, transportMode, isPeak })
        });

        if (scoreResponse.ok) {
          scoredRoutes = await scoreResponse.json();
        } else {
          throw new Error("Backend error");
        }
      } catch (backendErr) {
        console.warn("Backend scoring failed, using local fallback:", backendErr);
        scoredRoutes = allFoundRoutes.map(route => {
          const metrics = calculateRouteMetrics(route.roads, userType, isPeak, transportMode);
          return {
            ...route,
            costPollution: metrics.totalPollution,
            costTime: route.totalDuration,
            costCombined: (metrics.totalPollution * 0.6) + (route.totalDuration * 0.1)
          };
        });
      }

      // Selection logic: Pick genuinely different best candidates
      const sortedByTime = [...scoredRoutes].sort((a, b) => a.costTime - b.costTime);
      const sortedByPollution = [...scoredRoutes].sort((a, b) => a.costPollution - b.costPollution);
      const sortedByCombined = [...scoredRoutes].sort((a, b) => a.costCombined - b.costCombined);

      const fastest = sortedByTime[0];

      // Look for a CLEANEST route that is geographically different (> 100m diff or different profile)
      const cleanest = sortedByPollution.find(r =>
        (r.profile !== fastest.profile) ||
        (Math.abs(r.totalDistance - fastest.totalDistance) > 100)
      ) || sortedByPollution[1] || sortedByPollution[0];

      // Look for an AVERAGE route that is different from both if possible
      const average = sortedByCombined.find(r =>
        (r.totalDistance !== fastest.totalDistance && r.totalDistance !== cleanest.totalDistance) ||
        (r.profile !== fastest.profile && r.profile !== cleanest.profile)
      ) || sortedByCombined.find(r => r !== fastest && r !== cleanest) || sortedByCombined[1] || sortedByCombined[0];

      const strategies = [
        { label: 'Fastest', route: fastest, color: '#00ffcc' },
        { label: 'Cleanest', route: cleanest, color: '#39ff14' },
        { label: 'Average', route: average, color: '#ffb86c' }
      ];

      const finalRoutes = strategies.map((s, idx) => {
        const r = s.route;
        const baseMetrics = calculateRouteMetrics(r.roads, userType, isPeak, transportMode);
        const finalPollution = r.pollutionScore || baseMetrics.totalPollution;

        return {
          ...r,
          id: idx,
          strategy: s.label,
          color: s.color,
          metrics: {
            ...baseMetrics,
            totalPollution: finalPollution,
            riskScore: calculateRiskIndex(finalPollution)
          }
        };
      });


      setRoutes(finalRoutes);
      setSelectedRouteId(0);
    } catch (err) {
      console.error("Error fetching routes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // Perform analysis on mount and when transport mode/peak hour changes
  useEffect(() => {
    fetchStreetRoutes();
  }, [transportMode, isPeak]);

  // Sync route recalculation on preference change
  useEffect(() => {
    if (routes.length > 0) {
      const updatedRoutes = routes.map(route => {
        const baseMetrics = calculateRouteMetrics(route.roads, userType, isPeak, transportMode);
        // We assume pollutionScore (from backend) is always more accurate for the base map
        // but it might not be present if the fetch hasn't completed or failed
        const finalPollution = route.pollutionScore || baseMetrics.totalPollution;

        return {
          ...route,
          metrics: {
            ...baseMetrics,
            totalPollution: finalPollution,
            riskScore: calculateRiskIndex(finalPollution)
          }
        };
      });
      setRoutes(updatedRoutes);
    }
  }, [userType]);


  const activeRoute = routes[selectedRouteId] || { roads: [], metrics: { totalPollution: 0, avgPerKm: 0, distance: 0, riskScore: 0 } };


  const historyData = routes.map(r => ({
    name: r.strategy || `Route ${r.id + 1}`,
    value: r.metrics.totalPollution
  }));

  return (
    <div className="layout">
      {loading && <div className="loader glass-panel">Analyzing Street-Level Data...</div>}

      {error && (
        <div className="error-overlay">
          <div className="error-card glass-panel">
            <h2>⚠️ Analysis Failed</h2>
            <p>{error}</p>
            <button onClick={fetchStreetRoutes}>Try Again</button>
          </div>
        </div>
      )}

      <Sidebar
        startLoc={startLoc} setStartLoc={setStartLoc}
        destLoc={destLoc} setDestLoc={setDestLoc}
        isPeak={isPeak} setIsPeak={setIsPeak}
        userType={userType} setUserType={setUserType}
        transportMode={transportMode} setTransportMode={setTransportMode}
        selectedRouteId={selectedRouteId}
        setSelectedRouteId={setSelectedRouteId}
        onCalculate={fetchStreetRoutes}
        routes={routes}
      />

      <main className="map-container">
        <MapView
          routes={routes}
          selectedRouteId={selectedRouteId}
          setSelectedRouteId={setSelectedRouteId}
          setHoveredRoad={setHoveredRoad}
          userType={userType}
          isPeak={isPeak}
        />

        <AnimatePresence>
          {hoveredRoad && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="road-tooltip glass-panel"
            >
              <h3>DETAILS: {hoveredRoad.name}</h3>
              <div className="tooltip-grid">
                <div><span>Pollution:</span> {hoveredRoad.density} AQI</div>
                <div><span>Type:</span> {hoveredRoad.type}</div>
                <div><span>Distance:</span> {hoveredRoad.length}km</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnalyticsPanel
        metrics={activeRoute.metrics}
        historyData={historyData}
      />
    </div>
  );
};

export default App;
