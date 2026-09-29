import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export interface AlertProps {
  type: 'error' | 'success';
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type,
  message,
  onDismiss,
  className = '',
}) => {
  const isError = type === 'error';

  return (
    <div
      id="messageBox"
      role="alert"
      className={`p-4 rounded-xl flex items-center border transition-all ${
        isError
          ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60'
          : 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/60'
      } ${className}`}
    >
      {isError ? (
        <AlertCircle className="w-5 h-5 mr-3 shrink-0 text-red-500" />
      ) : (
        <CheckCircle className="w-5 h-5 mr-3 shrink-0 text-green-500" />
      )}
      <span id="messageText" className="text-sm font-medium flex-1">
        {message}
      </span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

Alert.displayName = 'Alert';
