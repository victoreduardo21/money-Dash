import React, { useState, useEffect, useRef, ReactElement } from 'react';

interface SafeResponsiveContainerProps {
  children: ReactElement;
  width?: string | number;
  height?: string | number;
  className?: string;
  minWidth?: number;
  minHeight?: number;
  aspect?: number;
  id?: string;
}

export const SafeResponsiveContainer: React.FC<SafeResponsiveContainerProps> = ({
  children,
  width = '100%',
  height = '100%',
  className = '',
  minWidth = 0,
  minHeight = 0,
  aspect,
  id,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof width === 'number' ? width : 0,
    height: typeof height === 'number' ? height : 0,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      let w = rect.width || (typeof width === 'number' ? width : 300);
      let h = rect.height || (typeof height === 'number' ? height : 280);

      if (aspect && aspect > 0 && w > 0) {
        h = w / aspect;
      }

      if (minWidth && w < minWidth) w = minWidth;
      if (minHeight && h < minHeight) h = minHeight;

      if (w > 0 && h > 0) {
        setDimensions(prev => {
          if (Math.abs(prev.width - w) < 1 && Math.abs(prev.height - h) < 1) {
            return prev;
          }
          return { width: Math.round(w), height: Math.round(h) };
        });
      }
    };

    measure();

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height, aspect, minWidth, minHeight]);

  const style: React.CSSProperties = {
    width: width,
    height: height,
    minWidth: minWidth || undefined,
    minHeight: minHeight || undefined,
    position: 'relative',
  };

  return (
    <div id={id} ref={containerRef} className={`recharts-responsive-container ${className}`} style={style}>
      {dimensions.width > 0 && dimensions.height > 0 && React.isValidElement(children) && (
        React.cloneElement(children as ReactElement<{ width: number; height: number }>, {
          width: dimensions.width,
          height: dimensions.height,
        })
      )}
    </div>
  );
};

export default SafeResponsiveContainer;
