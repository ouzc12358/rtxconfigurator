
import React, { useMemo, useState } from 'react';
import type { ProductModel, Selections, Option } from '../types';

interface SummaryProps {
    model: ProductModel;
    selections: Selections;
    tag: string;
    onTagChange: (tag: string) => void;
    customRange: { low: string; high: string };
    onCustomRangeChange: (range: { low: string; high: string }) => void;
}

const generateTransmitterModelNumber = (
    model: ProductModel,
    selections: Selections,
    customRange: { low: string; high: string },
    selectedRangeOption: Option | undefined,
    isCustomRangeSet: boolean
): [string, string, string, string] => {
    const requiredSelections = model.configuration
        .filter(c => c.part === 'required')
        .map(c => selections[c.id] || '')
        .join('');

    const additionalSelections = model.configuration
        .filter(c => c.part === 'additional')
        .map(c => selections[c.id] || '')
        .join('');

    const line1 = `${model.baseCode}${requiredSelections}`;
    const line2 = additionalSelections;

    let line3 = "Select pressure range to calibrate";
    if (selectedRangeOption) {
        if (isCustomRangeSet) {
            line3 = `${customRange.low} ~ ${customRange.high} ${selectedRangeOption.unit}`;
        } else {
            line3 = selectedRangeOption.description;
        }
    }
    
    const line4 = "Special requests..."; 

    return [line1, line2, line3, line4];
};

const getManifoldTypeCode = (selectionCode: string | undefined): string => {
    if (!selectionCode) return '';
    if (['V1', 'V2'].includes(selectionCode)) return 'V2';
    if (['V3', 'V4'].includes(selectionCode)) return 'V3';
    if (['V5', 'V6'].includes(selectionCode)) return 'V5';
    return '';
};

const generateManifoldModelNumber = (model: ProductModel, selections: Selections): string | null => {
    const manifoldSelection = selections.manifold;
    if (!manifoldSelection || manifoldSelection === 'VN') return null;

    const manifoldTypeCode = getManifoldTypeCode(manifoldSelection);

    const orderedManifoldPartIds = [
        'manifold_processConnection', 'manifold_material', 'manifold_transmitterConnection',
        'manifold_mountingBolts', 'manifold_pressureRating', 'manifold_sealType',
        'manifold_temperature', 'manifold_plug', 'manifold_additional'
    ];
    
    const manifoldParts = orderedManifoldPartIds.map(id => selections[id] || '').join('');

    return `SS2000-${manifoldTypeCode}${manifoldParts}`;
};


