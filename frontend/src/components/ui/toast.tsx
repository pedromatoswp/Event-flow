'use client';

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: 'success' | 'error' | 'info' | 'warning'
    onClose?: () => void
  }
>(({ className, type = 'info', onClose, children, ...props }, ref) => {
  const typeStyles = {
    success: 'bg-green-500 text-white border-green-600',
    error: 'bg-red-500 text-white border-red-600',
    info: 'bg-blue-500 text-white border-blue-600',
    warning: 'bg-yellow-500 text-white border-yellow-600',
  }

  return (
    <div
      ref={ref}
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all",
        typeStyles[type],
        className
      )}
      {...props}
    >
      <span className="flex-1 text-sm">{children}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-full p-1 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
})
Toast.displayName = "Toast"

export { Toast }
