'use client'
import { Box, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function KubernetesPage() {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-lcars-purple mb-1">── Infrastructure · Kubernetes</div>
        <h1 className="text-2xl font-mono font-semibold">Kubernetes Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Routed via nginx proxy at /infra/kubernetes/</p>
      </div>
      <Card className="p-0 overflow-hidden border-lcars-purple/30">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-lcars-purple/5">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-lcars-purple" />
            <span className="text-sm font-mono">K8s Dashboard</span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] font-mono" asChild>
            <a href="http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3" /> Open Direct
            </a>
          </Button>
        </div>
        <iframe
          src="/proxy/kubernetes"
          className="w-full h-[calc(100vh-220px)] border-0"
          title="Kubernetes Dashboard"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </Card>
    </div>
  )
}
