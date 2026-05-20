import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { sanitizeDisplayText } from '../../utils/textSanitizer';

const COLORS = ['#4fd1c5', '#8c54bc', '#f6ad55', '#63b3ed', '#68d391', '#fc8181', '#90cdf4'];

const EconomicDashboard = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div>
        <motion.div className="intel-kpi-row" initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="intel-skeleton" style={{ height: 72 }} />
          ))}
        </motion.div>
        <motion.div className="intel-skeleton" style={{ height: 220 }} />
      </div>
    );
  }

  const sectorData = (data.enterprises_by_sector || []).slice(0, 8).map((s) => ({
    name: (() => {
      const sanitized = sanitizeDisplayText(s.sector_main);
      return sanitized?.length > 18 ? `${sanitized.slice(0, 16)}…` : sanitized;
    })(),
    value: s.count,
  }));

  const topZones = (data.top_attractive_zones || []).slice(0, 6).map((zone) => ({
    ...zone,
    display_name: sanitizeDisplayText(zone.display_name),
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="intel-kpi-row">
        <div className="intel-kpi">
          <div className="label">Entreprises</div>
          <div className="value">{data.total_enterprises?.toLocaleString()}</div>
        </div>
        <div className="intel-kpi">
          <div className="label">Actives</div>
          <div className="value">{data.active_enterprises?.toLocaleString()}</div>
        </div>
        <div className="intel-kpi">
          <div className="label">Zones économiques</div>
          <div className="value">{data.economic_cells}</div>
        </div>
        <div className="intel-kpi">
          <div className="label">Taux d&apos;activité</div>
          <div className="value">{(data.active_rate * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="intel-chart-block">
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          Distribution sectorielle
        </h4>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
              {sectorData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {data.top_attractive_zones?.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Zones les plus attractives (ML)</h4>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={topZones}>
              <XAxis dataKey="display_name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none' }} />
              <Bar dataKey="predicted_score" fill="#4fd1c5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

export default EconomicDashboard;
