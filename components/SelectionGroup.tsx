
import React from 'react';
import type { SelectionCategory, Selections } from '../types';
import type { uiTranslations } from '../data/translations';

interface SelectionGroupProps {
    category: SelectionCategory;
    selectedValue?: string;
    allSelections: Selections;
    onSelect: (optionCode: string) => void;
    t: (key: keyof typeof uiTranslations.en, ...args: any[]) => string;
}

export const SelectionGroup: React.FC<SelectionGroupProps> = ({ category, selectedValue, allSelections, onSelect, t }) => {
    
    const selectedOptionDetails = selectedValue ? category.options.find(o => o.code === selectedValue)?.details : null;
    
    return (
        <div>
            <label htmlFor={category.id} className="block font-semibold text-md text-gray-700 mb-2">
                {category.title}
            </label>
            <div className="relative">
                <select
                    id={category.id}
                    value={selectedValue || ''}
                    onChange={(e) => onSelect(e.target.value)}
                    className="w-full appearance-none p-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                >
                    <option value="" disabled>{t('selectOption')}</option>
                    {category.options.map(option => {
                        const validation = category.validate ? category.validate(option.code, allSelections, t) : { isValid: true };
                        const isDisabled = !validation.isValid;

                        return (
                            <option 
                                key={option.code} 
                                value={option.code} 
                                disabled={isDisabled} 
                                title={isDisabled ? validation.reason : ''}
                            >
                                {`${option.code} - ${option.description}`}
                            </option>
                        );
                    })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                </div>
            </div>
            {selectedOptionDetails && (
                <p className="text-xs mt-1 text-gray-500">{selectedOptionDetails}</p>
            )}
        </div>
    );
};
