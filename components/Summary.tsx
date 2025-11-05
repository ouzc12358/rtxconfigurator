

import React, { useMemo, useState, useEffect } from 'react';
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
        
            // --- English-only setup ---
            const t_en = (key: keyof typeof uiTranslations.en) => uiTranslations.en[key];
            const enProductModels = getTranslatedProductData('en');
            const enModel = enProductModels.find(m => m.id === model.id);
        
            if (!enModel) {
                throw new Error("Could not find English product data for PDF export.");
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
            const logoUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAmAHMDASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAAAAYDBAUCAQf/xAAwEAACAQMDAwMDAwQCAwAAAAABAgMABBEFEiETMQZBURQiYXEHMhUjUpGhscFSYtH/xAAZAQEAAwEBAAAAAAAAAAAAAAAAAQIDBAX/xAAnEQACAgIBAwQCAwEAAAAAAAAAAQIRAxIhBBMxQVEiBWFxkUKBof/aAAwDAQACEQMRAD8A9UooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAChJIUEsQABkk9hRRQAt3XV447e4GnS5nkiI325BwM+dSO/tzg5qS/WdWsZDbz6f5MowGRsgg/IINdCii9zQ1J8U998g/wDqN+lX2UuqXM1jPPaWskscduzh0UnDBSR09+OKy+k6hcarE09xbywhQhUSKQcsoJHPsSRXQ6xbfedMvLUcebC6fBBB/eq20u3+zafbW/wD3YlT+QBVXG00XJ2rT0VKKKKcgKKKKACiiigAooooADXlPqt4h1f6g1iWUkxWyGKMegUZP5JNeonpXgP1UoP/AOwv2J63Ev+41fH5N8ftZ6f4cn/yI2GjzG+1fTrAAm6u44sHoScn8CteO/tT16bYadYRFvPkM0gHoowo/Mk/lXQ23iG0h/ZH93yB501k1qFz1Lkgn8gT+Veb6BfC+/bBYsxyI7l7f8A4xsP/NacY3bXhGjK0lLuR9LooorIahRRRQAUUUUAFY37TNSbS/CmoTRNsllAijIOCdxwf0zWzrzf8Aas+y1jQh/vJ1P8AVx/oaeG7RXkXuZ5ToOgS+Jtbs9ItiFkuX27iMhV6kn5ABNd1dfsh1+O3Z7e8sppAPuKzISfkQMVX/sjsvP8AEF9eEZFtapg+zMR/pU17bRRUcnSKZaStnmep6TeaNfTaffwmG6gbbJGSDg/I4P51X13X7RLE3nhTT5MZaS7mY/O5v/ABXM1DVaRpN2woooqRhRRRQAUUUUAFeL/ALWpDda5o1kvUXEqKB7lwo/3V7RXh/1kUaj9WPDumLyI5bYbf8AiYk/7VPH6l8Ecr0o+T0P6fsIdDsbJf8A9q3SIf4RiuhrJ+n5PM8LaW2c/wB0q/pxWxqqk43bYk7VBRRRQkFFFFAAa8w/a4wGnaIg+9JcOw+gQD/U16fXmP7Wl3TaXo4H3ZLl2P0Cgf6mqcNTRXkXsz/2Q==';
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
                if (!value && value !== "") return;
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
            addKeyValue(`${t_en('pdf_tagNumber')}:`, tag);
            addKeyValue(`${t_en('pdf_model')}:`, enModel.name);
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
                doc.addPage();
                y = 20;
                addSectionHeader(t_en('performanceReportTitle'));
                
                const chartContainer = document.createElement('div');
                chartContainer.style.position = 'absolute';
                chartContainer.style.left = '-9999px';
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
                            if (!svgElement) return reject('Could not find SVG element for chart.');
                            
                            const svgString = new XMLSerializer().serializeToString(svgElement);
                            const canvas = document.createElement('canvas');
                            canvas.width = svgElement.width.baseVal.value * 2;
                            canvas.height = svgElement.height.baseVal.value * 2;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return reject('Could not get canvas context.');
                            
                            ctx.scale(2, 2);
                            const img = new Image();
                            img.onload = () => {
                                ctx.drawImage(img, 0, 0);
                                resolve(canvas.toDataURL('image/png'));
                            };
                            img.onerror = () => reject('Error loading SVG as image for PDF conversion.');
                            img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
                        }, 200);
                    });
                } finally {
                    document.body.removeChild(chartContainer);
                }
                
                if (chartImageData) {
                    const imgProps = doc.getImageProperties(chartImageData);
                    const pdfWidth = doc.internal.pageSize.getWidth();
                    const imgWidth = pdfWidth - pageMargin * 2 - 40;
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
        
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert(t('alert_pdfGenerationError'));
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const PdfConfirmModal = ({ onConfirm, onClose, t }: { onConfirm: () => void, onClose: () => void, t: (key: keyof typeof uiTranslations.en) => string }) => {
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = '';
                window.removeEventListener('keydown', handleKeyDown);
            };
        }, [onClose]);

        return (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pdf-confirm-title"
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
                    <h3 id="pdf-confirm-title" className="text-lg font-bold text-gray-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {t('pdfConfirmTitle')}
                    </h3>
                    <p className="mt-3 text-sm text-gray-600">{t('pdfConfirmMessage')}</p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            {t('pdfConfirmCancel')}
                        </button>
                        <button onClick={onConfirm} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            {t('pdfConfirmProceed')}
                        </button>
                    </div>
                </div>
            </div>
        );
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
            
            <div className="mt-6 grid grid-cols-2 gap-3">
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
                <button
                    onClick={() => setEmailModalVisible(true)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    aria-label={t('emailConfigAriaLabel')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {emailButtonText}
                </button>
                <button
                    onClick={handleExportToPdf}
                    disabled={isGeneratingPdf}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                    aria-label={t('exportPdfAriaLabel')}
                >
                     {isGeneratingPdf ? (
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )}
                    {isGeneratingPdf ? t('exportingPdf') : t('exportPdf')}
                </button>
            </div>
            <div className="mt-3">
                <button
                    onClick={onCalculatePerformance}
                    disabled={!selectedRangeOption}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                    aria-label={t('calculatePerformanceAriaLabel')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 14.95a1 1 0 101.414 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zM1.93 9.07a1 1 0 001.414-1.414l.707.707a1 1 0 00-1.414 1.414l-.707-.707z" />
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011 1zm5.657 2.757a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1z" />
                    </svg>
                    {t('calculatePerformance')}
                </button>
            </div>
            
            {isEmailModalVisible && <EmailModal onClose={() => setEmailModalVisible(false)} onSend={handleSendEmail} t={t} />}
            {showPdfConfirm && <PdfConfirmModal onConfirm={proceedWithPdfExport} onClose={() => setShowPdfConfirm(false)} t={t} />}
        </div>
    );
};