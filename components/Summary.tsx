
import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { ProductModel, Selections, Option, PerformanceResult, PerformanceSpec } from '../types';
import { uiTranslations } from '../data/translations';
import { getTranslatedProductData } from '../data/i18n';
import { calculatePerformanceSpecs, getAccuracyFunction } from '../data/productData';
import { AccuracyChart } from './AccuracyChart';

interface SummaryProps {
    model: ProductModel;
    selections: Selections;
    tag: string;
    onTagChange: (tag: string) => void;
    customRange: { low: string; high: string };
    onCustomRangeChange: (range: { low: string; high: string }) => void;
    specialRequest: string;
    onSpecialRequestChange: (request: string) => void;
    onCalculatePerformance: () => void;
    performanceResult: PerformanceResult | null;
    t: (key: keyof typeof uiTranslations.en) => string;
}

const generateTransmitterModelNumber = (
    model: ProductModel,
    selections: Selections,
    customRange: { low: string; high: string },
    selectedRangeOption: Option | undefined,
    isCustomRangeSet: boolean,
    specialRequest: string,
    t: (key: keyof typeof uiTranslations.en) => string,
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

    let line3 = t('pdf_selectPressureRange');
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


export const Summary: React.FC<SummaryProps> = ({ model, selections, tag, onTagChange, customRange, onCustomRangeChange, specialRequest, onSpecialRequestChange, onCalculatePerformance, performanceResult, t }) => {
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
                        error = t('rangeError_lowHigh');
                    } else if (low < selectedRangeOption.min! || high > selectedRangeOption.max!) {
                        error = t('rangeError_minMax').replace('{min}', selectedRangeOption.min!.toString()).replace('{max}', selectedRangeOption.max!.toString()).replace('{unit}', selectedRangeOption.unit!);
                    }
                } else if ((customRange.low && !lowIsNum) || (customRange.high && !highIsNum)) {
                    error = t('rangeError_number');
                }
            }
        }
    
        if (selectedRangeOption && customRange.low && customRange.high && !error) {
            isCustomRangeValidAndSet = true;
        }

        const transmitterLines = generateTransmitterModelNumber(model, selections, customRange, selectedRangeOption, isCustomRangeValidAndSet, specialRequest, t);
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

        const configDetails: string[] = [`${t('pdf_model')}: ${model.name}`];
        if (tag) {
            configDetails.push(`${t('pdf_tagNumber')}: ${tag}`);
        }
        configDetails.push(`\n--- ${t('pdf_transmitterTitle')} ---`);
        configDetails.push(`${t('pdf_line1')}: ${transmitterLines[0]}`);
        configDetails.push(`${t('pdf_line2')}: ${transmitterLines[1]}`);
        const line3Label = isCustomRangeValidAndSet ? t('calibratedRange') : t('selectedRange');
        configDetails.push(`${t('pdf_line3')} (${line3Label}): ${transmitterLines[2]}`);
        if (transmitterLines[3]) {
            configDetails.push(`${t('pdf_line4')} (${t('specialRequestsLabel')}): ${transmitterLines[3]}`);
        }

        if (manifoldNumber) {
            configDetails.push(`\n--- ${t('pdf_manifoldTitle')} ---`);
            configDetails.push(manifoldNumber);
        }
        
        configDetails.push(`\n--- ${t('pdf_configDetailsTitle')} ---`);
        
        selectedOptionsList.forEach(item => {
            configDetails.push(`${item.category}: ${item.description} (${item.code})`);
        });

        if (isCustomRangeValidAndSet) {
            configDetails.push(`${t('customRangeLabel')}: ${customRange.low} to ${customRange.high} ${selectedRangeOption?.unit}`);
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

    }, [model, selections, tag, customRange, specialRequest, t]);

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
                    line3: `(${isCustomRangeValidAndSet ? t('calibratedRange') : t('selectedRange')}): ${transmitterModelLines[2]}`,
                    line4: `(${t('specialRequestsLabel')}): ${transmitterModelLines[3]}`,
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
            performanceReport: performanceResult ? {
                calibrationRange: `${performanceResult.userRange.low} to ${performanceResult.userRange.high} ${performanceResult.rangeOption?.unit}`,
                turndownRatio: performanceResult.ratio ? `${performanceResult.ratio.toFixed(2)}:1` : 'N/A',
                specifications: (Object.values(performanceResult.specs) as PerformanceSpec[]).map(s => ({ [s.name]: s.value }))
            } : 'N/A'
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

    const handleExportToPdf = async () => {
        // @ts-ignore - jspdf is loaded from CDN
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert(t('alert_pdfLibraryNotLoaded'));
            return;
        }
    
        const doc = new jsPDF();
    
        // --- English-only setup ---
        const t_en = (key: keyof typeof uiTranslations.en) => uiTranslations.en[key];
        const enProductModels = getTranslatedProductData('en');
        const enModel = enProductModels.find(m => m.id === model.id);
    
        if (!enModel) {
            alert("Could not find English product data for PDF export.");
            return;
        }
    
        const enSelectedOptionsList = enModel.configuration
            .map(category => {
                const selectedCode = selections[category.id];
                if (!selectedCode) return null;
                const option = category.options.find(o => o.code === selectedCode);
                return option ? { category: category.title, code: option.code, description: option.description } : null;
            })
            .filter((item): item is { category: string; code: string; description: string; } => item !== null);
        
        const enRangeOption = enModel.configuration.find(c => c.id === 'pressureRange')?.options.find(o => o.code === selections.pressureRange);
        
        const [enLine1, enLine2, enLine3, enLine4] = generateTransmitterModelNumber(enModel, selections, customRange, enRangeOption, isCustomRangeValidAndSet, specialRequest, t_en);
        const enManifoldNumber = generateManifoldModelNumber(enModel, selections);
    
        // --- PDF Generation Logic ---
        const logoUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAoALADASIAAhEBAxEB/8QAGwABAQACAwEAAAAAAAAAAAAAAAYDBwECBAX/xAAwEAABAwIEBAQEBwAAAAAAAAABAgMEBREABgcSITFBUQgTImEVFjJCcYGRobHB0f/EABkBAQADAQEAAAAAAAAAAAAAAAABAgMEBf/EACERAQABAwQCAwAAAAAAAAAAAAABAgMREiExQVEEE2Fx/9oADAMBAAIRAxEAPwD2OMYxgDGxjAGNjGAMbGMAdsY1gCMeR+IuPXuGOHhWKbSmas+uUzFS047ykhSybk2O4A7bn5GuA/8AmHU//paB+oO//wCq7I4+rz+TTDjX1/f9I8sH+M+qS8x2n9PUMY8s/8AmLU+3wNA/UHf/wCvQ8l+L2Vcf5LDo0rKcjoFHYfUtEhurLhWpNrpsmOu1tx33rbFwc+c1w5V9Ixx15cK+p6ljYxjmXMbGMAdsYxgDGxjAGNjGAMbGMAdsYxgB2xjGAIuYV+lZVSZNWrc5iDBjJK3XnlBKUgC5O5/meK+KPirmnH2tU3hHglUhNPmvoZflNBQVLJJFrj+VgG6jvfbYAm1x/GHj/VeP+IVcN8IVKSjK2nCy9JiqKVTiDZZCiPyN9AbWURe9gBXrHg/wCAuV8D5bHq9Xis1bOKg2FvzXkBfklQBCGiRZI33FlG5uQLC1mZ1T5fU/0/k9XwS4VpfCXDlLynT2h4UdoKccP+o+s3W4fmpRJ+gAFgK38YxzltsbGMAbGMAbGMAY2MYA//2Q==';
    
        doc.addImage(logoUrl, 'JPEG', 15, 10, 50, 10);
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(t_en('pdf_reportTitle'), 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`${t_en('pdf_date')}: ${new Date().toLocaleDateString()}`, 195, 28, { align: 'right' });

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
            if (!value) return;
            checkPageBreak();
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(key, keyX, y);
            doc.setFont(undefined, 'normal');
            const splitValue = doc.splitTextToSize(value, contentWidth - (valueX - keyX));
            doc.text(splitValue, valueX, y);
            y += splitValue.length * 5 + 2;
        };
        
        addSectionHeader(t_en('summaryTitle'));
        addKeyValue(`${t_en('pdf_model')}:`, enModel.name);
        if (tag) addKeyValue(`${t_en('pdf_tagNumber')}:`, tag);
        y += sectionSpacing / 2;
        
        addSectionHeader(t_en('pdf_transmitterTitle'));
        addKeyValue(`${t_en('pdf_line1')}:`, enLine1);
        addKeyValue(`${t_en('pdf_line2')}:`, enLine2);
        addKeyValue(`${t_en('pdf_line3')} (${isCustomRangeValidAndSet ? t_en('calibratedRange') : t_en('selectedRange')}):`, enLine3);
        if (specialRequest) addKeyValue(`${t_en('pdf_line4')} (${t_en('specialRequestsLabel')}):`, specialRequest);
        y += sectionSpacing / 2;

        if (enManifoldNumber) {
            addSectionHeader(t_en('pdf_manifoldTitle'));
            addKeyValue(t_en('pdf_fullCode'), enManifoldNumber);
            y += sectionSpacing / 2;
        }
        
        addSectionHeader(t_en('pdf_configDetailsTitle'));
        enSelectedOptionsList.forEach(item => {
            addKeyValue(`${item.category}:`, `${item.description} (${item.code})`);
        });

        if (isCustomRangeValidAndSet) {
             addKeyValue(`${t_en('customRangeLabel')}:`, `${customRange.low} to ${customRange.high} ${enRangeOption?.unit}`);
        }

        // --- Add Performance Report Section (always in English) ---
        if (performanceResult) {
            // Force a new page for the performance report for better layout
            doc.addPage();
            y = 20;
            
            addSectionHeader(t_en('performanceReportTitle'));
            
            // Create a hidden container to render the chart for conversion
            const chartContainer = document.createElement('div');
            chartContainer.style.position = 'absolute';
            chartContainer.style.left = '-9999px'; // Position off-screen
            document.body.appendChild(chartContainer);

            let chartImageData: string | null = null;
            try {
                 chartImageData = await new Promise((resolve, reject) => {
                    const accuracyData = getAccuracyFunction(enModel.id, selections.pressureRange || '');
                    
                    const enRangeOpt = enModel.configuration.find(c => c.id === 'pressureRange')?.options.find(o => o.code === selections.pressureRange);
                    const maxSpan = (enRangeOpt?.max ?? 0) - (enRangeOpt?.min ?? 0);
                    const minSpan = enRangeOpt?.minSpan ?? 1;
                    let maxRatio = minSpan > 0 ? maxSpan / minSpan : 1;
                    const accuracyDataForMaxRatio = getAccuracyFunction(enModel.id, selections.pressureRange || '');
                    maxRatio = Math.min(maxRatio, accuracyDataForMaxRatio?.maxRatio ?? Infinity);


                    const chartRoot = ReactDOM.createRoot(chartContainer);
                    chartRoot.render(
                        <AccuracyChart
                            accuracyFunction={accuracyData?.func ?? null}
                            currentRatio={performanceResult.ratio}
                            currentAccuracy={performanceResult.specs.accuracy.accuracyValue ?? null}
                            maxRatio={maxRatio}
                            t={t_en}
                        />
                    );

                    setTimeout(() => {
                        const svgElement = chartContainer.querySelector('svg');
                        if (!svgElement) {
                            return reject('Could not find SVG element for chart.');
                        }
                        const svgString = new XMLSerializer().serializeToString(svgElement);
                        const canvas = document.createElement('canvas');
                        
                        // Use intrinsic SVG dimensions for better quality
                        canvas.width = svgElement.width.baseVal.value * 2; // Render at 2x for better resolution
                        canvas.height = svgElement.height.baseVal.value * 2;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                             return reject('Could not get canvas context.');
                        }
                        ctx.scale(2, 2);

                        const img = new Image();
                        img.onload = () => {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        };
                        img.onerror = () => reject('Error loading SVG as image for PDF conversion.');
                        img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
                    }, 200); // Small delay to ensure SVG has rendered
                });
            } catch (error) {
                console.error("PDF Chart Generation Error:", error);
                alert(t_en('alert_pdfGenerationError'));
            } finally {
                document.body.removeChild(chartContainer);
            }
            
            if (chartImageData) {
                const imgProps = doc.getImageProperties(chartImageData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const imgWidth = pdfWidth - pageMargin * 2 - 40; // Smaller width for better layout
                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                doc.addImage(chartImageData, 'PNG', pageMargin + 20, y, imgWidth, imgHeight);
                y += imgHeight + 8;
            }


            const { ratio, userRange } = performanceResult;
            const enPerformanceSpecs = calculatePerformanceSpecs(enModel, selections, ratio, t_en);
            const enPerfRangeOption = enModel.configuration.find(c => c.id === 'pressureRange')?.options.find(o => o.code === selections.pressureRange);

            addKeyValue(t_en('enterCalibrationRange'), `${userRange.low} to ${userRange.high} ${enPerfRangeOption?.unit || ''}`);
            if (ratio) addKeyValue(t_en('turndownRatio'), `${ratio.toFixed(2)}:1`);
            
            y += sectionSpacing / 2;
            
            doc.setFont(undefined, 'bold');
            doc.text(t_en('parameter'), keyX, y);
            doc.text(t_en('performance'), valueX, y);
            y += lineSpacing;
            doc.line(keyX, y - (lineSpacing / 2), contentWidth + keyX, y - (lineSpacing / 2));

            (Object.values(enPerformanceSpecs) as PerformanceSpec[]).forEach(spec => {
                addKeyValue(spec.name, spec.value);
            });
        }

        const date = new Date().toISOString().split('T')[0];
        doc.save(`${model.name.replace(/\s/g, '_')}_Configuration_${date}.pdf`);
    };


    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">{t('summaryTitle')}</h2>
            
            <div className="mb-4">
                <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700 mb-1">{t('tagNumberLabel')}</label>
                <input
                    id="tag-input"
                    type="text"
                    value={tag}
                    onChange={(e) => onTagChange(e.target.value)}
                    placeholder={t('tagNumberPlaceholder')}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {selectedRangeOption && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('customRangeLabel')} ({selectedRangeOption.unit})
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="number"
                            value={customRange.low}
                            onChange={(e) => onCustomRangeChange({ ...customRange, low: e.target.value })}
                            placeholder={`${t('lowPlaceholder')} (Min: ${selectedRangeOption.min})`}
                            className={`w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${rangeError ? 'border-red-500' : 'border-gray-300'}`}
                            aria-invalid={!!rangeError}
                            aria-describedby="range-error"
                        />
                        <span className="text-gray-500 font-semibold">{t('to')}</span>
                        <input
                            type="number"
                            value={customRange.high}
                            onChange={(e) => onCustomRangeChange({ ...customRange, high: e.target.value })}
                            placeholder={`${t('highPlaceholder')} (Max: ${selectedRangeOption.max})`}
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
                    {t('line4Label')}
                </label>
                <textarea
                    id="special-request-input"
                    rows={2}
                    value={specialRequest}
                    onChange={(e) => onSpecialRequestChange(e.target.value)}
                    placeholder={t('specialRequestsPlaceholder')}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="bg-gray-100 p-4 rounded-md mb-4 font-mono text-sm text-gray-800 space-y-1">
                 <p className="font-semibold text-gray-600">{t('transmitterModelLabel')}:</p>
                <p><span className="font-semibold text-gray-500">{t('pdf_line1')}:</span> {transmitterModelLines[0]}</p>
                <p><span className="font-semibold text-gray-500">{t('pdf_line2')}:</span> {transmitterModelLines[1]}</p>
                <p className="text-xs text-gray-500">
                    {t('pdf_line3')} ({isCustomRangeValidAndSet ? t('calibratedRange') : t('selectedRange')}): {transmitterModelLines[2]}
                </p>
                {transmitterModelLines[3] && <p className="text-xs text-gray-500">{t('pdf_line4')}: {transmitterModelLines[3]}</p>}
            </div>
            
            {manifoldModelNumber && (
                 <div className="bg-gray-100 p-4 rounded-md mb-4 font-mono text-sm text-gray-800">
                    <p className="font-semibold text-gray-600">{t('manifoldModelLabel')}:</p>
                    <p>{manifoldModelNumber}</p>
                </div>
            )}

            <div className="border-t pt-4">
                <h3 className="font-semibold text-md text-gray-700 mb-2">{t('selectedOptionsLabel')}:</h3>
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
                    aria-label={t('copyAriaLabel')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {isCopied ? t('copied') : t('copy')}
                </button>
                 <button
                    onClick={handleExportToFile}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    aria-label={t('exportJsonAriaLabel')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('exportJson')}
                </button>
            </div>
             <div className="mt-3 grid grid-cols-1 gap-3">
                 <button
                    onClick={handleExportToPdf}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    aria-label={t('exportPdfAriaLabel')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 0a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V2a2 2 0 00-2-2H4zm0 1h12a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z"/>
                        <path d="M6 8v9h2V8H6zm4 0v9h2V8h-2zm4 0v9h2V8h-2zM6 4h8v2H6V4z"/>
                    </svg>
                    {t('exportPdf')}
                </button>
                 <button
                    onClick={onCalculatePerformance}
                    disabled={!selections.pressureRange}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('calculatePerformanceAriaLabel')}
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {t('calculatePerformance')}
                </button>
            </div>
        </div>
    );
};
