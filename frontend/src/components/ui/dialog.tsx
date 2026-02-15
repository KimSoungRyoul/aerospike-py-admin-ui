"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

interface DialogContextValue {
  onClose: () => void
}

const DialogContext = React.createContext<DialogContextValue>({
  onClose: () => {},
})

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [open])

  const handleClose = React.useCallback(() => {
    onOpenChange?.(false)
  }, [onOpenChange])

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(e) => {
        e.preventDefault()
        handleClose()
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose()
      }}
    >
      <DialogContext.Provider value={{ onClose: handleClose }}>
        {children}
      </DialogContext.Provider>
    </dialog>
  )
}

const DialogTrigger = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)
DialogTrigger.displayName = "DialogTrigger"

const DialogPortal = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)
DialogPortal.displayName = "DialogPortal"

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => <div ref={ref} {...props} />)
DialogOverlay.displayName = "DialogOverlay"

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { onClose } = React.useContext(DialogContext)
  return (
    <button
      ref={ref}
      onClick={(e) => {
        onClick?.(e)
        onClose()
      }}
      {...props}
    />
  )
})
DialogClose.displayName = "DialogClose"

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { onClose } = React.useContext(DialogContext)
  return (
    <div ref={ref} className={cn("modal-box relative", className)} {...props}>
      {children}
      <button
        onClick={onClose}
        className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
