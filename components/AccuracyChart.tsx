import React from 'react';
import type { TFunction } from '../types';

export interface AccuracyChartProps {
    accuracyFunction: ((r: number) => number | null) | null;
    currentRatio: number | null;
    currentAccuracy: number | null;
    maxRatio: number;
    t: TFunction;
}

export const AccuracyChart: React.FC<AccuracyChartProps> = ({ accuracyFunction, currentRatio, currentAccuracy, maxRatio, t }) => {
    const width = 500;
    const height = 300;
    // Increased left margin for better label spacing
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (!accuracyFunction || maxRatio <= 1) {
        return (
            <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center text-center p-4">
                {currentAccuracy !== null && isFinite(currentAccuracy) ? (
                    <div>
                        <p className="text-lg text-gray-600 font-semibold mb-2">{t('spec_accuracy')}</p>
                        <p className="text-5xl font-bold text-red-600">
                            {`±${currentAccuracy.toPrecision(3)}% FS`}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-500">{t('enterRangeToCalculate')}</p>
                )}
            </div>
        );
    }
    
    const dataPoints: { r: number; acc: number }[] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const r = 1 + (i / steps) * (maxRatio - 1);
        const acc = accuracyFunction(r);
        if (acc !== null) {
            dataPoints.push({ r, acc });
        }
    }
    
    if (dataPoints.length < 2) {
       return (
            <div style={{ width: `${width}px`, height: `${height}px` }} className="flex items-center justify-center text-gray-500">
                <p>{t('enterRangeToCalculate')}</p>
            </div>
        );
    }

    const maxAccuracy = Math.max(...dataPoints.map(p => p.acc), 0.04) * 1.1; // Add padding

    const xScale = (r: number) => (r - 1) / (maxRatio - 1) * innerWidth;
    const yScale = (acc: number) => innerHeight - (acc / maxAccuracy) * innerHeight;

    const linePath = dataPoints
        .map(p => `${xScale(p.r).toFixed(2)},${yScale(p.acc).toFixed(2)}`)
        .join(' L ');

    const xTicks = [1, ...Array.from({ length: 4 }, (_, i) => 1 + ((maxRatio - 1) / 4) * (i + 1))];
    const yTicks = Array.from({ length: 5 }, (_, i) => (maxAccuracy / 4) * i);
    
    return (
        // Use SVG attributes and inline styles instead of CSS classes for reliable PDF export
        <svg 
            viewBox={`0 0 ${width} ${height}`} 
            width={width} 
            height={height} 
            style={{ 
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                maxWidth: '100%' 
            }}
        >
            <g transform={`translate(${margin.left}, ${margin.top})`}>
                {/* Axes */}
                <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#9ca3af" />
                <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#9ca3af" />

                {/* X-axis Ticks and Labels */}
                {xTicks.map(tick => (
                    <g key={`x-${tick}`} transform={`translate(${xScale(tick)}, ${innerHeight})`}>
                        <line y2="5" stroke="#9ca3af" />
                        <text y="20" textAnchor="middle" fontSize="12" fill="#4b5563">{tick.toFixed(0)}</text>
                    </g>
                ))}
                <text x={innerWidth / 2} y={innerHeight + 35} textAnchor="middle" fontSize="14" fontWeight="600" fill="#374151">
                    {t('turndownRatio')}
                </text>

                {/* Y-axis Ticks and Labels */}
                {yTicks.map(tick => (
                    <g key={`y-${tick}`} transform={`translate(0, ${yScale(tick)})`}>
                        <line x2="-5" stroke="#9ca3af" />
                        <text x="-8" dy=".32em" textAnchor="end" fontSize="12" fill="#4b5563">{tick.toFixed(3)}</text>
                    </g>
                ))}
                <text transform={`translate(-45, ${innerHeight / 2}) rotate(-90)`} textAnchor="middle" fontSize="14" fontWeight="600" fill="#374151">
                    {t('accuracy')}
                </text>
                
                {/* Line */}
                <path d={`M ${linePath}`} fill="none" stroke="steelblue" strokeWidth="2" />

                {/* Current Point */}
                {currentRatio !== null && currentAccuracy !== null && isFinite(currentRatio) && isFinite(currentAccuracy) && (
                    <g transform={`translate(${xScale(currentRatio)}, ${yScale(currentAccuracy)})`}>
                        <circle r="5" fill="#dc2626" />
                        <text x="10" y="5" fontSize="14" fontWeight="bold" fill="#dc2626">
                            {`±${currentAccuracy.toPrecision(3)}%`}
                        </text>
                    </g>
                )}
            </g>
        </svg>
    );
};