import React from 'react';
import { Search, Clock, Users, Bike, Car, Footprints, Info, Zap, Leaf, Route } from 'lucide-react';

const Sidebar = ({
  startLoc, setStartLoc,
  destLoc, setDestLoc,
  isPeak, setIsPeak,
  userType, setUserType,
  transportMode, setTransportMode,
  selectedRouteId, setSelectedRouteId,
  onCalculate,
  routes
}) => {
  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <h1>Invisible Smog</h1>
        <p>Clean Route Planner</p>
      </div>

      <div className="input-group">
        <label><Search size={14} /> Journey</label>
        <div className="location-inputs">
          <input
            type="text"
            value={startLoc}
            onChange={(e) => setStartLoc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCalculate()}
            placeholder="Start location..."
          />
          <div className="connector"></div>
          <input
            type="text"
            value={destLoc}
            onChange={(e) => setDestLoc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onCalculate()}
            placeholder="Destination..."
          />
          <button className="calculate-btn" onClick={onCalculate}>
            Analyze Exposure
          </button>
        </div>
      </div>

      <div className="input-group">
        <label><Route size={14} /> Route Strategy</label>
        <div className="route-options">
          {[
            { id: 0, label: 'Fastest', icon: <Zap size={14} />, color: '#00ffcc' },
            { id: 1, label: 'Cleanest', icon: <Leaf size={14} />, color: '#39ff14' },
            { id: 2, label: 'Average', icon: <Route size={14} />, color: '#ffb86c' }
          ].map(opt => {
            const rData = routes && routes[opt.id];
            return (
              <button
                key={opt.id}
                className={`route-opt-btn ${selectedRouteId === opt.id ? 'active' : ''}`}
                onClick={() => setSelectedRouteId(opt.id)}
                style={{ '--route-color': opt.color }}
              >
                {opt.icon}
                <span>{opt.label}</span>
                {rData && (
                  <span className="route-mini-stats" style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: '2px' }}>
                    {(rData.totalDistance / 1000).toFixed(1)}km | {Math.round(rData.totalDuration / 60)}m
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="input-group">
        <label><Clock size={14} /> Time of Travel</label>
        <div className="toggle-group">
          <button
            className={!isPeak ? 'active' : ''}
            onClick={() => setIsPeak(false)}
          >
            Off-Peak
          </button>
          <button
            className={isPeak ? 'active' : ''}
            onClick={() => setIsPeak(true)}
          >
            Peak Hour
          </button>
        </div>
      </div>

      <div className="input-group">
        <label><Users size={14} /> Vulnerability Profile</label>
        <select value={userType} onChange={(e) => setUserType(e.target.value)}>
          <option value="NORMAL">Normal Adult</option>
          <option value="CHILD">Child (+50% Risk)</option>
          <option value="ELDERLY">Elderly (+60% Risk)</option>
          <option value="ASTHMATIC">Asthmatic (+80% Risk)</option>
        </select>
      </div>

      <div className="input-group">
        <label><Footprints size={14} /> Transport Mode</label>
        <div className="mode-grid">
          {[
            { id: 'CAR', icon: <Car size={18} /> },
            { id: 'BIKE', icon: <Bike size={18} /> },
            { id: 'WALK', icon: <Footprints size={18} /> }
          ].map(mode => (
            <button
              key={mode.id}
              className={`mode-btn ${transportMode === mode.id ? 'active' : ''}`}
              onClick={() => setTransportMode(mode.id)}
            >
              {mode.icon}
              <span>{mode.id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <Info size={14} />
        <p>Real-time street-level data for {new Date().toLocaleTimeString()}</p>
      </div>

    </div>
  );
};

export default Sidebar;
