
import React, { useMemo } from 'react';
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
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const { points, yMax } = useMemo(() => {
        if (!accuracyFunction) return { points: [], yMax: 0.1 };
        const dataPoints = [];
        let maxY = 0.04; // Min y-axis value to handle flat lines
        const step = maxRatio > 1 ? (maxRatio - 1) / 100 : 0;
        for (let i = 0; i <= 100; i++) {
            const r = 1 + i * step;
            if (r > maxRatio) continue;
            const acc = accuracyFunction(r);
            if (acc !== null) {
                dataPoints.push({ r, acc });
                if (acc > maxY) maxY = acc;
            }
        }
        if (currentAccuracy !== null && currentAccuracy > maxY) {
            maxY = currentAccuracy;
        }
        return { points: dataPoints, yMax: Math.max(maxY * 1.2, 0.05) };
    }, [accuracyFunction, maxRatio, currentAccuracy]);

    const xScale = (r: number) => margin.left + ((r - 1) / (maxRatio > 1 ? maxRatio - 1 : 1)) * innerWidth;
    const yScale = (acc: number) => margin.top + innerHeight - (acc / yMax) * innerHeight;

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.r)} ${yScale(p.acc)}`).join(' ');

    const xTicks = useMemo(() => {
        const ticks = new Set([1]);
        if (maxRatio > 1) {
            const quarters = [0.25, 0.5, 0.75, 1];
            quarters.forEach(q => {
                const tickVal = 1 + q * (maxRatio - 1);
                // For small ratios, don't round to avoid duplicate ticks
                ticks.add(maxRatio < 10 ? parseFloat(tickVal.toFixed(1)) : Math.round(tickVal));
            });
        }
        return Array.from(ticks).sort((a, b) => a - b);
    }, [maxRatio]);
    
    const yTicks = useMemo(() => {
        const tickCount = 5;
        const ticks = [];
        for (let i = 0; i <= tickCount; i++) {
            ticks.push((i / tickCount) * yMax);
        }
        return ticks;
    }, [yMax]);


    return (
        <svg width={width} height={height} className="max-w-full" xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: 'sans-serif' }}>
            <g className="axes-and-labels">
                {/* Y Axis */}
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerHeight} stroke="#9ca3af" strokeWidth="1" />
                {yTicks.map(tick => (
                    <g key={`y-tick-${tick}`} className="tick">
                        <line x1={margin.left} y1={yScale(tick)} x2={margin.left - 5} y2={yScale(tick)} stroke="#9ca3af" strokeWidth="1" />
                        <text
                            x={margin.left - 8}
                            y={yScale(tick)}
                            textAnchor="end"
                            alignmentBaseline="middle"
                            fontSize="10px"
                            fill="#4b5563"
                        >
                           {(tick * 100).toFixed(1)}
                        </text>
                    </g>
                ))}
                <text
                    transform={`translate(20, ${margin.top + innerHeight / 2}) rotate(-90)`}
                    textAnchor="middle"
                    fontSize="12px"
                    fontWeight="bold"
                    fill="#374151"
                >
                    {t('accuracy')}
                </text>

                {/* X Axis */}
                <line x1={margin.left} y1={margin.top + innerHeight} x2={margin.left + innerWidth} y2={margin.top + innerHeight} stroke="#9ca3af" strokeWidth="1" />
                {xTicks.map(tick => (
                     <g key={`x-tick-${tick}`} className="tick">
                         <line x1={xScale(tick)} y1={margin.top + innerHeight} x2={xScale(tick)} y2={margin.top + innerHeight + 5} stroke="#9ca3af" strokeWidth="1" />
                         <text
                             x={xScale(tick)}
                             y={margin.top + innerHeight + 18}
                             textAnchor="middle"
                             fontSize="10px"
                             fill="#4b5563"
                         >
                            {`${tick.toFixed(tick < 10 ? 1 : 0)}:1`}
                         </text>
                     </g>
                ))}
                <text
                    x={margin.left + innerWidth / 2}
                    y={height - 10}
                    textAnchor="middle"
                    fontSize="12px"
                    fontWeight="bold"
                    fill="#374151"
                >
                    {t('turndownRatio')}
                </text>
            </g>

            <g className="chart-content">
                {/* Grid lines */}
                {yTicks.slice(1).map(tick => (
                    <line key={`y-grid-${tick}`} x1={margin.left} y1={yScale(tick)} x2={margin.left + innerWidth} y2={yScale(tick)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                ))}
                 {xTicks.slice(1).map(tick => (
                    <line key={`x-grid-${tick}`} x1={xScale(tick)} y1={margin.top} x2={xScale(tick)} y2={margin.top + innerHeight} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />
                ))}

                {/* Chart Line */}
                {pathData && (
                    <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" />
                )}

                {/* Current Point */}
                {currentRatio !== null && currentAccuracy !== null && xScale(currentRatio) >= margin.left && (
                    <g>
                        <circle cx={xScale(currentRatio)} cy={yScale(currentAccuracy)} r="4" fill="#ef4444" stroke="white" strokeWidth="1" />
                        <text
                            x={xScale(currentRatio)}
                            y={yScale(currentAccuracy) - 8}
                            textAnchor="middle"
                            fontSize="10px"
                            fontWeight="bold"
                            fill="#ef4444"
                        >
                            {`(${(currentRatio).toFixed(1)}:1, ${(currentAccuracy * 100).toFixed(2)}%)`}
                        </text>
                    </g>
                )}
            </g>
        </svg>
    );
};