export const Summary: React.FC<SummaryProps> = ({ model, selections, tag, onTagChange, customRange, onCustomRangeChange }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    const { 
        transmitterModelLines, 
        manifoldModelNumber, 
        fullConfigText,
        rangeError,
        selectedRangeOption,
        isCustomRangeValidAndSet,
        selectedOptionsList
    } = useMemo(() => {
        const pressureRangeCategory = model.configuration.find(c => c.id === 'pressureRange');
        const selectedPressureRangeCode = selections.pressureRange;
        const selectedRangeOption = pressureRangeCategory?.options.find(o => o.code === selectedPressureRangeCode);

        let error: string | null = null;
        let isCustomRangeValidAndSet = false;

        if (selectedRangeOption) {
            if (customRange.low || customRange.high) {
                const low = parseFloat(customRange.low);
                const high = parseFloat(customRange.high);
                const lowIsNum = !isNaN(low);
                const highIsNum = !isNaN(high);
                
                if (customRange.low && customRange.high && lowIsNum && highIsNum) {
                    if (low >= high) {
                        error = "Low value must be less than high value.";
                    } else if (low < selectedRangeOption.min! || high > selectedRangeOption.max!) {
                        error = `Range must be within ${selectedRangeOption.min} to ${selectedRangeOption.max} ${selectedRangeOption.unit}.`;
                    }
                } else if ((customRange.low && !lowIsNum) || (customRange.high && !highIsNum)) {
                    error = "Range values must be numbers.";
                }
            }
        }
    
        if (selectedRangeOption && customRange.low && customRange.high && !error) {
            isCustomRangeValidAndSet = true;
        }

        const transmitterLines = generateTransmitterModelNumber(model, selections, customRange, selectedRangeOption, isCustomRangeValidAndSet);
        const manifoldNumber = generateManifoldModelNumber(model, selections);
        
        const selectedOptionsList = model.configuration
            .map(category => {
                const selectedCode = selections[category.id];
                if (!selectedCode) return null;
                const option = category.options.find(o => o.code === selectedCode);
                return option ? {
                    category: category.title,
                    code: option.code,
                    description: option.description
                } : null;
            })
            .filter((item): item is { category: string; code: string; description: string; } => item !== null);

        const configDetails: string[] = [`Model: ${model.name}`];
        if (tag) {
            configDetails.push(`Tag Number: ${tag}`);
        }
        configDetails.push("\n--- Transmitter Model Number ---");
        configDetails.push(`Line 1: ${transmitterLines[0]}`);
        configDetails.push(`Line 2: ${transmitterLines[1]}`);
        const line3Label = isCustomRangeValidAndSet ? 'Calibrated Range' : 'Selected Range';
        configDetails.push(`Line 3 (${line3Label}): ${transmitterLines[2]}`);
        configDetails.push(`Line 4 (Example Request): ${transmitterLines[3]}`);

        if (manifoldNumber) {
            configDetails.push("\n--- Valve Manifold Model Number ---");
            configDetails.push(manifoldNumber);
        }
        
        configDetails.push("\n--- Configuration Details ---");
        
        selectedOptionsList.forEach(item => {
            configDetails.push(`${item.category}: ${item.description} (${item.code})`);
        });

        if (isCustomRangeValidAndSet) {
            configDetails.push(`Custom Range: ${customRange.low} to ${customRange.high} ${selectedRangeOption?.unit}`);
        }

        return {
            transmitterModelLines: transmitterLines,
            manifoldModelNumber: manifoldNumber,
            fullConfigText: configDetails.join('\n'),
            rangeError: error,
            selectedRangeOption: selectedRangeOption,
            isCustomRangeValidAndSet: isCustomRangeValidAndSet,
            selectedOptionsList
        };

    }, [model, selections, tag, customRange]);

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(fullConfigText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleExportToFile = () => {
        const exportData = {
            productModel: model.name,
            tagNumber: tag || 'N/A',
            modelNumber: {
                transmitter: {
                    line1: transmitterModelLines[0],
                    line2: transmitterModelLines[1],
                    line3: `(${isCustomRangeValidAndSet ? 'Calibrated' : 'Selected'} Range): ${transmitterModelLines[2]}`,
                    line4: `(Example Request): ${transmitterModelLines[3]}`,
                },
                manifold: manifoldModelNumber || 'N/A',
            },
            customCalibration: isCustomRangeValidAndSet ? {
                low: customRange.low,
                high: customRange.high,
                unit: selectedRangeOption?.unit || '',
            } : 'N/A',
            selectedOptions: selectedOptionsList,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        link.download = `${model.name.replace(/\s/g, '_')}_Configuration_${date}.json`;
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">Configuration Summary</h2>
            
            <div className="mb-4">
                <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700 mb-1">Tag Number (Optional)</label>
                <input
                    id="tag-input"
                    type="text"
                    value={tag}
                    onChange={(e) => onTagChange(e.target.value)}
                    placeholder="e.g., PT-101"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {selectedRangeOption && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Calibration Range ({selectedRangeOption.unit})
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            value={customRange.low}
                            onChange={(e) => onCustomRangeChange({ ...customRange, low: e.target.value })}
                            placeholder={`Low (Min: ${selectedRangeOption.min})`}
                            className={`w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${rangeError ? 'border-red-500' : 'border-gray-300'}`}
                            aria-invalid={!!rangeError}
                            aria-describedby="range-error"
                        />
                        <span className="text-gray-500 font-semibold">to</span>
                        <input
                            type="number"
                            value={customRange.high}
                            onChange={(e) => onCustomRangeChange({ ...customRange, high: e.target.value })}
                            placeholder={`High (Max: ${selectedRangeOption.max})`}
                            className={`w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${rangeError ? 'border-red-500' : 'border-gray-300'}`}
                            aria-invalid={!!rangeError}
                            aria-describedby="range-error"
                        />
                    </div>
                    {rangeError && <p id="range-error" className="text-xs text-red-600 mt-1">{rangeError}</p>}
                </div>
            )}

            <div className="bg-gray-100 p-4 rounded-md mb-4 font-mono text-sm text-gray-800 space-y-1">
                 <p className="font-semibold text-gray-600">Transmitter Model:</p>
                <p><span className="font-semibold text-gray-500">Line 1:</span> {transmitterModelLines[0]}</p>
                <p><span className="font-semibold text-gray-500">Line 2:</span> {transmitterModelLines[1]}</p>
                <p className="text-xs text-gray-500">
                    Line 3 ({isCustomRangeValidAndSet ? 'Calibrated' : 'Selected'} Range): {transmitterModelLines[2]}
                </p>
                <p className="text-xs text-gray-500">Line 4: {transmitterModelLines[3]}</p>
            </div>
            
            {manifoldModelNumber && (
                 <div className="bg-gray-100 p-4 rounded-md mb-4 font-mono text-sm text-gray-800">
                    <p className="font-semibold text-gray-600">Valve Manifold Model:</p>
                    <p>{manifoldModelNumber}</p>
                </div>
            )}

            <div className="border-t pt-4">
                <h3 className="font-semibold text-md text-gray-700 mb-2">Selected Options:</h3>
                <ul className="space-y-1 text-sm text-gray-600 max-h-60 overflow-y-auto">
                     {selectedOptionsList.map(option => (
                        <li key={option.category} className="flex justify-between">
                            <span className="font-medium">{option.category}:</span>
                            <span className="text-right">{option.description}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    onClick={handleCopyToClipboard}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    aria-label="Copy configuration to clipboard"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                 <button
                    onClick={handleExportToFile}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    aria-label="Export configuration to a JSON file"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export to File
                </button>
            </div>
        </div>
    );
};
