import React, { useEffect, useRef } from 'react';

export interface PluggyConnectProps {
  connectToken: string;
  includeSandbox?: boolean;
  onSuccess?: (itemData: any) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
}

export const PluggyConnect: React.FC<PluggyConnectProps> = ({
  connectToken,
  includeSandbox = true,
  onSuccess,
  onError,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pluggyInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !connectToken) return;

    // Use official PluggyConnect class loaded from https://cdn.pluggy.ai/pluggy-connect/v2.latest.js
    const PluggyConnectClass = (window as any).PluggyConnect;
    if (!PluggyConnectClass) {
      console.warn('[PluggyConnect] PluggyConnect script from CDN is still loading...');
      return;
    }

    try {
      const pluggy = new PluggyConnectClass({
        connectToken,
        includeSandbox,
        onSuccess: (data: any) => {
          onSuccess?.(data);
        },
        onError: (err: any) => {
          onError?.(err);
        },
        onClose: () => {
          onClose?.();
        },
      });

      pluggyInstanceRef.current = pluggy;
      pluggy.init(containerRef.current);
    } catch (e) {
      console.error('[PluggyConnect] Error initializing PluggyConnect widget:', e);
      onError?.(e);
    }

    return () => {
      try {
        if (pluggyInstanceRef.current?.destroy) {
          pluggyInstanceRef.current.destroy();
        }
      } catch (err) {
        // ignore cleanup error
      }
    };
  }, [connectToken, includeSandbox, onSuccess, onError, onClose]);

  return (
    <div
      ref={containerRef}
      id="PluggyConnect"
      className="w-full h-full min-h-[460px] flex items-center justify-center"
    />
  );
};
