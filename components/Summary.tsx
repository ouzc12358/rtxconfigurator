import React, { useMemo, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { ProductModel, Selections, Option, PerformanceResult, PerformanceSpec } from '../types';
import { uiTranslations } from '../data/translations';
import { getTranslatedProductData } from '../data/i18n';
import { getAccuracyFunction } from '../data/productData';
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
    t: (key: keyof typeof uiTranslations.en, ...args: any[]) => string;
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

// --- Email Modal Component ---
const EmailModal: React.FC<{
    onClose: () => void;
    onSend: (details: { recipient: string, sender: string, message: string }) => void;
    t: (key: keyof typeof uiTranslations.en) => string;
}> = ({ onClose, onSend, t }) => {
    const [recipient, setRecipient] = useState('');
    const [sender, setSender] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSubmit = () => {
        if (!recipient) {
            setError(t('recipientRequiredError'));
            return;
        }
        if (!validateEmail(recipient)) {
            setError(t('invalidEmailError'));
            return;
        }
        setError('');
        onSend({ recipient, sender, message });
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-modal-title"
        >
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .animate-zoom-in { animation: zoom-in 0.2s ease-out forwards; }
            `}</style>
            <div 
                className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full transform transition-transform animate-zoom-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="email-modal-title" className="text-lg font-bold text-gray-800 flex items-center">
                    {t('emailModalTitle')}
                </h3>
                <div className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700">{t('recipientEmailLabel')}</label>
                        <input
                            type="email"
                            id="recipient-email"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder={t('recipientEmailPlaceholder')}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
                        />
                    </div>
                    <div>
                        <label htmlFor="sender-name" className="block text-sm font-medium text-gray-700">{t('senderNameLabel')}</label>
                        <input
                            type="text"
                            id="sender-name"
                            value={sender}
                            onChange={(e) => setSender(e.target.value)}
                            placeholder={t('senderNamePlaceholder')}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="optional-message" className="block text-sm font-medium text-gray-700">{t('optionalMessageLabel')}</label>
                        <textarea
                            id="optional-message"
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {t('sendEmail')}
                    </button>
                </div>
            </div>
        </div>
    );
};


export const Summary: React.FC<SummaryProps> = ({ model, selections, tag, onTagChange, customRange, onCustomRangeChange, specialRequest, onSpecialRequestChange, onCalculatePerformance, performanceResult, t }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [showPdfConfirm, setShowPdfConfirm] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isEmailModalVisible, setEmailModalVisible] = useState(false);
    const [emailButtonText, setEmailButtonText] = useState(t('emailConfig'));

     useEffect(() => {
        setEmailButtonText(t('emailConfig'));
    }, [t]);
    
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

    const handleSendEmail = ({ recipient, sender, message }: { recipient: string, sender: string, message: string }) => {
        const subject = t('emailSubject', { modelName: model.name });
        let body = '';
        if (message) {
            body += message + '\n\n';
        }
        if (sender) {
            body += t('emailBodyFrom', { senderName: sender }) + '\n\n';
        }
        body += '--- Configuration Details ---\n\n';
        body += fullConfigText;
    
        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        window.location.href = mailtoLink;
    
        setEmailModalVisible(false);
        setEmailButtonText(t('emailSentSuccess'));
        setTimeout(() => {
            setEmailButtonText(t('emailConfig'));
        }, 3000);
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

    const handleExportToPdf = () => {
        setShowPdfConfirm(true);
    };

    const proceedWithPdfExport = async () => {
        setShowPdfConfirm(false);
        setIsGeneratingPdf(true);
        try {
            // @ts-ignore - jspdf is loaded from CDN
            const { jsPDF } = window.jspdf;
            if (!jsPDF) {
                throw new Error(t('alert_pdfLibraryNotLoaded'));
            }
            const doc = new jsPDF();
            
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = { top: 20, right: 20, bottom: 20, left: 20 };
            const innerWidth = pageWidth - margin.left - margin.right;
            let currentY = margin.top;

            // --- PDF Content ---

            // Header
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(t('pdf_reportTitle'), pageWidth / 2, currentY, { align: 'center' });
            currentY += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${t('pdf_date')}: ${new Date().toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
            currentY += 15;

            // General Info
            const addInfoLine = (label: string, value: string) => {
                doc.setFont('helvetica', 'bold');
                doc.text(label, margin.left, currentY);
                doc.setFont('helvetica', 'normal');
                doc.text(value, margin.left + 40, currentY);
                currentY += 7;
            };

            addInfoLine(`${t('pdf_model')}:`, model.name);
            if (tag) addInfoLine(`${t('pdf_tagNumber')}:`, tag);
            currentY += 5;
            
            // Transmitter Details
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(t('pdf_transmitterTitle'), margin.left, currentY);
            currentY += 8;
            doc.setFontSize(10);
            const addModelLine = (label: string, value: string) => {
                 if (!value) return;
                 const fullText = `${label}: ${value}`;
                 const splitText = doc.splitTextToSize(fullText, innerWidth);
                 if (currentY + splitText.length * 6 > pageHeight - margin.bottom) {
                     doc.addPage();
                     currentY = margin.top;
                 }
                 doc.text(splitText, margin.left, currentY);
                 currentY += splitText.length * 6;
            };
            
            addModelLine(t('pdf_line1'), transmitterModelLines[0]);
            addModelLine(t('pdf_line2'), transmitterModelLines[1]);
            const line3Label = isCustomRangeValidAndSet ? t('calibratedRange') : t('selectedRange');
            addModelLine(`${t('pdf_line3')} (${line3Label})`, transmitterModelLines[2]);
            addModelLine(`${t('pdf_line4')} (${t('specialRequestsLabel')})`, transmitterModelLines[3]);
            currentY += 5;

            // Manifold Details
            if (manifoldModelNumber) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(t('pdf_manifoldTitle'), margin.left, currentY);
                currentY += 8;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const splitText = doc.splitTextToSize(manifoldModelNumber, innerWidth);
                doc.text(splitText, margin.left, currentY);
                currentY += splitText.length * 6;
                currentY += 5;
            }

            // Configuration Details
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(t('pdf_configDetailsTitle'), margin.left, currentY);
            currentY += 8;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            const valueColX = pageWidth - margin.right;
            const keyColWidth = innerWidth * 0.45; 
            const valueColWidth = innerWidth * 0.55;

            selectedOptionsList.forEach(item => {
                const keyText = `${item.category}:`;
                const valueText = `${item.description} (${item.code})`;

                const splitKey = doc.splitTextToSize(keyText, keyColWidth);
                const splitValue = doc.splitTextToSize(valueText, valueColWidth);

                const rowLines = Math.max(splitKey.length, splitValue.length);
                const rowHeight = rowLines * 5; // line height

                if (currentY + rowHeight > pageHeight - margin.bottom) {
                    doc.addPage();
                    currentY = margin.top;
                }

                doc.text(splitKey, margin.left, currentY, { baseline: 'top' });
                doc.text(splitValue, valueColX, currentY, { align: 'right', baseline: 'top' });
                
                currentY += rowHeight + 2; // Move to next line with a small gap
            });
            
            // Performance Report
            if (performanceResult) {
                doc.addPage();
                currentY = margin.top;

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(t('performanceReportTitle'), pageWidth / 2, currentY, { align: 'center' });
                currentY += 15;
                
                // Add the chart
                const chartContainer = document.createElement('div');
                chartContainer.style.position = 'absolute';
                chartContainer.style.left = '-9999px';
                chartContainer.style.width = '500px';
                chartContainer.style.height = '300px';
                document.body.appendChild(chartContainer);
                
                const accuracyFunction = getAccuracyFunction(model.id, selections.pressureRange || '');

                const chartElement = React.createElement(AccuracyChart, {
                    accuracyFunction: accuracyFunction?.func ?? null,
                    currentRatio: performanceResult.ratio,
                    currentAccuracy: performanceResult.specs.accuracy.accuracyValue ?? null,
                    maxRatio: performanceResult.maxRatio,
                    t: t
                });

                const root = ReactDOM.createRoot(chartContainer);
                await new Promise<void>(resolve => {
                    root.render(chartElement);
                    setTimeout(resolve, 500); 
                });
                
                const svgElement = chartContainer.querySelector('svg');
                if (svgElement) {
                    const svgString = new XMLSerializer().serializeToString(svgElement);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);
                    
                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => {
                            const scale = 2;
                            canvas.width = svgElement.width.baseVal.value * scale;
                            canvas.height = svgElement.height.baseVal.value * scale;
                            ctx?.scale(scale, scale);
                            ctx?.drawImage(img, 0, 0);
                            URL.revokeObjectURL(url);
                            const pngUrl = canvas.toDataURL('image/png');
                            
                            const chartWidth = innerWidth;
                            const chartHeight = chartWidth * (canvas.height / canvas.width);

                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'bold');
                            doc.text(t('accuracyChartTitle'), margin.left, currentY);
                            currentY += 8;

                            doc.addImage(pngUrl, 'PNG', margin.left, currentY, chartWidth, chartHeight);
                            currentY += chartHeight + 10;
                            resolve();
                        };
                        img.onerror = (e) => {
                            URL.revokeObjectURL(url);
                            console.error("Error loading SVG image for PDF", e);
                            reject(e);
                        }
                        img.src = url;
                    });
                }

                root.unmount();
                document.body.removeChild(chartContainer);
                
                 // Performance Specifications Table
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(t('specificationsTitle'), margin.left, currentY);
                currentY += 8;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');

                const perfData = [
                    { label: t('turndownRatio'), value: performanceResult.ratio ? `${performanceResult.ratio.toPrecision(3)}:1` : 'N/A' },
                    ...(Object.values(performanceResult.specs) as PerformanceSpec[]).map(s => ({ label: s.name, value: s.value })),
                ];

                perfData.forEach(item => {
                    const keyText = `${item.label}:`;
                    const valueText = item.value;
                    const splitKey = doc.splitTextToSize(keyText, keyColWidth);
                    const splitValue = doc.splitTextToSize(valueText, valueColWidth);
                    const rowLines = Math.max(splitKey.length, splitValue.length);
                    const rowHeight = rowLines * 5;

                     if (currentY + rowHeight > pageHeight - margin.bottom) {
                         doc.addPage();
                         currentY = margin.top;
                     }
                    doc.text(splitKey, margin.left, currentY, { baseline: 'top' });
                    doc.text(splitValue, valueColX, currentY, { align: 'right', baseline: 'top' });
                    currentY += rowHeight + 2;
                });
            }

            doc.save(`${model.name.replace(/\s/g, '_')}_Config.pdf`);

        } catch (error) {
            console.error("PDF generation failed:", error);
            alert(t('alert_pdfGenerationError'));
        } finally {
            setIsGeneratingPdf(false);
        }
    };
    

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">{t('summaryTitle')}</h2>

            <div className="space-y-4">
                <div>
                    <label htmlFor="tag-number" className="block text-sm font-medium text-gray-700">{t('tagNumberLabel')}</label>
                    <input
                        type="text"
                        id="tag-number"
                        value={tag}
                        onChange={(e) => onTagChange(e.target.value)}
                        placeholder={t('tagNumberPlaceholder')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label htmlFor="custom-range-low" className="block text-sm font-medium text-gray-700">
                        {t('customRangeLabel')} ({selectedRangeOption?.unit || '...'})
                    </label>
                    <div className="mt-1 flex items-center space-x-2">
                        <input
                            type="number"
                            id="custom-range-low"
                            value={customRange.low}
                            onChange={(e) => onCustomRangeChange({ ...customRange, low: e.target.value })}
                            placeholder={t('lowPlaceholder')}
                            className={`w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${rangeError ? 'border-red-500' : 'border-gray-300'}`}
                            disabled={!selections.pressureRange}
                        />
                        <span className="text-gray-500">{t('to')}</span>
                        <input
                            type="number"
                            id="custom-range-high"
                            value={customRange.high}
                            onChange={(e) => onCustomRangeChange({ ...customRange, high: e.target.value })}
                            placeholder={t('highPlaceholder')}
                            className={`w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${rangeError ? 'border-red-500' : 'border-gray-300'}`}
                            disabled={!selections.pressureRange}
                        />
                    </div>
                     {rangeError && <p className="text-xs text-red-600 mt-1">{rangeError}</p>}
                </div>

                 <div>
                    <label htmlFor="special-requests" className="block text-sm font-medium text-gray-700">{t('line4Label')}</label>
                    <textarea
                        id="special-requests"
                        rows={3}
                        value={specialRequest}
                        onChange={(e) => onSpecialRequestChange(e.target.value)}
                        placeholder={t('specialRequestsPlaceholder')}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="mt-6 pt-4 border-t">
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">{t('transmitterModelLabel')}</h3>
                    <p className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm text-gray-700 whitespace-pre-wrap">{transmitterModelLines.filter(line => line).join('\n')}</p>
                </div>
                {manifoldModelNumber && (
                    <div className="mt-3">
                        <h3 className="text-sm font-semibold text-gray-800">{t('manifoldModelLabel')}</h3>
                        <p className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm text-gray-700">{manifoldModelNumber}</p>
                    </div>
                )}
            </div>

             <div className="mt-6">
                <button 
                    onClick={onCalculatePerformance}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    aria-label={t('calculatePerformanceAriaLabel')}
                    disabled={!selections.pressureRange || !!rangeError || !(customRange.low && customRange.high)}
                >
                    {t('calculatePerformance')}
                </button>
            </div>
            
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 gap-3">
                <button
                    onClick={handleCopyToClipboard}
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={t('copyAriaLabel')}
                >
                    {isCopied ? t('copied') : t('copy')}
                </button>
                <button
                    onClick={() => setEmailModalVisible(true)}
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={t('emailConfigAriaLabel')}
                >
                    {emailButtonText}
                </button>
                <button
                    onClick={handleExportToFile}
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={t('exportJsonAriaLabel')}
                >
                    {t('exportJson')}
                </button>
                <button
                    onClick={handleExportToPdf}
                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={t('exportPdfAriaLabel')}
                    disabled={isGeneratingPdf}
                >
                    {isGeneratingPdf ? t('exportingPdf') : t('exportPdf')}
                </button>
            </div>

            {isEmailModalVisible && (
                <EmailModal
                    onClose={() => setEmailModalVisible(false)}
                    onSend={handleSendEmail}
                    t={t}
                />
            )}
            
            {showPdfConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" onClick={() => setShowPdfConfirm(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800">{t('pdfConfirmTitle')}</h3>
                        <p className="mt-2 text-sm text-gray-600">{t('pdfConfirmMessage')}</p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setShowPdfConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                {t('pdfConfirmCancel')}
                            </button>
                            <button onClick={proceedWithPdfExport} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                {t('pdfConfirmProceed')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};