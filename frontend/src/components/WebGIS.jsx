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

/**
 * Creates a telecom FTTH Optical Distribution Point (ODP) terminal box marker.
 * Replaces generic green circle dots with a crisp, realistic ODP distribution box.
 */
function createOdpMarker(odp) {
  const isBlokir = odp.diblokir;
  const status = odp.status_fisik || 'Aman';

  let theme = {
    bg: '#10B981', // Aman (Emerald)
    border: '#059669',
    glow: 'rgba(16, 185, 129, 0.45)',
    label: 'AMAN',
    badgeClass: 'bg-emerald-500',
  };

  if (status === 'Warning') {
    theme = {
      bg: '#F59E0B', // Warning (Amber)
      border: '#D97706',
      glow: 'rgba(245, 158, 11, 0.45)',
      label: 'WARN',
      badgeClass: 'bg-amber-500',
    };
  } else if (status === 'Critical') {
    theme = {
      bg: '#ED1C24', // Critical (Crimson Red)
      border: '#B91C1C',
      glow: 'rgba(237, 28, 36, 0.45)',
      label: 'CRIT',
      badgeClass: 'bg-red-600',
    };
  }

  if (isBlokir) {
    theme = {
      bg: '#9333EA', // Diblokir (Purple)
      border: '#7E22CE',
      glow: 'rgba(147, 51, 234, 0.45)',
      label: 'LOCK',
      badgeClass: 'bg-purple-600',
    };
  }

  // Extract short number/code for high readability (e.g., "ODP-PYK-FA/006" -> "FA-06")
  let displayCode = odp.kode_odp || 'ODP';
  if (displayCode.includes('/')) {
    const parts = displayCode.split('/');
    const lastPart = parts[parts.length - 1];
    displayCode = lastPart.replace(/^0+/, '') || lastPart; // e.g. "6" or "006"
  } else if (displayCode.includes('-')) {
    const parts = displayCode.split('-');
    displayCode = parts[parts.length - 1];
  }

  const html = `
    <div style="position: relative; width: 44px; height: 50px; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.65));">
      <!-- Radar pulse ring -->
      <div style="position: absolute; top: 2px; width: 40px; height: 34px; border-radius: 8px; background-color: ${theme.bg}; opacity: 0.35; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>

      <!-- ODP Terminal Enclosure Box Body -->
      <div style="position: relative; width: 42px; height: 36px; background: linear-gradient(145deg, #182235, #0B111E); border: 2.5px solid ${theme.bg}; border-radius: 8px; box-shadow: 0 0 12px ${theme.glow}; display: flex; flex-direction: column; overflow: hidden; z-index: 2;">
        
        <!-- Top Status Latch with ODP Tag -->
        <div style="background-color: ${theme.bg}; height: 13px; display: flex; align-items: center; justify-content: space-between; padding: 0 4px;">
          <span style="font-size: 8px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px;">ODP</span>
          <span style="font-size: 7.5px; font-weight: 900; color: #ffffff;">${theme.label}</span>
        </div>

        <!-- Inner Chamber showing ODP Number -->
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; background: #0A0F1D; padding: 1px 2px;">
          <span style="font-size: 13px; font-weight: 900; color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: -0.5px;">
            ${displayCode}
          </span>
        </div>
      </div>

      <!-- Pointer Arrow / Pole Mount Point -->
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${theme.bg}; margin-top: -1px; z-index: 1;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-odp-marker-pin',
    iconSize: [44, 50],
    iconAnchor: [22, 46],
    popupAnchor: [0, -42],
  });
}

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export default function WebGIS({ odpList = [], loading = false, onRefresh, lastSyncTime }) {
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
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>Real-Time Supabase</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Menampilkan {filtered.length} dari {odpList.length} titik boks ODP aktif
              {lastSyncTime && (
                <span className="ml-1 text-slate-400 dark:text-slate-500">
                  · Sinkron: {lastSyncTime}
                </span>
              )}
            </p>
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
                    <div className="flex items-center justify-between border-b pb-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm tracking-tight text-slate-900">
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
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
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
                    </div>

                    {/* Alamat & Wilayah */}
                    <div className="mb-2.5">
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {o.alamat}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Klaster: <b>{o.area || 'Tidak Terdefinisi'}</b>
                      </span>
                    </div>

                    {/* Port Capacity Progress Bar */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>Utilisasi Port Splitter</span>
                        <span>
                          {portUsed} / {portCapacity} Port ({portPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
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
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Sisa: {Math.max(0, portCapacity - portUsed)} Port Kosong</span>
                        <span>Status: <b>{o.status || 'Tersedia'}</b></span>
                      </div>
                    </div>

                    {/* Riwayat Audit Terakhir */}
                    {o.audit_terakhir ? (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3 space-y-1 text-[11px]">
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span>Audit Fisik Terakhir</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {new Date(o.audit_terakhir.waktu_audit).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600">
                          <div>Tiang: <b>{o.audit_terakhir.kondisi_tiang}</b></div>
                          <div>Boks: <b>{o.audit_terakhir.kondisi_boks}</b></div>
                          <div>Kabel: <b>{o.audit_terakhir.kondisi_kabel}</b></div>
                          <div>Port: <b>{o.audit_terakhir.kondisi_port}</b></div>
                        </div>
                        {o.audit_terakhir.foto_bukti && (
                          <div className="pt-1">
                            <a
                              href={o.audit_terakhir.foto_bukti}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Lihat Foto Eviden Lapangan</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic mb-2.5">
                        Belum ada laporan audit lapangan untuk titik ini.
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => copyCoordinates(o.latitude, o.longitude, o.id)}
                        className="flex items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-2 text-xs font-bold transition cursor-pointer"
                        title="Salin Koordinat Latitude & Longitude"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === o.id ? 'Tersalin! ✓' : 'Salin GPS'}</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1 rounded-xl bg-[#ED1C24] hover:bg-red-700 text-white py-2 px-2 text-xs font-bold transition shadow-sm cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Rute Navigasi</span>
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Shape Legend */}
        <div className="absolute bottom-4 right-4 z-[400] rounded-2xl bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-xl backdrop-blur border border-slate-200 dark:border-slate-800 text-[11px] space-y-2 max-w-[210px]">
          <div className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b pb-1 border-slate-200 dark:border-slate-800">
            <span className="w-2 h-2 rounded-full bg-[#ED1C24]" />
            <span>Bentuk Boks ODP & Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#10B981] border border-white shadow-sm flex items-center justify-center text-[7px] text-white font-black">
              ✓
            </span>
            <span className="text-slate-600 dark:text-slate-300">Aman / Layak</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#F59E0B] border border-white shadow-sm flex items-center justify-center text-[7px] text-white font-black">
              !
            </span>
            <span className="text-slate-600 dark:text-slate-300">Warning (Rusak Ringan)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#ED1C24] border border-white shadow-sm flex items-center justify-center text-[7px] text-white font-black">
              ✕
            </span>
            <span className="text-slate-600 dark:text-slate-300">Critical (Rusak Berat)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-md bg-[#9333EA] border border-white shadow-sm flex items-center justify-center text-[7px] text-white font-black">
              🔒
            </span>
            <span className="text-slate-600 dark:text-slate-300">ODP Diblokir Pimpinan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
