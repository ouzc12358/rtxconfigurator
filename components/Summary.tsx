import React, { useMemo, useState } from 'react';
import type { ProductModel, Selections, Option } from '../types';

interface SummaryProps {
    model: ProductModel;
    selections: Selections;
    tag: string;
    onTagChange: (tag: string) => void;
    customRange: { low: string; high: string };
    onCustomRangeChange: (range: { low: string; high: string }) => void;
    specialRequest: string;
    onSpecialRequestChange: (request: string) => void;
}

const generateTransmitterModelNumber = (
    model: ProductModel,
    selections: Selections,
    customRange: { low: string; high: string },
    selectedRangeOption: Option | undefined,
    isCustomRangeSet: boolean,
    specialRequest: string
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
    
    const line4 = specialRequest; 

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


export const Summary: React.FC<SummaryProps> = ({ model, selections, tag, onTagChange, customRange, onCustomRangeChange, specialRequest, onSpecialRequestChange }) => {
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

        const transmitterLines = generateTransmitterModelNumber(model, selections, customRange, selectedRangeOption, isCustomRangeValidAndSet, specialRequest);
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
        if (transmitterLines[3]) {
            configDetails.push(`Line 4 (Special Requests): ${transmitterLines[3]}`);
        }

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

    }, [model, selections, tag, customRange, specialRequest]);

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
                    line4: `(Special Requests): ${transmitterModelLines[3]}`,
                },
                manifold: manifoldModelNumber || 'N/A',
            },
            customCalibration: isCustomRangeValidAndSet ? {
                low: customRange.low,
                high: customRange.high,
                unit: selectedRangeOption?.unit || '',
            } : 'N/A',
            specialRequest: specialRequest || 'N/A',
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

    const handleExportToPdf = () => {
        // @ts-ignore - jspdf is loaded from CDN
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert('PDF generation library is not loaded. Please try again.');
            return;
        }

        const doc = new jsPDF();
        
        // FIX: Replaced remote URL with a Base64 data URI to prevent CORS errors.
        const logoUrl = 'data:image/jpeg;base64,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';

        const addContent = (imgData?: string) => {
            if (imgData) {
                doc.addImage(imgData, 'JPEG', 15, 10, 50, 8); // x, y, w, h
            }

            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('Druck RTX2000 Series Configuration', 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 195, 28, { align: 'right' });

            let y = 40;
            const lineSpacing = 6;
            const sectionSpacing = 10;
            const pageMargin = 15;
            const contentWidth = doc.internal.pageSize.getWidth() - (pageMargin * 2);
            const keyX = pageMargin;
            const valueX = 75;

            const checkPageBreak = () => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
            };
            
            const addSectionHeader = (text: string) => {
                checkPageBreak();
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(text, keyX, y);
                y += lineSpacing + 2;
            };

            const addKeyValue = (key: string, value: string) => {
                checkPageBreak();
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text(key, keyX, y);
                doc.setFont(undefined, 'normal');
                const splitValue = doc.splitTextToSize(value, contentWidth - (valueX - keyX));
                doc.text(splitValue, valueX, y);
                y += splitValue.length * 5; // Adjust y based on number of lines
                y += 2; // Extra padding
            };
            
            addSectionHeader('Configuration Summary');
            addKeyValue('Product Model:', model.name);
            if (tag) addKeyValue('Tag Number:', tag);
            y += sectionSpacing / 2;
            
            addSectionHeader('Transmitter Model Number');
            addKeyValue('Line 1:', transmitterModelLines[0]);
            addKeyValue('Line 2:', transmitterModelLines[1]);
            addKeyValue(`Line 3 (${isCustomRangeValidAndSet ? 'Calibrated' : 'Selected'} Range):`, transmitterModelLines[2]);
            if (specialRequest) addKeyValue('Line 4 (Special Requests):', specialRequest);
            y += sectionSpacing / 2;

            if (manifoldModelNumber) {
                addSectionHeader('Valve Manifold Model Number');
                addKeyValue('Full Code:', manifoldModelNumber);
                y += sectionSpacing / 2;
            }
            
            addSectionHeader('Configuration Details');
            selectedOptionsList.forEach(item => {
                addKeyValue(`${item.category}:`, `${item.description} (${item.code})`);
            });

            if (isCustomRangeValidAndSet) {
                 addKeyValue('Custom Range:', `${customRange.low} to ${customRange.high} ${selectedRangeOption?.unit}`);
            }

            const date = new Date().toISOString().split('T')[0];
            doc.save(`${model.name.replace(/\s/g, '_')}_Configuration_${date}.pdf`);
        };

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            // FIX: Replaced `this` with the `img` variable from the closure. TypeScript incorrectly
            // types `this` as `GlobalEventHandlers` within an `onload` handler, causing type errors.
            // Using the explicitly declared `img` (HTMLImageElement) resolves this.
            const scaleX = img.naturalWidth / img.naturalWidth;
            const scaleY = img.naturalHeight / img.naturalHeight;
            const scale = Math.min(scaleX, scaleY);
            canvas.width = img.naturalWidth / scale;
            canvas.height = img.naturalHeight / scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataURL = canvas.toDataURL('image/jpeg');
                addContent(dataURL);
            } else {
                 addContent();
            }
        };
        img.onerror = function() {
            console.error("Could not load logo for PDF. Proceeding without it.");
            addContent(); // Proceed without the logo
        };
        img.src = logoUrl;
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
            
            <div className="mb-4">
                <label htmlFor="special-request-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Line 4: Special Requests (Optional)
                </label>
                <textarea
                    id="special-request-input"
                    rows={2}
                    value={specialRequest}
                    onChange={(e) => onSpecialRequestChange(e.target.value)}
                    placeholder="e.g., Special calibration points, documentation..."
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="bg-gray-100 p-4 rounded-md mb-4 font-mono text-sm text-gray-800 space-y-1">
                 <p className="font-semibold text-gray-600">Transmitter Model:</p>
                <p><span className="font-semibold text-gray-500">Line 1:</span> {transmitterModelLines[0]}</p>
                <p><span className="font-semibold text-gray-500">Line 2:</span> {transmitterModelLines[1]}</p>
                <p className="text-xs text-gray-500">
                    Line 3 ({isCustomRangeValidAndSet ? 'Calibrated' : 'Selected'} Range): {transmitterModelLines[2]}
                </p>
                {transmitterModelLines[3] && <p className="text-xs text-gray-500">Line 4: {transmitterModelLines[3]}</p>}
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
                    Export JSON
                </button>
            </div>
             <div className="mt-3">
                 <button
                    onClick={handleExportToPdf}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    aria-label="Export configuration to a PDF file"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 0a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2H4zm0 1h12a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z"/>
                        <path d="M6 8v9h2V8H6zm4 0v9h2V8h-2zm4 0v9h2V8h-2zM6 4h8v2H6V4z"/>
                    </svg>
                    Export to PDF
                </button>
            </div>
        </div>
    );
};