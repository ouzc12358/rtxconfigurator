
import React, { useState, useMemo, useEffect } from 'react';
import { Configurator } from './components/Configurator';
import { Summary } from './components/Summary';
import { ProductImage } from './components/ProductImage';
import { productModels } from './data/productData';
import type { Selections, ProductModel } from './types';

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
        if ('selectedModelId' in parsed && 'selections' in parsed && 'tag' in parsed && 'customRange' in parsed) {
            return parsed;
        }
        return undefined;
    } catch (err) {
        console.error("Could not load state from localStorage", err);
        return undefined;
    }
};

const App: React.FC = () => {
    const [initialState] = useState(loadState);

    const [selectedModelId, setSelectedModelId] = useState<string>(initialState?.selectedModelId || productModels[0].id);
    const [selections, setSelections] = useState<Selections>(initialState?.selections || {});
    const [tag, setTag] = useState<string>(initialState?.tag || '');
    const [customRange, setCustomRange] = useState<{ low: string; high: string }>(initialState?.customRange || { low: '', high: '' });

    // Effect to save state to localStorage whenever it changes
    useEffect(() => {
        const stateToSave = {
            selectedModelId,
            selections,
            tag,
            customRange,
        };
        try {
            const serializedState = JSON.stringify(stateToSave);
            localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
        } catch (err) {
            console.error("Could not save state to localStorage", err);
        }
    }, [selectedModelId, selections, tag, customRange]);
    
    // Effect to validate the loaded model ID and reset if it's no longer valid
    useEffect(() => {
        const modelExists = productModels.some(m => m.id === selectedModelId);
        if (!modelExists) {
            console.warn("Saved model ID is invalid. Resetting to default model.");
            setSelectedModelId(productModels[0].id);
            setSelections({});
            setCustomRange({ low: '', high: '' });
        }
    }, [selectedModelId]);

    const selectedModel = useMemo(() => {
        const model = productModels.find(m => m.id === selectedModelId);
        if (!model) {
            // This fallback is handled by the useEffect above, but is a good safeguard.
            return productModels[0];
        }
        return model;
    }, [selectedModelId]);

    const handleModelChange = (modelId: string) => {
        setSelectedModelId(modelId);
        setSelections({}); // Reset selections when model changes
        setCustomRange({ low: '', high: '' }); // Reset custom range
    };

    const handleSelectionsChange = (newSelections: Selections) => {
        // Reset custom range if the pressure range selection changes
        if (selections.pressureRange !== newSelections.pressureRange) {
            setCustomRange({ low: '', high: '' });
        }
        setSelections(newSelections);
    };
    
    const handleReset = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setSelectedModelId(productModels[0].id);
        setSelections({});
        setTag('');
        setCustomRange({ low: '', high: '' });
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <header className="bg-white shadow-md sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <img src="https://www.bakerhughes.com/themes/custom/bh/logo.svg" alt="Druck Logo" className="h-8 w-auto mr-4"/>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-700">
                                RTX2000 Series Configurator
                            </h1>
                        </div>
                        <div>
                             <button
                                onClick={handleReset}
                                className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                aria-label="Reset and clear configuration"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.695v-4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.664 0l-3.181 3.183" />
                                </svg>
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-8">
                         <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">1. Select Product Model</h2>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {productModels.map((model: ProductModel) => (
                                    <button
                                        key={model.id}
                                        onClick={() => handleModelChange(model.id)}
                                        className={`p-4 rounded-md text-center font-semibold transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${
                                            selectedModelId === model.id
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
                                        }`}
                                    >
                                        {model.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
                            <div className="lg:col-span-2 mb-8 lg:mb-0">
                                <div className="bg-white p-4 rounded-lg shadow-lg sticky top-28">
                                    <ProductImage model={selectedModel} selections={selections} />
                                    <p className="text-center mt-4 text-lg text-gray-800 font-bold">{selectedModel.name}</p>
                                    <p className="text-center mt-1 text-sm text-gray-500">{selectedModel.description}</p>
                                </div>
                            </div>
                            <div className="lg:col-span-3">
                                <Configurator
                                    model={selectedModel}
                                    selections={selections}
                                    onSelectionChange={handleSelectionsChange}
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
                            />
                       </div>
                    </div>
                </div>
            </main>
             <footer className="text-center p-4 mt-8 text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} Druck, a Baker Hughes business. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;
