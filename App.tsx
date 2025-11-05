


import React, { useState, useMemo, useEffect } from 'react';
import { Configurator } from './components/Configurator';
import { Summary } from './components/Summary';
import { ProductImage } from './components/ProductImage';
import { productModels as baseProductModels, calculatePerformanceSpecs, getAccuracyFunction } from './data/productData';
import { getTranslatedProductData } from './data/i18n';
import { uiTranslations } from './data/translations';
import type { Selections, ProductModel, ImageInfo, TFunction } from './types';

// Key for localStorage
const LOCAL_STORAGE_KEY = 'druckRtxConfiguratorState';

// Function to load state from localStorage
const loadState = () => {
    try {
        const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (serializedState === null) {
            return undefined;
        }
        const parsed = JSON.parse(serializedState);
        // Basic validation to ensure the loaded object has expected keys
        if ('selectedModelId' in parsed && 'selections' in parsed && 'tag' in parsed && 'customRange' in parsed && 'specialRequest' in parsed) {
            return parsed;
        }
        return undefined;
    } catch (err) {
        console.error("Could not load state from localStorage", err);
        return undefined;
    }
};

// --- Image Zoom Modal Component ---
interface ImageZoomModalProps {
    image: ImageInfo;
    onClose: () => void;
    t: (key: keyof typeof uiTranslations.en) => string;
}

const ImageZoomModal: React.FC<ImageZoomModalProps> = ({ image, onClose, t }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        // Prevent background scrolling when modal is open
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="relative bg-white p-4 rounded-lg shadow-2xl max-w-4xl w-[90%] max-h-[90vh] transition-transform transform scale-95 animate-zoom-in"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image container
            >
                 <style>{`
                    @keyframes zoom-in {
                        from { transform: scale(0.9); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    .animate-zoom-in {
                        animation: zoom-in 0.2s ease-out forwards;
                    }
                `}</style>
                <button 
                    onClick={onClose}
                    className="absolute top-2 right-2 z-10 bg-gray-100 rounded-full p-1 text-gray-600 hover:bg-gray-300 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    aria-label={t('closeImageView')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="flex flex-col h-full">
                    <div className="flex-grow flex items-center justify-center overflow-hidden">
                        <img src={image.src} alt={image.alt} className="max-w-full max-h-full object-contain" />
                    </div>
                    <p className="flex-shrink-0 text-center text-sm text-gray-600 pt-3 font-semibold">{image.title}</p>
                </div>
            </div>
        </div>
    );
};


// --- Performance Calculator Components ---

interface AccuracyChartProps {
    accuracyFunction: ((r: number) => number | null) | null;
    currentRatio: number | null;
    currentAccuracy: number | null;
    maxRatio: number;
    t: TFunction;
}

