import { useState, useCallback } from 'react';
import { MessageType } from '@/components/MessageToast';

export interface MessageToastState {
  visible: boolean;
  type: MessageType;
  message: string;
}

export interface UseMessageToastReturn {
  /** Current toast state */
  toastState: MessageToastState;
  /** Show a success message */
  showSuccess: (message: string, duration?: number) => void;
  /** Show an error message */
  showError: (message: string, duration?: number) => void;
  /** Show an info message */
  showInfo: (message: string, duration?: number) => void;
  /** Show a warning message */
  showWarning: (message: string, duration?: number) => void;
  /** Show a custom message */
  showMessage: (type: MessageType, message: string, duration?: number) => void;
  /** Hide the current toast */
  hideToast: () => void;
  /** Clear the toast (immediate hide) */
  clearToast: () => void;
}

const defaultState: MessageToastState = {
  visible: false,
  type: 'info',
  message: '',
};

/**
 * Custom hook for managing message toasts throughout the app
 * 
 * @example
 * const { showSuccess, showError, toastState } = useMessageToast();
 * 
 * // Show success message
 * showSuccess('Operation completed successfully!');
 * 
 * // Show error message
 * showError('Something went wrong');
 * 
 * // In your component:
 * <MessageToast {...toastState} onDismiss={hideToast} />
 */
export const useMessageToast = (): UseMessageToastReturn => {
  const [toastState, setToastState] = useState<MessageToastState>(defaultState);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const clearExistingTimeout = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  const showMessage = useCallback((
    type: MessageType,
    message: string,
    duration: number = 4000
  ) => {
    clearExistingTimeout();

    setToastState({
      visible: true,
      type,
      message,
    });

    if (duration > 0) {
      const id = setTimeout(() => {
        setToastState(prev => ({ ...prev, visible: false }));
      }, duration);
      setTimeoutId(id);
    }
  }, [clearExistingTimeout]);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showMessage('success', message, duration);
  }, [showMessage]);

  const showError = useCallback((message: string, duration?: number) => {
    showMessage('error', message, duration);
  }, [showMessage]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showMessage('info', message, duration);
  }, [showMessage]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showMessage('warning', message, duration);
  }, [showMessage]);

  const hideToast = useCallback(() => {
    clearExistingTimeout();
    setToastState(prev => ({ ...prev, visible: false }));
  }, [clearExistingTimeout]);

  const clearToast = useCallback(() => {
    clearExistingTimeout();
    setToastState(defaultState);
  }, [clearExistingTimeout]);

  return {
    toastState,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showMessage,
    hideToast,
    clearToast,
  };
};

export default useMessageToast;