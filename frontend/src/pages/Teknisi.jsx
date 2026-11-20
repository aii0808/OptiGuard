import { useEffect, useState, useCallback } from 'react'
import { api } from '../api.js'
import { useAuth } from '../auth.jsx'

const warna = {
  Aman: 'text-[#10B981]', Normal: 'text-[#10B981]', Warning: 'text-[#F59E0B]', Critical: 'text-[#ED1C24]',
}
const warnaTiket = {
  Pending: 'bg-slate-600', 'In Progress': 'bg-[#F59E0B] text-slate-900', Selesai: 'bg-[#10B981] text-slate-900',
}
const BAIK_RUSAK = [[1, 'Aman'], [2, 'Rusak ringan'], [3, 'Rusak berat']]
const PARAMETER = [
  { key: 'tiang', label: 'Kondisi Tiang', opsi: BAIK_RUSAK },
  { key: 'boks', label: 'Kondisi Boks', opsi: BAIK_RUSAK },
  { key: 'kabel', label: 'Kondisi Kabel', opsi: BAIK_RUSAK },
  { key: 'port', label: 'Kondisi Port', opsi: [[1, 'Bersih'], [2, 'Berdebu'], [3, 'Kotor/Rusak']] },
]

async function kompres(file, maxSisi = 1280, kualitas = 0.8) {
  const bmp = await createImageBitmap(file)
  const skala = Math.min(1, maxSisi / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * skala)
  c.height = Math.round(bmp.height * skala)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', kualitas))
  return new File([blob], 'evidence.jpg', { type: 'image/jpeg' })
}

function FormAudit({ tiketId, odp, onSelesai, onBatal }) {
  const [nilai, setNilai] = useState({ tiang: 0, boks: 0, kabel: 0, port: 0 })
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const lengkap = Object.values(nilai).every(Boolean) && foto

  async function pilihFoto(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setErr('')
    try {
      const k = await kompres(f)
      setFoto(k)
      setPreview(URL.createObjectURL(k))
    } catch {
      setErr('Gagal memproses foto, coba ambil ulang')
    }
  }

  async function kirim(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('tiket_id', tiketId)
      fd.append('odp_id', odp.id)
      PARAMETER.forEach((p) => fd.append(p.key, nilai[p.key]))
      fd.append('foto', foto)
      const r = await api('/audit', { method: 'POST', form: fd })
      onSelesai(r)
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={kirim} className="rounded-xl bg-slate-800 p-4 space-y-4">
      <div>
        <h2 className="font-semibold">Checklist {odp.kode_odp}</h2>
        <p className="text-xs text-slate-400">{odp.alamat}</p>
      </div>

      {PARAMETER.map((p) => (
        <div key={p.key} className="space-y-1">
          <div className="text-sm text-slate-300">{p.label}</div>
          <div className="grid grid-cols-3 gap-2">
            {p.opsi.map(([v, teks]) => (
              <button
                type="button" key={v}
                onClick={() => setNilai({ ...nilai, [p.key]: v })}
                className={`rounded-lg px-2 py-2 text-xs ${
                  nilai[p.key] === v
                    ? v === 1 ? 'bg-[#10B981] text-slate-900' : v === 2 ? 'bg-[#F59E0B] text-slate-900' : 'bg-[#ED1C24]'
                    : 'bg-slate-700'
                }`}
              >
                {teks}
              </button>
            ))}
          </div>
        </div>
      ))}

      <label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-600 p-4 text-center text-sm text-slate-400">
        {preview
          ? <img src={preview} alt="Eviden" className="mx-auto max-h-48 rounded-lg" />
          : '📷 Ambil / unggah foto eviden'}
        <input type="file" accept="image/*" capture="environment" onChange={pilihFoto} className="hidden" />
      </label>

      {err && <p className="text-sm text-red-400">{err}</p>}

      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={onBatal} className="rounded-lg bg-slate-700 py-2">Batal</button>
        <button disabled={!lengkap || loading}
          className="col-span-2 rounded-lg bg-[#ED1C24] py-2 font-semibold disabled:opacity-50">
          {loading ? 'Mengirim...' : 'Kirim Hasil Audit'}
        </button>
      </div>
    </form>
  )
}

