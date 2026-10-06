import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';

interface HealthData {
  status: string;
  app: string;
  version: string;
  environment: string;
  debug: boolean;
}

export const HealthIndicator: React.FC = () => {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/health');
      if (!res.ok) throw new Error('API returned non-200');
      const json: HealthData = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
        <Activity className="w-3.5 h-3.5 animate-spin text-primary" />
        <span>Connecting API...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400 cursor-pointer hover:bg-red-500/20 transition-colors"
        title="Backend API unreachable at /api/v1/health. Click to retry."
        onClick={fetchHealth}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
        <span>API Offline</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium cursor-default"
      title={`${data.app} v${data.version} (${data.environment})`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="hidden sm:inline">Backend v{data.version}</span>
      <span className="sm:hidden">v{data.version}</span>
    </div>
  );
};
