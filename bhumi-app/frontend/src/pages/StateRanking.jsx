import React, { useEffect, useState } from 'react';
import api from '../api/client';
import FeatureLayer from '../components/FeatureLayer.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function StateRanking() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => { api.get('/dashboard/state-ranking').then((r) => setRanking(r.data)); }, []);

  return (
    <FeatureLayer id="ranking" title="State Ranking" subtitle="Ranked by speed, transparency, and satisfaction — encouraging healthy competition.">
      <div className="space-y-3">
        {ranking.map((r) => (
          <div key={r.state} className="card flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl w-10 text-center">{MEDALS[r.rank - 1] || `#${r.rank}`}</span>
              <div>
                <div className="font-semibold">{r.state}</div>
                <div className="text-xs text-gray-500">
                  Speed: {r.speed_score} · Transparency: {r.transparency_score} · Satisfaction: {r.satisfaction_score}
                </div>
              </div>
            </div>
            <div className="text-xl font-bold text-brand-700">{r.total_score}</div>
          </div>
        ))}
        {ranking.length === 0 && <p className="text-gray-400">No data yet.</p>}
      </div>
    </FeatureLayer>
  );
}
