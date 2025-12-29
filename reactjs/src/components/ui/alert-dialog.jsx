import { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

const AlertDialogContext = createContext(null);

export function AlertDialog({ open: controlledOpen, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setOpen(false)}
        />
        {children}
      </div>
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogContent({ className, children, ...props }) {
  const context = useContext(AlertDialogContext);
  if (!context) {
    console.error('AlertDialogContent must be used inside AlertDialog component');
    return null;
  }
  const { setOpen } = context;
  return (
    <div
      className={cn(
        'relative z-50 grid w-full max-w-lg gap-4 rounded-lg border bg-background p-6 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDialogHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

export function AlertDialogTitle({ className, ...props }) {
  return (
    <div
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({ className, ...props }) {
  return (
    <div
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export function AlertDialogCancel({ className, onClick, ...props }) {
  const context = useContext(AlertDialogContext);
  if (!context) {
    return null;
  }
  const { setOpen } = context;
  return (
    <Button
      variant="outline"
      className={className}
      onClick={() => {
        setOpen(false);
        onClick?.();
      }}
      {...props}
    />
  );
}

export function AlertDialogAction({ className, onClick, ...props }) {
  const context = useContext(AlertDialogContext);
  if (!context) {
    return null;
  }
  const { setOpen } = context;
  return (
    <Button
      className={className}
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      {...props}
    />
  );
}

