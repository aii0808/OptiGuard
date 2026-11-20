import { useEffect, useState } from 'react';
import WebGIS from '../components/WebGIS.jsx';
import { api } from '../api.js';

export default function WebGISPage() {
  const [odpList, setOdpList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function muatOdp() {
    setLoading(true);
    try {
      const data = await api('/dashboard/odp');
      setOdpList(data || []);
    } catch (err) {
      console.error('Error load ODP for WebGIS:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muatOdp();
  }, []);

  return (
    <div className="space-y-4">
      <WebGIS odpList={odpList} loading={loading} onRefresh={muatOdp} />
    </div>
  );
}