export default function Teknisi() {
  const { user, logout } = useAuth()
  const [daftar, setDaftar] = useState([])
  const [aktif, setAktif] = useState(null)
  const [odpPilih, setOdpPilih] = useState(null)
  const [msg, setMsg] = useState(null)

  const muatDaftar = useCallback(async () => setDaftar(await api('/tiket')), [])
  const bukaTiket = useCallback(async (id) => setAktif(await api(`/tiket/${id}/odp`)), [])

  useEffect(() => {
    muatDaftar().catch((e) => setMsg({ ok: false, teks: e.message }))
  }, [muatDaftar])

  async function mulai() {
    try {
      await api(`/tiket/${aktif.tiket.id}/mulai`, { method: 'POST' })
      setMsg({ ok: true, teks: 'Tiket dimulai. Silakan audit tiap ODP.' })
      await bukaTiket(aktif.tiket.id)
      await muatDaftar()
    } catch (e) {
      setMsg({ ok: false, teks: e.message })
    }
  }

  async function selesaiAudit(r) {
    setMsg({ ok: true, teks: `Audit terkirim. Status ODP: ${r.status_akhir}` })
    setOdpPilih(null)
    await bukaTiket(aktif.tiket.id)
    await muatDaftar()
  }

  function kembali() {
    setAktif(null)
    setOdpPilih(null)
    muatDaftar()
  }

  const dikerjakan = aktif?.tiket.status_tiket === 'In Progress'

  return (
    <div className="mx-auto max-w-md p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#ED1C24]">OPTIGUARD</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">{user.nama}</span>
          <button onClick={logout} className="rounded-lg bg-slate-700 px-3 py-1">Keluar</button>
        </div>
      </header>

      {msg && <p className={`text-sm ${msg.ok ? 'text-[#10B981]' : 'text-red-400'}`}>{msg.teks}</p>}

      {!aktif && (
        <section className="space-y-2">
          <h2 className="font-semibold text-slate-300">Tugas Patroli Saya</h2>
          {daftar.length === 0 && <p className="text-sm text-slate-400">Belum ada tugas.</p>}
          {daftar.map((t) => (
            <button key={t.id} onClick={() => { setMsg(null); bukaTiket(t.id) }}
              className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-left">
              <div>
                <div className="font-medium">#{t.id} · {t.area_klaster}</div>
                <div className="text-xs text-slate-400">{t.tanggal_tugas}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${warnaTiket[t.status_tiket]}`}>
                {t.status_tiket}
              </span>
            </button>
          ))}
        </section>
      )}

      {aktif && !odpPilih && (
        <section className="space-y-2">
          <button onClick={kembali} className="text-sm text-slate-400">← Kembali</button>
          <h2 className="font-semibold">Tiket #{aktif.tiket.id} · {aktif.tiket.area_klaster}</h2>

          {aktif.tiket.status_tiket === 'Pending' && (
            <div className="rounded-xl bg-slate-800 p-4 space-y-2">
              <p className="text-sm text-slate-300">
                Tiket ini belum dimulai. Tekan tombol di bawah saat kamu sudah di lokasi.
              </p>
              <button onClick={mulai}
                className="w-full rounded-lg bg-[#ED1C24] py-2 font-semibold">
                Mulai Kerjakan
              </button>
            </div>
          )}

          {aktif.odp.map((o) => (
            <div key={o.id} className="rounded-xl bg-slate-800 p-3 text-sm space-y-1">
              <div className="font-medium">{o.kode_odp}</div>
              <div className="text-xs text-slate-400">{o.alamat}</div>
              <div className="flex items-center justify-between">
                <span>
                  Status: <b className={warna[o.audit?.status_akhir || o.status_fisik]}>
                    {o.audit?.status_akhir || o.status_fisik}
                  </b>
                </span>
                <div className="flex gap-2">
                  <a href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                    target="_blank" rel="noreferrer"
                    className="rounded-lg bg-slate-700 px-3 py-1 text-xs">Peta</a>
                  {o.audit ? (
                    <span className="rounded-lg bg-[#10B981] px-3 py-1 text-xs text-slate-900">Sudah diaudit</span>
                  ) : (
                    dikerjakan && (
                      <button onClick={() => { setMsg(null); setOdpPilih(o) }}
                        className="rounded-lg bg-[#ED1C24] px-3 py-1 text-xs font-semibold">Audit</button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {aktif && odpPilih && (
        <FormAudit tiketId={aktif.tiket.id} odp={odpPilih}
          onSelesai={selesaiAudit} onBatal={() => setOdpPilih(null)} />
      )}
    </div>
  )
}