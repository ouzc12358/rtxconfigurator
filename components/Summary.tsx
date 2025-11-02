
import React, { useMemo, useState } from 'react';
import type { ProductModel, Selections } from '../types';

interface SummaryProps {
    model: ProductModel;
    selections: Selections;
    tag: string;
    onTagChange: (tag: string) => void;
}

const generateTransmitterModelNumber = (model: ProductModel, selections: Selections): [string, string, string, string] => {
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

    // For simplicity, factory range and special requests are placeholders.
    const line3 = "0 ~ 0.5 MPa"; 
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


export const Summary: React.FC<SummaryProps> = ({ model, selections, tag, onTagChange }) => {
    const [isCopied, setIsCopied] = useState(false);
    
    const { transmitterModelLines, manifoldModelNumber, fullConfigText } = useMemo(() => {
        const transmitterLines = generateTransmitterModelNumber(model, selections);
        const manifoldNumber = generateManifoldModelNumber(model, selections);
        
        const configDetails: string[] = [`Model: ${model.name}`];
        if (tag) {
            configDetails.push(`Tag Number: ${tag}`);
        }
        configDetails.push("\n--- Transmitter Model Number ---");
        configDetails.push(`Line 1: ${transmitterLines[0]}`);
        configDetails.push(`Line 2: ${transmitterLines[1]}`);
        configDetails.push(`Line 3 (Example Range): ${transmitterLines[2]}`);
        configDetails.push(`Line 4 (Example Request): ${transmitterLines[3]}`);

        if (manifoldNumber) {
            configDetails.push("\n--- Valve Manifold Model Number ---");
            configDetails.push(manifoldNumber);
        }
        
        configDetails.push("\n--- Configuration Details ---");
        
        model.configuration.forEach(category => {
            const selectedCode = selections[category.id];
            if (selectedCode) {
                const selectedOption = category.options.find(o => o.code === selectedCode);
                if (selectedOption) {
                    configDetails.push(`${category.title}: ${selectedOption.description} (${selectedOption.code})`);
                }
            }
        });

        return {
            transmitterModelLines: transmitterLines,
            manifoldModelNumber: manifoldNumber,
            fullConfigText: configDetails.join('\n')
        };

    }, [model, selections, tag]);

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(fullConfigText).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
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

            <div className="bg-gray-100 p-4 rounded-md mb-4 font-mono text-sm text-gray-800 space-y-1">
                 <p className="font-semibold text-gray-600">Transmitter Model:</p>
                <p><span className="font-semibold text-gray-500">Line 1:</span> {transmitterModelLines[0]}</p>
                <p><span className="font-semibold text-gray-500">Line 2:</span> {transmitterModelLines[1]}</p>
                <p className="text-xs text-gray-500">Line 3: {transmitterModelLines[2]}</p>
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
                    {model.configuration.map(category => {
                        const selectedCode = selections[category.id];
                        if (!selectedCode) return null;
                        const option = category.options.find(o => o.code === selectedCode);
                        return option ? (
                            <li key={category.id} className="flex justify-between">
                                <span className="font-medium">{category.title}:</span>
                                <span className="text-right">{option.description}</span>
                            </li>
                        ) : null;
                    })}
                </ul>
            </div>
            
            <button
                onClick={handleCopyToClipboard}
                className="mt-6 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {isCopied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
        </div>
    );
};