const AccuracyChart: React.FC<AccuracyChartProps> = ({ accuracyFunction, currentRatio, currentAccuracy, maxRatio, t }) => {
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const { points, yMax } = useMemo(() => {
        if (!accuracyFunction) return { points: [], yMax: 0.1 };
        const dataPoints = [];
        let maxY = 0.04;
        const step = maxRatio > 1 ? (maxRatio - 1) / 100 : 0;
        for (let i = 0; i <= 100; i++) {
            const r = 1 + i * step;
            const acc = accuracyFunction(r);
            if (acc !== null) {
                dataPoints.push({ r, acc });
                if (acc > maxY) maxY = acc;
            }
        }
        return { points: dataPoints, yMax: Math.max(maxY * 1.2, 0.05) };
    }, [accuracyFunction, maxRatio]);

    const xScale = (r: number) => margin.left + ((r - 1) / (maxRatio > 1 ? maxRatio - 1 : 1)) * innerWidth;
    const yScale = (acc: number) => margin.top + innerHeight - (acc / yMax) * innerHeight;

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.r)} ${yScale(p.acc)}`).join(' ');

    return (
        <svg width={width} height={height} className="max-w-full">
            {/* Y Axis */}
            <g className="text-xs text-gray-500">
                <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + innerHeight} stroke="currentColor" />
                {[0, 0.25, 0.5, 0.75, 1].map(tick => (
                    <g key={tick}>
                        <text x={margin.left - 8} y={yScale(tick * yMax) + 4} textAnchor="end">{`${(tick * yMax).toFixed(3)}%`}</text>
                        <line x1={margin.left} x2={margin.left - 4} y={yScale(tick * yMax)} stroke="currentColor" />
                    </g>
                ))}
                <text transform={`translate(${margin.left-35}, ${margin.top + innerHeight/2}) rotate(-90)`} textAnchor="middle" className="font-semibold fill-current">{t('accuracy')}</text>
            </g>

            {/* X Axis */}
            <g className="text-xs text-gray-500">
                <line x1={margin.left} y1={margin.top + innerHeight} x2={margin.left + innerWidth} y2={margin.top + innerHeight} stroke="currentColor" />
                {[1, ...[0.25, 0.5, 0.75, 1].map(t => 1 + t * (maxRatio-1))].map(tick => (
                     <g key={tick}>
                        <text x={xScale(tick)} y={margin.top + innerHeight + 15} textAnchor="middle">{Math.round(tick)}:1</text>
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
                    <text x={xScale(currentRatio) + 5} y={yScale(currentAccuracy) - 5} className="text-xs font-bold fill-red-600">{`r=${currentRatio.toFixed(1)}, acc=${currentAccuracy.toFixed(4)}%`}</text>
                </g>
            )}
        </svg>
    );
};


interface PerformanceCalculatorProps {
    model: ProductModel;
    selections: Selections;
    onClose: () => void;
    t: TFunction;
}

const PerformanceCalculator: React.FC<PerformanceCalculatorProps> = ({ model, selections, onClose, t }) => {
    const [userRange, setUserRange] = useState({ low: '', high: '' });
    
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

    const { specs, ratio, rangeOption, error } = useMemo(() => {
        const rangeCat = model.configuration.find(c => c.id === 'pressureRange');
        const rangeOpt = rangeCat?.options.find(o => o.code === selections.pressureRange);
        if (!rangeOpt) {
            return { specs: null, ratio: null, rangeOption: null, error: 'Pressure range not selected.' };
        }

        const low = parseFloat(userRange.low);
        const high = parseFloat(userRange.high);
        const lowIsNum = !isNaN(low);
        const highIsNum = !isNaN(high);

        if (!userRange.low || !userRange.high || !lowIsNum || !highIsNum) {
            return { specs: calculatePerformanceSpecs(model, selections, 1, t), ratio: null, rangeOption: rangeOpt, error: null };
        }

        if (low >= high) {
            return { specs: null, ratio: null, rangeOption: rangeOpt, error: t('rangeError_lowHigh') };
        }
        if (low < rangeOpt.min! || high > rangeOpt.max!) {
            return { specs: null, ratio: null, rangeOption: rangeOpt, error: t('rangeError_minMax').replace('{min}', rangeOpt.min!.toString()).replace('{max}', rangeOpt.max!.toString()).replace('{unit}', rangeOpt.unit || '') };
        }

        const calibratedSpan = high - low;
        const minSpan = rangeOpt.minSpan ?? 0.001;
        if (calibratedSpan < minSpan) {
            return { specs: null, ratio: null, rangeOption: rangeOpt, error: t('fsTooSmallError').replace('{span}', calibratedSpan.toPrecision(2)).replace('{minSpan}', minSpan.toString()) };
        }

        const maxSpan = (rangeOpt.max ?? 0) - (rangeOpt.min ?? 0);
        const r = maxSpan / calibratedSpan;
        
        const accuracyData = getAccuracyFunction(model.id, selections.pressureRange || '');
        const maxR = accuracyData?.maxRatio ?? Infinity;
        if (r > maxR) {
            return { specs: null, ratio: r, rangeOption: rangeOpt, error: t('turndownRatioError').replace('{maxRatio}', maxR.toFixed(0)) };
        }

        return { specs: calculatePerformanceSpecs(model, selections, r, t), ratio: r, rangeOption: rangeOpt, error: null };
    }, [model, selections, userRange, t]);

    const accuracyFunction = useMemo(() => getAccuracyFunction(model.id, selections.pressureRange || ''), [model.id, selections.pressureRange]);
    
    const maxRatio = useMemo(() => {
        const rangeCat = model.configuration.find(c => c.id === 'pressureRange');
        const rangeOpt = rangeCat?.options.find(o => o.code === selections.pressureRange);
        if (!rangeOpt) return 1;

        const maxSpan = (rangeOpt.max ?? 0) - (rangeOpt.min ?? 0);
        const minSpan = rangeOpt.minSpan ?? 1;
        
        if (minSpan <= 0) return 1;
        
        const calculatedMaxRatio = maxSpan / minSpan;
        const accuracyData = getAccuracyFunction(model.id, selections.pressureRange || '');
        
        return Math.min(calculatedMaxRatio, accuracyData?.maxRatio ?? Infinity);
    }, [model, selections.pressureRange]);

    return (
         <div className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-full max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{t('performanceReportTitle')} - <span className="font-mono">{model.name}</span></h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label={t('close')}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <label htmlFor="range-low-input" className="block text-sm font-medium text-gray-700">{t('enterCalibrationRange')} ({rangeOption?.unit})</label>
                        <div className="mt-1 flex items-center space-x-2">
                             <input
                                type="number"
                                id="range-low-input"
                                value={userRange.low}
                                onChange={(e) => setUserRange(prev => ({...prev, low: e.target.value}))}
                                placeholder={t('lowRangePlaceholder').replace('{min}', rangeOption?.min?.toString() ?? '')}
                                className={`block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
                             />
                             <span className="text-gray-500 font-semibold">{t('to')}</span>
                             <input
                                type="number"
                                id="range-high-input"
                                value={userRange.high}
                                onChange={(e) => setUserRange(prev => ({...prev, high: e.target.value}))}
                                placeholder={t('highRangePlaceholder').replace('{max}', rangeOption?.max?.toString() ?? '')}
                                className={`block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
                             />
                        </div>
                        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
                        {ratio && <p className="text-sm text-gray-600 mt-1">{t('turndownRatio')}: {ratio.toFixed(2)}:1</p>}
                        <p className="text-xs text-gray-500 mt-1">{t('minSpan')}: {rangeOption?.minSpan} {rangeOption?.unit}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">{t('accuracyChartTitle')}</h3>
                        <div className='flex justify-center'>
                           <AccuracyChart 
                                accuracyFunction={accuracyFunction?.func ?? null} 
                                currentRatio={ratio} 
                                currentAccuracy={specs?.accuracy ? parseFloat(specs.accuracy.value) : null}
                                maxRatio={maxRatio}
                                t={t}
                           />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">{t('specificationsTitle')}</h3>
                        {specs ? (
                            <div className="border rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('parameter')}</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('performance')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {Object.values(specs).map((spec) => {
                                            const typedSpec = spec as { name: string; value: string };
                                            return (
                                                <tr key={typedSpec.name}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{typedSpec.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{typedSpec.value}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className='text-gray-500'>{t('enterRangeToCalculate')}</p>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [initialState] = useState(loadState);

    const [selectedModelId, setSelectedModelId] = useState<string>(initialState?.selectedModelId || '');
    const [selections, setSelections] = useState<Selections>(initialState?.selections || {});
    const [tag, setTag] = useState<string>(initialState?.tag || '');
    const [customRange, setCustomRange] = useState<{ low: string; high: string }>(initialState?.customRange || { low: '', high: '' });
    const [specialRequest, setSpecialRequest] = useState<string>(initialState?.specialRequest || '');
    
    // State for the single quick configuration input field
    const [fullModelCode, setFullModelCode] = useState('');
    
    // State for the image zoom modal
    const [zoomedImage, setZoomedImage] = useState<ImageInfo | null>(null);

    // State for language
    const [language, setLanguage] = useState<'en' | 'cn'>('en');

    // State for performance calculator modal
    const [isPerformanceVisible, setPerformanceVisible] = useState(false);

    // Translation function and translated data
    const t = (key: keyof typeof uiTranslations.en, ...args: any[]) => {
        let translation = uiTranslations[language][key] || uiTranslations.en[key];
        // Simple replace for placeholders like {name}
        if (args && args.length > 0 && typeof args[0] === 'object') {
            Object.entries(args[0]).forEach(([k, v]) => {
                translation = translation.replace(`{${k}}`, String(v));
            });
        }
        return translation;
    };
    const translatedProductModels = useMemo(() => getTranslatedProductData(language), [language]);

    const selectedModel = useMemo(() => {
        if (!selectedModelId) return null;
        return translatedProductModels.find(m => m.id === selectedModelId) || null;
    }, [selectedModelId, translatedProductModels]);

    // Effect to save state to localStorage whenever it changes
    useEffect(() => {
        const stateToSave = {
            selectedModelId,
            selections,
            tag,
            customRange,
            specialRequest,
        };
        try {
            const serializedState = JSON.stringify(stateToSave);
            localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
        } catch (err) {
            console.error("Could not save state to localStorage", err);
        }
    }, [selectedModelId, selections, tag, customRange, specialRequest]);
    
    // Effect to validate the loaded model ID and reset if it's no longer valid
    useEffect(() => {
        if (selectedModelId) {
            const modelExists = baseProductModels.some(m => m.id === selectedModelId);
            if (!modelExists) {
                console.warn("Saved model ID is invalid. Resetting configuration.");
                handleReset();
            }
        }
    }, [selectedModelId]);

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const modelId = e.target.value;
        setSelectedModelId(modelId);
        // Reset everything else when model changes
        setSelections({});
        setCustomRange({ low: '', high: '' });
        setTag('');
        setSpecialRequest('');
        setFullModelCode('');
    };

    const handleSelectionsChange = (newSelections: Selections) => {
        // Reset custom range if the pressure range selection changes
        if (selections.pressureRange !== newSelections.pressureRange) {
            setCustomRange({ low: '', high: '' });
        }
        setSelections(newSelections);
    };

    const handleApplyFullCode = () => {
        // Rigorously clean the input string to handle copy-paste issues
        // Replaces en-dashes/em-dashes with hyphens and removes all whitespace
        const code = fullModelCode
            .toUpperCase()
            .replace(/[\u2013\u2014]/g, '-') // Normalize dashes
            .replace(/\s/g, ''); // Remove all whitespace

        if (!code) return;

        let matchedInfo: { model: ProductModel, prefixLength: number } | null = null;
        
        const prefixes = new Map<string, ProductModel>();
        for (const model of baseProductModels) {
            const baseCodeWithHyphen = model.baseCode.toUpperCase();
            const baseCodeWithoutHyphen = baseCodeWithHyphen.replace(/-/g, '');
            
            prefixes.set(baseCodeWithHyphen, model);
            prefixes.set(baseCodeWithoutHyphen, model);

            const modelNumber = baseCodeWithHyphen.split('-')[0];
            const isUnique = baseProductModels.filter(m => m.baseCode.toUpperCase().startsWith(modelNumber)).length === 1;
            if (isUnique) {
                if (!prefixes.has(modelNumber)) {
                    prefixes.set(modelNumber, model);
                }
            }
        }

        const sortedPrefixes = Array.from(prefixes.keys()).sort((a, b) => b.length - a.length);

        for (const prefix of sortedPrefixes) {
            if (code.startsWith(prefix)) {
                matchedInfo = { model: prefixes.get(prefix)!, prefixLength: prefix.length };
                break;
            }
        }

        if (!matchedInfo) {
            alert(t('alert_modelNotFound'));
            return;
        }
        
        const { model: matchedModel, prefixLength } = matchedInfo;

        // Set model and reset state before applying new selections
        setSelectedModelId(matchedModel.id);
        setCustomRange({ low: '', high: '' });
        setTag('');
        setSpecialRequest('');

        // Only remove leading hyphens, as other hyphens can be part of a valid code (e.g., 'A-')
        let codeForOptions = code.substring(prefixLength).replace(/^-+/, '');
        const newSelections: Selections = {};

        // Process Required Code (sequentially)
        const requiredCategories = matchedModel.configuration.filter(c => c.part === 'required');
        let codeRemainder = codeForOptions;

        for (const category of requiredCategories) {
            let bestMatch: { optionCode: string, matchedLength: number } | null = null;
            
            // Find the best (longest) possible match for the current category
            for (const option of category.options) {
                // Check for exact match
                if (codeRemainder.startsWith(option.code)) {
                    if (!bestMatch || option.code.length > bestMatch.matchedLength) {
                        bestMatch = { optionCode: option.code, matchedLength: option.code.length };
                    }
                }
                // Check for lenient match (e.g., user entered 'A' for 'A-')
                if (option.code.endsWith('-') && option.code.length > 1) {
                    const codeWithoutHyphen = option.code.slice(0, -1);
                    if (codeRemainder.startsWith(codeWithoutHyphen)) {
                         if (!bestMatch || codeWithoutHyphen.length > bestMatch.matchedLength) {
                            bestMatch = { optionCode: option.code, matchedLength: codeWithoutHyphen.length };
                        }
                    }
                }
            }
            
            if (bestMatch) {
                newSelections[category.id] = bestMatch.optionCode;
                codeRemainder = codeRemainder.substring(bestMatch.matchedLength);
            } else {
                // No match found for this required category, so we stop parsing required options.
                break;
            }
        }

        // Process Additional Code (non-sequentially) from the remainder
        const addCodeToParse = codeRemainder;
        const additionalCategories = matchedModel.configuration.filter(c => c.part === 'additional' || c.part === 'manifold');
        const allAdditionalOptions = additionalCategories.flatMap(cat => cat.options.map(opt => ({ ...opt, categoryId: cat.id })));
        allAdditionalOptions.sort((a, b) => b.code.length - a.code.length);
        
        let tempAdditionalCode = addCodeToParse;
        while (tempAdditionalCode.length > 0) {
            let matchFound = false;
            for (const option of allAdditionalOptions) {
                if (!newSelections[option.categoryId] && tempAdditionalCode.startsWith(option.code)) {
                    newSelections[option.categoryId] = option.code;
                    tempAdditionalCode = tempAdditionalCode.substring(option.code.length);
                    matchFound = true;
                    break;
                }
            }
            if (!matchFound) break;
        }
        
        setSelections(newSelections);
        setFullModelCode('');
    };
    
    const handleReset = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setSelectedModelId('');
        setSelections({});
        setTag('');
        setCustomRange({ low: '', high: '' });
        setSpecialRequest('');
        setFullModelCode('');
    };
    
    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'cn' : 'en');
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <header className="bg-white shadow-md sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <img src="https://www.bakerhughes.com/sites/bakerhughes/files/2021-10/druck_no_tagline_web.jpg" alt="Druck Logo" className="h-8 w-auto mr-4"/>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-700">
                                {t('appTitle')}
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2">
                             <button
                                onClick={toggleLanguage}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                aria-label="Toggle language"
                             >
                                 中文/English
                             </button>
                             <button
                                onClick={handleReset}
                                className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                aria-label={t('resetAriaLabel')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.695v-4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.664 0l-3.181 3.183" />
                                </svg>
                                {t('reset')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">{t('startConfig')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-start">
                        <div>
                            <label htmlFor="full-model-code-input" className="block text-sm font-medium text-gray-700">
                                {t('quickConfig')}
                            </label>
                            <div className="mt-1 flex space-x-2">
                                <input
                                    id="full-model-code-input"
                                    type="text"
                                    value={fullModelCode}
                                    onChange={(e) => setFullModelCode(e.target.value)}
                                    placeholder={t('quickConfigPlaceholder')}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                                    aria-label={t('quickConfigAriaLabel')}
                                />
                                <button
                                    onClick={handleApplyFullCode}
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    {t('apply')}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{t('quickConfigHelp')}</p>
                        </div>
                        <div className="flex items-center pt-1">
                             <span className="hidden md:inline-block text-gray-400 font-semibold mr-4">{t('or')}</span>
                             <div>
                                <label htmlFor="model-select" className="block text-sm font-medium text-gray-700">
                                    {t('selectManually')}
                                </label>
                                <select
                                    id="model-select"
                                    value={selectedModelId}
                                    onChange={handleModelChange}
                                    className="mt-1 w-full appearance-none p-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                                >
                                    <option value="" disabled>{t('chooseModel')}</option>
                                    {translatedProductModels.map((model: ProductModel) => (
                                        <option key={model.id} value={model.id}>
                                            {model.name} - {model.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedModel && (
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                        <div className="lg:col-span-8">
                            <div className="lg:grid lg:grid-cols-5 lg:gap-8">
                                <div className="lg:col-span-2 mb-8 lg:mb-0">
                                    <div className="bg-white p-4 rounded-lg shadow-lg sticky top-28">
                                        <ProductImage 
                                            model={selectedModel} 
                                            selections={selections}
                                            onImageClick={setZoomedImage}
                                            t={t}
                                        />
                                        <p className="text-center mt-4 text-lg text-gray-800 font-bold">{selectedModel.name}</p>
                                        <p className="text-center mt-1 text-sm text-gray-500">{selectedModel.description}</p>
                                    </div>
                                </div>
                                <div className="lg:col-span-3">
                                    <Configurator
                                        model={selectedModel}
                                        selections={selections}
                                        onSelectionChange={handleSelectionsChange}
                                        t={t}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-4 mt-8 lg:mt-0">
                           <div className="sticky top-28">
                               <Summary 
                                    model={selectedModel} 
                                    selections={selections} 
                                    tag={tag}
                                    onTagChange={setTag}
                                    customRange={customRange}
                                    onCustomRangeChange={setCustomRange}
                                    specialRequest={specialRequest}
                                    onSpecialRequestChange={setSpecialRequest}
                                    onCalculatePerformance={() => setPerformanceVisible(true)}
                                    t={t}
                                />
                           </div>
                        </div>
                    </div>
                )}
            </main>
             <footer className="text-center p-4 mt-8 text-sm text-gray-500">
                <p>{t('footerText').replace('{year}', new Date().getFullYear().toString())}</p>
            </footer>
            {zoomedImage && <ImageZoomModal image={zoomedImage} onClose={() => setZoomedImage(null)} t={t} />}
            {isPerformanceVisible && selectedModel && (
                <PerformanceCalculator 
                    model={selectedModel}
                    selections={selections}
                    onClose={() => setPerformanceVisible(false)}
                    t={t}
                />
            )}
        </div>
    );
};

export default App;