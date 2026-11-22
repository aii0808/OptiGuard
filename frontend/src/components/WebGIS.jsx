import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  RefreshCw,
  Satellite,
  Map as MapIcon,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Copy,
  ExternalLink,
  Layers,
  Radio,
} from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { parseFotoBukti } from '../utils/foto.js';

/**
 * Helper to display human-readable physical inspection status without numeric codes 1, 2, 3
 */
export function formatKondisiTeks(komponen, nilai) {
  const n = Number(nilai);
  if (n === 1) return 'Tidak Rusak';
  if (n === 2) return 'Rusak Ringan';
  if (n === 3) return 'Rusak Berat';
  if (typeof nilai === 'string' && nilai) {
    const s = nilai.toLowerCase();
    if (s.includes('berat') || s.includes('parah') || s.includes('putus') || s.includes('pecah')) return 'Rusak Berat';
    if (s.includes('ringan') || s.includes('kendur') || s.includes('debu') || s.includes('miring') || s.includes('lepas') || s.includes('karat')) return 'Rusak Ringan';
    return 'Tidak Rusak';
  }
  return 'Tidak Rusak';
}

/**
 * Creates a distinct map pin marker with an isometric 3D wireframe cube inside (Gambar 2).
 * Teardrop pin with crisp 2.5px white border and 3D cube center.
 */
