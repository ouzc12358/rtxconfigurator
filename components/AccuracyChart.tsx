
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
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const { points, yMax } = useMemo(() => {
        if (!accuracyFunction) return { points: [], yMax: 0.1 };
        const dataPoints = [];
        let maxY = 0.04; // Min y-axis value to handle flat lines
        const step = maxRatio > 1 ? (maxRatio - 1) / 100 : 0;
        for (let i = 0; i <= 100; i++) {
            const r = 1 + i * step;
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
        const quarters = [0.25, 0.5, 0.75, 1];
        quarters.forEach(q => {
            ticks.add(Math.round(1 + q * (maxRatio-1)));
        });
        return Array.from(ticks).sort((a,b) => a-b);
    }, [maxRatio]);

    return (
        <svg width={width} height={height} className="max-w-full" xmlns="http://www.w3.org/2000/svg">
            {/* Y Axis */}
            <g className="text-xs text-gray-500">
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerHeight} stroke="currentColor" />
                {[0, 0.25, 0.5, 0.75, 1].map(tick => (
                    <g key={tick}>
                        <text x={margin.left - 8} y={yScale(tick * yMax) + 4} textAnchor="end">{`${(tick * yMax).toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3})}%`}</text>
                        <line x1={margin.left} x2={margin.left - 4} y={yScale(tick * yMax)} stroke="currentColor" />
                    </g>
                ))}
                <text transform={`translate(${margin.left-48}, ${margin.top + innerHeight/2}) rotate(-90)`} textAnchor="middle" className="font-semibold fill-current">{t('accuracy')}</text>
            </g>

            {/* X Axis */}
            <g className="text-xs text-gray-500">
                <line x1={margin.left} y1={margin.top + innerHeight} x2={margin.left + innerWidth} y2={margin.top + innerHeight} stroke="currentColor" />
                {xTicks.map(tick => (
                     <g key={tick}>
                        <text x={xScale(tick)} y={margin.top + innerHeight + 15} textAnchor="middle">{tick}:1</text>
                     </g>
                ))}
                 <text x={margin.left + innerWidth/2} y={margin.top + innerHeight + 35} textAnchor="middle" className="font-semibold fill-current">{t('turndownRatio')}</text>
            </g>

            {/* Chart Line */}
            <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" />

            {/* Current Point */}
            {currentRatio && currentAccuracy !== null && xScale(currentRatio) >= margin.left && (
                <g>
                    <circle cx={xScale(currentRatio)} cy={yScale(currentAccuracy)} r="5" fill="#ef4444" />
                    <line x1={xScale(currentRatio)} x2={xScale(currentRatio)} y1={yScale(currentAccuracy)} y2={margin.top + innerHeight} stroke="#ef4444" strokeDasharray="4 2" />
                    <line x1={margin.left} x2={xScale(currentRatio)} y1={yScale(currentAccuracy)} y2={yScale(currentAccuracy)} stroke="#ef4444" strokeDasharray="4 2" />
                    <text 
                        x={xScale(currentRatio) + (xScale(currentRatio) > innerWidth - 70 ? -8 : 8)} 
                        y={yScale(currentAccuracy) - 8} 
                        className="text-xs font-bold fill-red-600"
                        textAnchor={xScale(currentRatio) > innerWidth - 70 ? "end" : "start"}
                    >
                        {`${currentAccuracy.toFixed(4)}%`}
                    </text>
                </g>
            )}
        </svg>
    );
};
