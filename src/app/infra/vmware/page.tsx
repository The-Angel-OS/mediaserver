'use client'
import { Server, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VMwarePage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-purple mb-1">── Infrastructure · VMware</div>
        <h1 className="text-2xl font-mono font-semibold">VMware vSphere</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Routed via nginx proxy at /infra/vmware/</p>
      </div>
      <Card className="p-0 overflow-hidden border-lcars-purple/30">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-lcars-purple/5">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-lcars-purple" />
            <span className="text-sm font-mono">vSphere Client</span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] font-mono" asChild>
            <a href="https://localhost/vsphere-client" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3" /> Open Direct
            </a>
          </Button>
        </div>
        <iframe
          src="/proxy/vmware"
          className="w-full h-[calc(100vh-220px)] border-0"
          title="VMware vSphere"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </Card>
    </div>
  )
}
