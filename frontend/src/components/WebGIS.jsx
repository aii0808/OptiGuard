import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Layers, RefreshCw, Satellite, Map as MapIcon } from 'lucide-react';
import { useTheme } from '../theme.jsx';

// Custom Glowing Pin Markers for Satellite imagery contrast
function createOdpIcon(status) {
  let color = '#10B981'; // Aman
  if (status === 'Warning') color = '#F59E0B';
  if (status === 'Critical') color = '#ED1C24';

  const html = `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.45; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background-color: ${color}; border: 3px solid #ffffff; box-shadow: 0 0 14px ${color}, 0 4px 8px rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center;">
        <div style="width: 7px; height: 7px; border-radius: 50%; background-color: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-odp-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function WebGIS({ odpList = [], loading = false, onRefresh }) {
  const { primaryColor } = useTheme();
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterArea, setFilterArea] = useState('Semua');
  const [layerType, setLayerType] = useState('google-hybrid'); // 'google-hybrid' | 'esri-hybrid' | 'street'

  // List unique areas
  const areas = useMemo(() => {
    const set = new Set();
    odpList.forEach((o) => { if (o.area) set.add(o.area); });
    return ['Semua', ...Array.from(set).sort()];
  }, [odpList]);

  // Filtered ODPs with valid coordinates
  const filtered = useMemo(() => {
    return odpList.filter((o) => {
      const validCoord = typeof o.latitude === 'number' && typeof o.longitude === 'number';
      if (!validCoord) return false;
      const matchStatus = filterStatus === 'Semua' || o.status_fisik === filterStatus;
      const matchArea = filterArea === 'Semua' || o.area === filterArea;
      return matchStatus && matchArea;
    });
  }, [odpList, filterStatus, filterArea]);

  // Default center Payakumbuh STO
  const defaultCenter = [-0.2245, 100.638];
  const center = filtered.length > 0
    ? [filtered[0].latitude, filtered[0].longitude]
    : defaultCenter;

  return (
    <div className="space-y-3.5">
      {/* Control Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/90 dark:bg-slate-900/90 p-4 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-500/10 text-[#ED1C24]">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>WebGIS Pemetaan ODP (Satelit Hybrid)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                Live Sinkron
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan {filtered.length} dari {odpList.length} titik infrastruktur ODP STO Payakumbuh
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Selector */}
          <div className="flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setLayerType('google-hybrid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                layerType === 'google-hybrid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Satellite className="w-3 h-3 text-[#ED1C24]" />
              <span>Satelit Hybrid</span>
            </button>
            <button
              type="button"
              onClick={() => setLayerType('street')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                layerType === 'street'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3 h-3 text-sky-500" />
              <span>Peta Jalan</span>
            </button>
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-700 dark:text-slate-200"
          >
            <option value="Semua">Semua Kondisi Fisik</option>
            <option value="Aman">Kondisi Aman</option>
            <option value="Warning">Kondisi Warning</option>
            <option value="Critical">Kondisi Critical</option>
          </select>

          {/* Filter Area */}
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-700 dark:text-slate-200"
          >
            {areas.map((a) => (
              <option key={a} value={a}>Wilayah: {a}</option>
            ))}
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              title="Refresh Titik ODP"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Perbarui</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Map Box */}
      <div className="relative h-[540px] w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <ChangeView center={center} />

          {/* Satellite Hybrid Layer (Real satellite + road labels) */}
          {layerType === 'google-hybrid' && (
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          )}

          {/* Clean Vector Street Map */}
          {layerType === 'street' && (
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* Marker Pins */}
          {filtered.map((o) => (
            <Marker
              key={o.id}
              position={[o.latitude, o.longitude]}
              icon={createOdpIcon(o.status_fisik)}
            >
              <Popup className="odp-popup">
                <div className="p-1 min-w-[210px] text-slate-900">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                    <span className="font-extrabold text-sm">{o.kode_odp}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        o.status_fisik === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : o.status_fisik === 'Warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {o.status_fisik || 'Aman'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 mb-2 leading-snug">{o.alamat}</p>

                  <div className="text-[11px] space-y-1 text-slate-600 mb-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div>Klaster Area: <b>{o.area || '-'}</b></div>
                    <div>
                      Kapasitas Port: <b>{o.port_terpakai ?? 0} / {o.kapasitas_port}</b>
                    </div>
                    <div>
                      Status WebGIS: <b>{o.status}</b>
                    </div>
                    {o.diblokir && (
                      <div className="text-red-600 font-bold">
                        DIBLOKIR: {o.alasan_blokir || 'Port penuh di lapangan'}
                      </div>
                    )}
                  </div>

                  <a
                    href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#ED1C24] hover:bg-red-700 text-white py-1.5 px-3 text-xs font-bold transition shadow-md"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Petunjuk Arah (Navigasi GPS)</span>
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Legend */}
        <div className="absolute bottom-4 right-4 z-[400] rounded-2xl bg-white/95 dark:bg-slate-900/95 p-3 shadow-xl backdrop-blur border border-slate-200 dark:border-slate-800 text-[11px] space-y-1.5">
          <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ED1C24]" />
            <span>Indikator Kelayakan Fisik</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-sm" />
            <span className="text-slate-600 dark:text-slate-300">Aman / Layak Operasional</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-sm" />
            <span className="text-slate-600 dark:text-slate-300">Warning (Rusak Ringan)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24] shadow-sm" />
            <span className="text-slate-600 dark:text-slate-300">Critical (Rusak Berat)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
