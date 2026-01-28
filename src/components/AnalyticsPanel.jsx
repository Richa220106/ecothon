import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Activity, ShieldAlert, Zap, Thermometer } from 'lucide-react';

const AnalyticsPanel = ({ metrics, historyData }) => {
  return (
    <div className="analytics-panel glass-panel">
      <div className="panel-section">
        <h3>Live Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon"><Zap size={16} /></div>
            <div className="metric-info">
              <span>Total Exposure</span>
              <p className="pollution-high">{metrics.totalPollution} <sub>pts</sub></p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><Activity size={16} /></div>
            <div className="metric-info">
              <span>Avg/KM</span>
              <p>{metrics.avgPerKm}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><ShieldAlert size={16} /></div>
            <div className="metric-info">
              <span>Risk Index</span>
              <p className={metrics.riskScore > 5 ? 'pollution-high' : 'pollution-low'}>
                {metrics.riskScore}/10
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className="panel-section">
        <h3>Exposure Comparison</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={historyData}>
              <XAxis dataKey="name" stroke="#8b949e" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                itemStyle={{ color: '#00d2ff' }}
              />
              <Bar dataKey="value" fill="url(#colorPollution)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorPollution" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00d2ff" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel-section">
        <h3>Health Impact simulation</h3>
        <div className="impact-indicator">
          <div className="impact-bar">
            <div className="impact-fill" style={{ width: `${Math.min(metrics.riskScore * 10, 100)}%` }}></div>
          </div>
          <p>Potential respiratory strain: {metrics.riskScore > 7 ? 'High' : (metrics.riskScore > 4 ? 'Moderate' : 'Low')}</p>

        </div>
      </div>

    </div>
  );
};

export default AnalyticsPanel;
