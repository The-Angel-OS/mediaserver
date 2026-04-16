'use client'
/**
 * /cic — Combat Information Center
 *
 * A fully client-side ship-board battle computer. All widgets are procedurally
 * animated — no backend calls. Composes RadarSweep, TacticalGrid, BarMeter,
 * SystemMatrix, and Ticker inside LcarsFrame panels over a warp-speed
 * starfield background.
 */
import { useEffect, useState } from 'react'
import { RadarSweep } from '@/components/ship/RadarSweep'
import { WarpField } from '@/components/ship/WarpField'
import { BarMeter } from '@/components/ship/BarMeter'
import { SystemMatrix } from '@/components/ship/SystemMatrix'
import { TacticalGrid } from '@/components/ship/TacticalGrid'
import { Ticker } from '@/components/ship/Ticker'
import { LcarsFrame } from '@/components/ship/LcarsFrame'

function useStardate() {
  const [s, setS] = useState('')
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const year = d.getFullYear().toString().slice(-2)
      const day = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000)
      const frac = ((d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400) * 10
      setS(`${year}${day.toString().padStart(3, '0')}.${frac.toFixed(2)}`)
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [])
  return s
}

export default function CICPage() {
  const stardate = useStardate()

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden">
      {/* Warp-speed starfield background */}
      <div className="fixed inset-0 -z-10">
        <WarpField density={220} speed={0.4} color="#5599dd" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-[#0a0a14]" />
      </div>

      {/* Header strip */}
      <div className="border-b border-lcars-amber/20 bg-black/60 backdrop-blur-sm">
        <div className="container flex items-center justify-between py-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-lcars-amber/70">
              Combat Information Center · Local Node
            </div>
            <h1 className="font-mono text-2xl font-semibold tracking-wide text-lcars-amber md:text-3xl">
              C.I.C.
            </h1>
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-widest text-white/60">
            <div>STARDATE</div>
            <div className="text-lg font-semibold tabular-nums text-lcars-blue">{stardate}</div>
          </div>
        </div>
      </div>

      <div className="container space-y-4 py-6">
        {/* Row 1: Radar + Tactical + Subsystems */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Radar */}
          <div className="lg:col-span-3">
            <LcarsFrame title="Sensor Array" corner="var(--lcars-amber)" accent="var(--lcars-blue-deep)">
              <div className="flex justify-center">
                <RadarSweep size={280} sweepSeconds={3.5} contactCount={9} />
              </div>
            </LcarsFrame>
          </div>

          {/* Tactical Grid */}
          <div className="lg:col-span-6">
            <LcarsFrame title="Tactical Plot" corner="var(--lcars-blue)" accent="var(--lcars-purple)">
              <div className="flex justify-center">
                <TacticalGrid width={560} height={300} trackCount={11} />
              </div>
            </LcarsFrame>
          </div>

          {/* Subsystem Matrix */}
          <div className="lg:col-span-3">
            <LcarsFrame title="Subsystems" corner="var(--lcars-lavender)" accent="var(--lcars-orange)">
              <SystemMatrix rows={10} cols={6} label="INTEGRITY MATRIX" />
            </LcarsFrame>
          </div>
        </div>

        {/* Row 2: Meters + Telemetry */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Bar meters */}
          <div className="lg:col-span-7">
            <LcarsFrame title="Power Distribution" corner="var(--lcars-orange)" accent="var(--lcars-amber)">
              <div className="space-y-2">
                <BarMeter label="Shields" color="var(--lcars-blue)" targetSeed={0} />
                <BarMeter label="Warp Core" color="var(--lcars-amber)" targetSeed={1} />
                <BarMeter label="Impulse" color="var(--lcars-peach)" targetSeed={2} />
                <BarMeter label="Phasers" color="var(--lcars-red)" targetSeed={3} />
                <BarMeter label="Life Support" color="var(--lcars-green)" targetSeed={4} />
                <BarMeter label="Sensors" color="var(--lcars-lavender)" targetSeed={5} />
                <BarMeter label="Comms" color="var(--lcars-blue-deep)" targetSeed={6} />
                <BarMeter label="Holodeck" color="var(--lcars-purple)" targetSeed={7} />
              </div>
            </LcarsFrame>
          </div>

          {/* Telemetry Ticker */}
          <div className="lg:col-span-5">
            <LcarsFrame
              title="Telemetry Feed"
              corner="var(--lcars-green)"
              accent="var(--lcars-blue-deep)"
              right={
                <span className="flex items-center gap-1">
                  <span className="liveness-dot size-1.5 rounded-full bg-black" />
                  LIVE
                </span>
              }
            >
              <Ticker max={12} />
            </LcarsFrame>
          </div>
        </div>

        {/* Footer strip */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
          <span>ANGEL OS · NIMUE CIC BUILD 2.0</span>
          <span>ALL SYSTEMS CLIENT-SIDE · ZERO LATENCY</span>
          <span>LOCAL NODE · LAN BROADCAST</span>
        </div>
      </div>
    </div>
  )
}
