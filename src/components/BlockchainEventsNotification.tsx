import React, { useState, useEffect } from 'react';
import { useBlockchainEvents, BlockchainGrievanceRegisteredEvent, BlockchainStatusUpdatedEvent } from '../hooks/useBlockchainEvents';

interface BlockchainEventsNotificationProps {
  showToasts?: boolean;
  maxToasts?: number;
}

interface Toast {
  id: string;
  type: 'registered' | 'status';
  message: string;
  timestamp: number;
  txHash: string;
}

export const BlockchainEventsNotification: React.FC<BlockchainEventsNotificationProps> = ({
  showToasts = true,
  maxToasts = 3,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handleGrievanceRegistered = (event: BlockchainGrievanceRegisteredEvent) => {
    if (!showToasts) return;

    const toast: Toast = {
      id: `${event.transactionHash}-${Date.now()}`,
      type: 'registered',
      message: `Grievance ${event.grievanceId.slice(0, 8)}... confirmed on blockchain`,
      timestamp: event.timestamp,
      txHash: event.transactionHash,
    };

    setToasts((prev) => [toast, ...prev].slice(0, maxToasts));
  };

  const handleStatusUpdated = (event: BlockchainStatusUpdatedEvent) => {
    if (!showToasts) return;

    const toast: Toast = {
      id: `${event.transactionHash}-${Date.now()}`,
      type: 'status',
      message: `Status changed: ${event.oldStatus} → ${event.newStatus}`,
      timestamp: event.timestamp,
      txHash: event.transactionHash,
    };

    setToasts((prev) => [toast, ...prev].slice(0, maxToasts));
  };

  const { isConnected } = useBlockchainEvents({
    onGrievanceRegistered: handleGrievanceRegistered,
    onStatusUpdated: handleStatusUpdated,
  });

  // Auto-remove toasts after 5 seconds
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [toasts]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getEtherscanUrl = (txHash: string) => {
    // Use Sepolia testnet explorer
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  };

  return (
    <>
      {/* Connection status indicator (optional, can be hidden) */}
      <div className="fixed bottom-4 left-4 z-50">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            isConnected
              ? 'bg-success/10 text-success'
              : 'bg-secondary/70 text-muted-foreground'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground'
            }`}
          />
          {isConnected ? 'Live' : 'Connecting...'}
        </div>
      </div>

      {/* Toast notifications */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              transform transition-all duration-300 ease-out
              bg-card rounded-lg shadow-lg border
              ${
                toast.type === 'registered'
                  ? 'border-success/20'
                  : 'border-border'
              }
              p-4 animate-slide-in
            `}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${
                    toast.type === 'registered'
                      ? 'bg-success/15'
                      : 'bg-secondary/70'
                  }
                `}
              >
                {toast.type === 'registered' ? (
                  <svg
                    className="w-4 h-4 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {toast.type === 'registered' ? 'Blockchain Confirmed' : 'Status Updated'}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {toast.message}
                </p>
                <a
                  href={getEtherscanUrl(toast.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                >
                  View on Etherscan
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CSS for animation */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default BlockchainEventsNotification;
