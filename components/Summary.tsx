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
        
        const logoUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAoALADASIAAhEBAxEB/8QAGwABAQACAwEAAAAAAAAAAAAAAAYDBwECBAX/xAAwEAABAwIEBAQEBwAAAAAAAAABAgMEBREABgcSITFBUQgTImEVFjJCcYGRobHB0f/EABkBAQADAQEAAAAAAAAAAAAAAAABAgMEBf/EACERAQABAwQCAwAAAAAAAAAAAAABAgMREiExQVEEE2Fx/9oADAMBAAIRAxEAPwD2OMYxgDGxjAGNjGAMbGMAdsY1gCMeR+IuPXuGOHhWKbSmas+uUzFS047ykhSybk2O4A7bn5GuA/8AmHU//paB+oO//wCq7I4+rz+TTDjX1/f9I8sH+M+qS8x2n9PUMY8s/8AmLU+3wNA/UHf/wDU8l+L2Vcf5LDo0rKcjoFHYfUtEhurLhWpNrpsmOu1tx33rbFwc+c1w5V9Ixx15cK+p6ljYxjmXMbGMAdsYxgDGxjAGNjGAPk3xF8RarwHxTQMuYy6NVWZ8NEpTjj6mykrdcbta3+E3+Zrwz/n/AFb/AOhKf9Qc/wDlT3bPsgyvPqezT84y+lV2M0suttzGEuhCiCAoBQIBAJG3cjvXE/wDD/hD/AOyWRfp7f8V3Y/F4kY8VWPP6vLycLO5zGpHj3/P6rf/oSj/UHP8A5U2/DPjzVOPk1iROy6NSY9MW0hKmX1OFZWFK3uBtnb4mvQv+H/AAh/9ksj/T2/4rocl5JlWSsPsZNl1IojL5CnG4MVDAVa9iQlIBIvtfY1lmcXh+HNVXy+i+Hgzp5zVH1xjYxjyHoY2MYA7YxjAGNjGAMbGMAdsYxgB2xjGAIuYV+lZVSZNWrc5iDBjJK3XnlBKUgC5O5/meK+KPirmnH2tU3hHglUhNPmvoZflNBQVLJJFrj+VgG6jvfbYAm1x/GHj/VeP+IVcN8IVKSjK2nCy9JiqKVTiDZZCiPyN9AbWURe9gBXrHg/wCAuV8D5bHq9Xis1bOKg2FvzXkBfklQBCGiRZI33FlG5uQLC1mZ1T5fU/0/k9XwS4VpfCXDlLynT2h4UdoKccP+o+s3W4fmpRJ+gAFgK38YxzltsbGMAbGMAbGMAY2MYA//2Q==';

        const addContent = (imgData: string) => {
            doc.addImage(imgData, 'JPEG', 15, 10, 50, 10); // x, y, w, h

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

        // Directly use the data URI. jsPDF can handle it without needing an Image object.
        // This avoids potential browser issues with loading data URIs into images.
        try {
            addContent(logoUrl);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("An error occurred while generating the PDF. Please try again.");
        }
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