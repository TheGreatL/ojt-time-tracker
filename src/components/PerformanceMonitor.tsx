
import React, { useEffect, useRef } from 'react';
import { View, ViewStyle } from 'react-native';

interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

/**
 * A simple performance monitoring wrapper that logs mount times and re-renders.
 * Use this to wrap screens or heavy components to identify bottlenecks.
 * 
 * Usage:
 * <PerformanceMonitor componentName="MyScreen">
 *   <MyScreenContent />
 * </PerformanceMonitor>
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  componentName, 
  children,
  style 
}) => {
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    const now = performance.now();
    const timeToMount = now - mountTime.current;
    console.log(`[Perf] ${componentName} mounted in ${timeToMount.toFixed(2)}ms`);

    return () => {
      console.log(`[Perf] ${componentName} unmounted`);
    };
  }, [componentName]);

  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    // Log re-renders only after the initial mount (renderCount > 1)
    if (renderCount.current > 1) {
       console.log(`[Perf] ${componentName} re-render #${renderCount.current - 1} took ${timeSinceLastRender.toFixed(2)}ms since last render`);
    }
    
    lastRenderTime.current = now;
  });

  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
    </View>
  );
};
