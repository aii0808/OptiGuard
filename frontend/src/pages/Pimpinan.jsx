import { useEffect, useState, useCallback } from 'react'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'
import Statistik from './Statistik.jsx'

const warnaStatus = {
  Aman: 'text-[#10B981]', Normal: 'text-[#10B981]', Warning: 'text-[#F59E0B]', Critical: 'text-[#ED1C24]',
}
const warnaTiket = {
  Pending: 'bg-slate-600', 'In Progress': 'bg-[#F59E0B] text-slate-900', Selesai: 'bg-[#10B981] text-slate-900',
}

export default function Pimpinan() {
  const { user, logout } = useAuth()
  const [rekap, setRekap] = useState({ Aman: 0, Warning: 0, Critical: 0 })
  const [areas, setAreas] = useState([])
  const [teknisi, setTeknisi] = useState([])
  const [tiket, setTiket] = useState([])
  const [odpList, setOdpList] = useState([])
  const [form, setForm] = useState({ area_klaster: '', teknisi_id: '', tanggal_tugas: '' })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [dialogErr, setDialogErr] = useState('')

  const muat = useCallback(async () => {
    const [r, a, t, tk, od] = await Promise.all([
      api('/dashboard'), api('/tiket/area'), api('/tiket/teknisi'), api('/tiket'), api('/dashboard/odp'),
    ])
    setRekap(r); setAreas(a); setTeknisi(t); setTiket(tk); setOdpList(od)
  }, [])

  useEffect(() => {
    muat().catch((e) => setMsg({ ok: false, teks: e.message }))
  }, [muat])

  const namaTeknisi = (id) => teknisi.find((t) => t.id === id)?.nama_lengkap || `#${id}`

  async function buat(e) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const body = { area_klaster: form.area_klaster, teknisi_id: Number(form.teknisi_id) }
      if (form.tanggal_tugas) body.tanggal_tugas = form.tanggal_tugas
      const r = await api('/tiket', { method: 'POST', body })
      setMsg({
        ok: true,
        teks: `Tiket #${r.tiket.id} dibuat (${r.jumlah_odp} ODP). Telegram: ${
          r.telegram_terkirim ? 'terkirim' : 'tidak terkirim (teknisi belum punya chat id atau bot gagal)'
        }`,
      })
      setForm({ area_klaster: '', teknisi_id: '', tanggal_tugas: '' })
      await muat()
    } catch (err) {
      setMsg({ ok: false, teks: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function buka(id) {
    try {
      setDetail(await api(`/tiket/${id}/odp`))
    } catch (err) {
      setMsg({ ok: false, teks: err.message })
    }
  }

  function bukaDialog(jenis, o) {
    setDialog({ jenis, odp: o, alasan: '' })
    setDialogErr('')
  }

  async function kirimDialog() {
    const { jenis, odp, alasan } = dialog
    try {
      if (jenis === 'blokir') {
        await api(`/dashboard/odp/${odp.id}/blokir`, { method: 'POST', body: { alasan } })
        setMsg({ ok: true, teks: `${odp.kode_odp} diblokir. Status di WebGIS menjadi Penuh.` })
      } else {
        await api(`/dashboard/odp/${odp.id}/buka-blokir`, { method: 'POST' })
        setMsg({ ok: true, teks: `Blokir ${odp.kode_odp} dibuka.` })
      }
      setDialog(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      await muat()
    } catch (err) {
      setDialogErr(err.message)
    }
  }

  const input = 'w-full rounded-lg bg-slate-700 px-3 py-2 outline-none focus:ring-2 focus:ring-[#ED1C24]'

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#ED1C24]">OPTIGUARD · Pimpinan</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">{user.nama}</span>
          <button onClick={logout} className="rounded-lg bg-slate-700 px-3 py-1">Keluar</button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3">
        {['Aman', 'Warning', 'Critical'].map((k) => (
          <div key={k} className="rounded-xl bg-slate-800 p-4 text-center">
            <div className={`text-3xl font-bold ${warnaStatus[k]}`}>{rekap[k] ?? 0}</div>
            <div className="text-xs text-slate-400">ODP {k.toUpperCase()}</div>
          </div>
        ))}
      </section>

            <Statistik />
            
      <form onSubmit={buat} className="rounded-xl bg-slate-800 p-4 space-y-3">
        <h2 className="font-semibold text-slate-300">Dispatching Tiket Patroli</h2>
        <select required className={input} value={form.area_klaster}
          onChange={(e) => setForm({ ...form, area_klaster: e.target.value })}>
          <option value="">Pilih area klaster</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select required className={input} value={form.teknisi_id}
          onChange={(e) => setForm({ ...form, teknisi_id: e.target.value })}>
          <option value="">Pilih teknisi</option>
          {teknisi.map((t) => <option key={t.id} value={t.id}>{t.nama_lengkap}</option>)}
        </select>
        <input type="date" className={input} value={form.tanggal_tugas}
          onChange={(e) => setForm({ ...form, tanggal_tugas: e.target.value })} />
        <button disabled={loading}
          className="w-full rounded-lg bg-[#ED1C24] py-2 font-semibold disabled:opacity-60">
          {loading ? 'Memproses...' : 'Buat Tugas & Broadcast Telegram'}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? 'text-[#10B981]' : 'text-red-400'}`}>{msg.teks}</p>}
      </form>

      <section className="rounded-xl bg-slate-800 p-4 space-y-2">
        <h2 className="font-semibold text-slate-300">Daftar Tiket</h2>
        {tiket.length === 0 && <p className="text-sm text-slate-400">Belum ada tiket.</p>}
        {tiket.map((t) => (
          <button key={t.id} onClick={() => buka(t.id)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-700 px-3 py-2 text-left">
            <div>
              <div className="font-medium">#{t.id} · {t.area_klaster}</div>
              <div className="text-xs text-slate-400">
                {namaTeknisi(t.teknisi_id)} · {t.tanggal_tugas}
              </div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${warnaTiket[t.status_tiket]}`}>
              {t.status_tiket}
            </span>
          </button>
        ))}
      </section>

      <section className="rounded-xl bg-slate-800 p-4 space-y-2">
        <h2 className="font-semibold text-slate-300">Pemantauan ODP</h2>
        {odpList.map((o) => (
          <div key={o.id} className="rounded-lg bg-slate-700 p-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{o.kode_odp}</span>
              <span className={`font-semibold ${warnaStatus[o.status_fisik]}`}>{o.status_fisik}</span>
            </div>
            <div className="text-xs text-slate-400">{o.alamat}</div>
            <div className="text-xs text-slate-300">
              Area: {o.area || '-'} · Port terpakai: {o.port_terpakai ?? 0}/{o.kapasitas_port}
            </div>
            {o.audit_terakhir ? (
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div>
                    Audit terakhir: {new Date(o.audit_terakhir.waktu_audit).toLocaleDateString('id-ID')} ·{' '}
                    <b className={warnaStatus[o.audit_terakhir.status_akhir]}>{o.audit_terakhir.status_akhir}</b>
                  </div>
                  <div className="text-slate-400">
                    Tiang {o.audit_terakhir.kondisi_tiang} · Boks {o.audit_terakhir.kondisi_boks} · Kabel{' '}
                    {o.audit_terakhir.kondisi_kabel} · Port {o.audit_terakhir.kondisi_port}
                  </div>
                </div>
                {o.audit_terakhir.foto_bukti && (
                  <a href={o.audit_terakhir.foto_bukti} target="_blank" rel="noreferrer">
                    <img src={o.audit_terakhir.foto_bukti} alt="Eviden" className="h-14 w-14 rounded object-cover" />
                  </a>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400">Belum pernah diaudit</div>
            )}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-300">Status WebGIS: <b>{o.status}</b></span>
              {o.diblokir ? (
                <button onClick={() => bukaDialog('buka', o)} className="rounded-lg bg-slate-600 px-3 py-1">Buka blokir</button>
              ) : (
                <button onClick={() => bukaDialog('blokir', o)} className="rounded-lg bg-[#ED1C24] px-3 py-1 font-semibold">Blokir ODP</button>
              )}
            </div>
            {o.diblokir && <div className="text-xs text-[#ED1C24]">DIBLOKIR: {o.alasan_blokir}</div>}
          </div>
        ))}
      </section>

      {dialog && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDialog(null)}>
          <div className="w-full max-w-sm space-y-3 rounded-2xl bg-slate-800 p-4"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">
              {dialog.jenis === 'blokir' ? 'Blokir' : 'Buka blokir'} {dialog.odp.kode_odp}
            </h3>
            {dialog.jenis === 'blokir' ? (
              <>
                <p className="text-xs text-slate-400">
                  Status di WebGIS menjadi Penuh sampai blokir dibuka.
                </p>
                <textarea rows={3} className={input}
                  placeholder="Alasan (misal: port penuh sesuai foto eviden)"
                  value={dialog.alasan}
                  onChange={(e) => setDialog({ ...dialog, alasan: e.target.value })} />
              </>
            ) : (
              <p className="text-sm text-slate-300">Status WebGIS dikembalikan ke status sebelumnya.</p>
            )}
            {dialogErr && <p className="text-sm text-red-400">{dialogErr}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDialog(null)} className="rounded-lg bg-slate-700 py-2">Batal</button>
              <button type="button" onClick={kirimDialog} className="rounded-lg bg-[#ED1C24] py-2 font-semibold">Ya, lanjut</button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => setDetail(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-slate-800 p-4 space-y-3 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tiket #{detail.tiket.id} · {detail.tiket.area_klaster}</h3>
              <button onClick={() => setDetail(null)} className="text-slate-400">Tutup</button>
            </div>
            {detail.odp.map((o) => (
              <div key={o.id} className="rounded-lg bg-slate-700 p-3 text-sm space-y-1">
                <div className="font-medium">{o.kode_odp}</div>
                <div className="text-xs text-slate-400">{o.alamat}</div>
                <div>
                  Status fisik: <span className={warnaStatus[o.status_fisik]}>{o.status_fisik}</span>
                </div>
                {o.audit ? (
                  <div className="flex items-center gap-3">
                    <span>Hasil audit: <b className={warnaStatus[o.audit.status_akhir]}>{o.audit.status_akhir}</b></span>
                    {o.audit.foto_bukti && (
                      <a href={o.audit.foto_bukti} target="_blank" rel="noreferrer">
                        <img src={o.audit.foto_bukti} alt="Eviden" className="h-14 w-14 rounded object-cover" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-400">Belum diaudit</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}