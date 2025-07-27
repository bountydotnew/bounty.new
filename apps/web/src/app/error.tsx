// app/error.jsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Copy } from 'lucide-react'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error, reset: () => void }) {
  useEffect(() => {
    posthog.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="max-w-lg w-full text-center space-y-8 relative z-10">

        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Oops! Something went wrong
            </h1>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Don&apos;t worry, we&apos;ve been notified and our team is looking into it. 
            <br />
            You can try again or head back to safety.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => reset()}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            size="lg"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          
          <Button 
            variant="outline" 
            asChild
            className="flex items-center gap-2 border-border/50 hover:border-border hover:bg-muted/50 backdrop-blur-sm transition-all duration-200 transform hover:scale-105"
            size="lg"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-4">
            <details className="text-left bg-muted/30 backdrop-blur-sm border border-border/50 rounded-lg p-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Error details (copy and paste this if asked)
              </summary>
              <pre className="mt-4 p-4 bg-background/50 border border-border/30 rounded-md text-xs overflow-auto text-muted-foreground font-mono">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
            <Button 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(error.message + '\n\n' + error.stack)
              }}
              className="flex items-center gap-2 text-xs"
            >
              <Copy className="h-3 w-3" />
              Copy error
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}