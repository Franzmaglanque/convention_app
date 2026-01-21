import React, { createContext, useContext, ReactNode } from 'react';
import useMessageToast from '@/hooks/useMessageToast';
import MessageToast from '@/components/MessageToast';

type ToastContextType = ReturnType<typeof useMessageToast>;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toast = useMessageToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Global Toast Component */}
      <MessageToast
        visible={toast.toastState.visible}
        type={toast.toastState.type}
        message={toast.toastState.message}
        onDismiss={toast.hideToast}
        position="top"
      />
    </ToastContext.Provider>
  );
}

export default ToastProvider;