import { useEffect, useState } from 'react'
import { api } from '../api.js'

const NAMA = { tiang: 'Tiang', boks: 'Boks', kabel: 'Kabel', port: 'Port' }

export default function Statistik() {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api('/dashboard/statistik').then(setData).catch((e) => setErr(e.message))
  }, [])

  if (err) return <p className="text-sm text-red-400">{err}</p>
  if (!data) return null

  const total = (k) => data.komponen[k].ringan + data.komponen[k].berat
  const maks = Math.max(1, ...Object.keys(data.komponen).map(total))

  return (
    <section className="rounded-xl bg-slate-800 p-4 space-y-4">
      <div>
        <h2 className="font-semibold text-slate-300">Statistik Kerusakan</h2>
        <p className="text-xs text-slate-400">
          Berdasarkan audit terakhir tiap ODP ({data.jumlah_odp_diaudit} ODP pernah diaudit)
        </p>
      </div>

      {data.jumlah_odp_diaudit === 0 ? (
        <p className="text-sm text-slate-400">Belum ada data audit.</p>
      ) : (
        <div className="space-y-2">
          {Object.keys(data.komponen).map((k) => {
            const { ringan, berat } = data.komponen[k]
            return (
              <div key={k} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{NAMA[k]}</span>
                  <span className="text-slate-400">
                    Rusak ringan {ringan} · Rusak berat {berat}
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded bg-slate-700">
                  <div className="bg-[#F59E0B]" style={{ width: `${(ringan / maks) * 100}%` }} />
                  <div className="bg-[#ED1C24]" style={{ width: `${(berat / maks) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-1">
        <div className="text-sm text-slate-300">Kondisi ODP per area</div>
        {data.area.map((a) => (
          <div key={a.nama} className="flex items-center justify-between rounded-lg bg-slate-700 px-3 py-2 text-xs">
            <span className="font-medium">{a.nama}</span>
            <span className="space-x-2">
              <span className="text-[#10B981]">Aman {a.Aman}</span>
              <span className="text-[#F59E0B]">Warning {a.Warning}</span>
              <span className="text-[#ED1C24]">Critical {a.Critical}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}