function createOdpMarker(odp) {
  const isBlokir = odp.diblokir;
  const status = odp.status_fisik || 'Aman';

  let pinColor = '#10B981'; // Aman (Emerald Green)
  if (status === 'Warning') pinColor = '#F59E0B'; // Amber
  if (status === 'Critical') pinColor = '#ED1C24'; // Red
  if (isBlokir) pinColor = '#9333EA'; // Purple

  const svg = `
    <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5)); cursor: pointer;">
      <!-- Pin Teardrop Shape matching Gambar 2 -->
      <path d="M18 2 C8.6 2 1 9.6 1 19 C1 29.5 18 42 18 42 C18 42 35 29.5 35 19 C35 9.6 27.4 2 18 2 Z" 
            fill="${pinColor}" 
            stroke="#FFFFFF" 
            stroke-width="2.5" 
            stroke-linejoin="round" />
      
      <!-- 3D Isometric Wireframe Box matching Gambar 2 centered at (18, 17) -->
      <polygon points="18,9 25,13 25,21 18,25 11,21 11,13" 
               fill="none" 
               stroke="#FFFFFF" 
               stroke-width="2.2" 
               stroke-linejoin="round" 
               stroke-linecap="round" />
      <line x1="18" y1="17" x2="18" y2="25" 
            stroke="#FFFFFF" 
            stroke-width="2.2" 
            stroke-linecap="round" />
      <line x1="18" y1="17" x2="25" y2="13" 
            stroke="#FFFFFF" 
            stroke-width="2.2" 
            stroke-linecap="round" />
      <line x1="18" y1="17" x2="11" y2="13" 
            stroke="#FFFFFF" 
            stroke-width="2.2" 
            stroke-linecap="round" />
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-odp-pin-marker',
    iconSize: [36, 44],
    iconAnchor: [18, 42],
    popupAnchor: [0, -38],
  });
}

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function WebGIS({ odpList = [], loading = false, onRefresh, lastSyncTime }) {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterArea, setFilterArea] = useState('Semua');
  const [layerType, setLayerType] = useState('google-hybrid'); // 'google-hybrid' | 'street'
  const [copiedId, setCopiedId] = useState(null);

  // List unique areas
  const areas = useMemo(() => {
    const set = new Set();
    odpList.forEach((o) => {
      if (o.area) set.add(o.area);
    });
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
  const center = filtered.length > 0 ? [filtered[0].latitude, filtered[0].longitude] : defaultCenter;

  function copyCoordinates(lat, lng, id) {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-3.5">
      {/* Control Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/95 dark:bg-slate-900/95 p-4 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-500/10 text-[#ED1C24]">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                WebGIS Pemetaan ODP STO Payakumbuh
              </h3>
              {user?.role === 'teknisi' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  Panduan Rute Navigasi
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Selector */}
          <div className="flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setLayerType('google-hybrid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                layerType === 'google-hybrid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Satellite className="w-3.5 h-3.5 text-[#ED1C24]" />
              <span>Satelit Hybrid</span>
            </button>
            <button
              type="button"
              onClick={() => setLayerType('street')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                layerType === 'street'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-sky-500" />
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
              <option key={a} value={a}>
                Wilayah: {a}
              </option>
            ))}
          </select>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Perbarui data ODP dari Supabase sekarang"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Perbarui</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Map Box */}
      <div className="relative h-[560px] w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
        <MapContainer center={center} zoom={14} scrollWheelZoom={true} className="h-full w-full">
          <ChangeView center={center} />

          {/* Satellite Hybrid Layer (Real satellite + road labels) */}
          {layerType === 'google-hybrid' && (
            <TileLayer
              attribution="&copy; Google Maps"
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          )}

          {/* Clean Vector Street Map */}
          {layerType === 'street' && (
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* Distinctive ODP Terminal Box Markers */}
          {filtered.map((o) => {
            const portUsed = o.port_terpakai ?? 0;
            const portCapacity = o.kapasitas_port || 8;
            const portPercent = Math.min(100, Math.round((portUsed / portCapacity) * 100));

            return (
              <Marker
                key={o.id}
                position={[o.latitude, o.longitude]}
                icon={createOdpMarker(o)}
              >
                <Popup className="odp-rich-popup" maxWidth={320}>
                  <div className="p-1 min-w-[260px] text-slate-900">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b pb-2 mb-2.5 border-slate-300 dark:border-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                          {o.kode_odp}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {o.diblokir && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-300">
                            🔒 DIBLOKIR
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            o.status_fisik === 'Critical'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : o.status_fisik === 'Warning'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {o.status_fisik || 'Aman'}
                        </span>
                      </div>
                    </div>

                    {/* Alamat & Wilayah */}
                    <div className="mb-2.5">
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                        {o.alamat}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-600">
                        Klaster: <b>{o.area || 'Tidak Terdefinisi'}</b>
                      </span>
                    </div>

                    {/* Port Capacity Progress Bar */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 mb-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-slate-100">
                        <span>Utilisasi Port Splitter</span>
                        <span>
                          {portUsed} / {portCapacity} Port ({portPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-300 dark:border-slate-600">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            portPercent >= 90
                              ? 'bg-red-500'
                              : portPercent >= 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${portPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        <span>Sisa: {Math.max(0, portCapacity - portUsed)} Port Kosong</span>
                        <span>Status: <b className="text-slate-900 dark:text-white">{o.status || 'Tersedia'}</b></span>
                      </div>
                    </div>

                    {/* Riwayat Audit Terakhir */}
                    {o.audit_terakhir ? (
                      <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 mb-3 space-y-1 text-[11px]">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>Audit Fisik Terakhir</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                            {new Date(o.audit_terakhir.waktu_audit).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-700 dark:text-slate-300">
                          <div>Tiang: <b className="text-slate-900 dark:text-white">{formatKondisiTeks('tiang', o.audit_terakhir.kondisi_tiang)}</b></div>
                          <div>Boks: <b className="text-slate-900 dark:text-white">{formatKondisiTeks('boks', o.audit_terakhir.kondisi_boks)}</b></div>
                          <div>Kabel: <b className="text-slate-900 dark:text-white">{formatKondisiTeks('kabel', o.audit_terakhir.kondisi_kabel)}</b></div>
                          <div>Port: <b className="text-slate-900 dark:text-white">{formatKondisiTeks('port', o.audit_terakhir.kondisi_port)}</b></div>
                        </div>
                        {(() => {
                          const fotoList = parseFotoBukti(o.audit_terakhir.foto_bukti);
                          if (fotoList.length === 0) return null;
                          return (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                Foto Eviden ({fotoList.length} Foto):
                              </div>
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                {fotoList.map((url, fIdx) => (
                                  <a
                                    key={fIdx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 group text-center"
                                    title={`Buka Eviden ${fIdx + 1}`}
                                  >
                                    <img
                                      src={url}
                                      alt={`Eviden ${fIdx + 1}`}
                                      className="w-11 h-11 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shadow-sm group-hover:opacity-80 transition"
                                    />
                                    <span className="block text-[8px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                                      Foto {fIdx + 1}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium italic mb-2.5">
                        Belum ada laporan audit lapangan untuk titik ini.
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyCoordinates(o.latitude, o.longitude, o.id)}
                        className="flex items-center justify-center gap-1 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-2 px-2 text-xs font-bold border border-slate-300 dark:border-slate-600 transition cursor-pointer"
                        title="Salin Koordinat Latitude & Longitude"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === o.id ? 'Tersalin! ✓' : 'Salin GPS'}</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="odp-nav-btn flex items-center justify-center gap-1 rounded-xl bg-[#ED1C24] hover:bg-red-700 !text-white py-2 px-2 text-xs font-bold transition shadow-sm cursor-pointer"
                        style={{ color: '#ffffff' }}
                      >
                        <Navigation className="w-3.5 h-3.5 !text-white" style={{ color: '#ffffff' }} />
                        <span className="!text-white" style={{ color: '#ffffff' }}>Rute Navigasi</span>
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Shape Legend */}
        <div className="absolute bottom-4 right-4 z-[400] rounded-2xl bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-xl backdrop-blur border border-slate-300 dark:border-slate-800 text-[11px] space-y-2 max-w-[220px]">
          <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b pb-1 border-slate-200 dark:border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ED1C24]" />
            <span>Kondisi Boks ODP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#10B981] border border-white shadow-sm flex items-center justify-center text-[8px] text-white font-black">
              ✓
            </span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">Aman / Layak</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#F59E0B] border border-white shadow-sm flex items-center justify-center text-[8px] text-white font-black">
              !
            </span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">Warning (Rusak Ringan)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#ED1C24] border border-white shadow-sm flex items-center justify-center text-[8px] text-white font-black">
              ✕
            </span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">Critical (Rusak Berat)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-md bg-[#9333EA] border border-white shadow-sm flex items-center justify-center text-[8px] text-white font-black">
              🔒
            </span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">ODP Diblokir</span>
          </div>
        </div>
      </div>
    </div>
  );
}
