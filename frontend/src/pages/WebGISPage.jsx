import { useEffect, useState, useCallback } from 'react';
import WebGIS from '../components/WebGIS.jsx';
import { api } from '../api.js';

export default function WebGISPage() {
  const [odpList, setOdpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState('');

  const muatOdp = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const data = await api('/dashboard/odp');
      setOdpList(data || []);
      const now = new Date();
      setLastSyncTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    } catch (err) {
      console.error('Error load ODP for WebGIS:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch once on load (no continuous auto-refresh polling)
    muatOdp(false);
  }, [muatOdp]);

  return (
    <div className="space-y-4">
      <WebGIS
        odpList={odpList}
        loading={loading}
        onRefresh={() => muatOdp(false)}
        lastSyncTime={lastSyncTime}
      />
    </div>
  );
}
