
import React from 'react';
import type { ProductModel, Selections, SelectionCategory } from '../types';
import { SelectionGroup } from './SelectionGroup';
import type { uiTranslations } from '../data/translations';

interface ConfiguratorProps {
    model: ProductModel;
    selections: Selections;
    onSelectionChange: (selections: Selections) => void;
    t: (key: keyof typeof uiTranslations.en) => string;
}

export const Configurator: React.FC<ConfiguratorProps> = ({ model, selections, onSelectionChange, t }) => {

    const handleSelect = (categoryId: string, optionCode: string) => {
        const newSelections: Selections = {
            ...selections,
            [categoryId]: optionCode,
        };

        // If manifold selection is changed to "No manifold", clear old manifold specs
        if (categoryId === 'manifold' && optionCode === 'VN') {
            model.configuration.forEach(cat => {
                if (cat.part === 'manifold') {
                    delete newSelections[cat.id];
                }
            });
        }

        // Handle mutual exclusivity of manifold and weld neck for relevant models
        if (model.id === 'RTX2300A' || model.id === 'RTX2400G') {
            // If a real manifold is selected, ensure weld neck is reset to 'WN'
            if (categoryId === 'manifold' && optionCode !== 'VN') {
                newSelections.weldNeck = 'WN';
            }

            // If a real weld neck is selected, ensure manifold is 'VN' and clear spectrum
            if (categoryId === 'weldNeck' && optionCode !== 'WN') {
                newSelections.manifold = 'VN';
                model.configuration.forEach(cat => {
                    if (cat.part === 'manifold') {
                        delete newSelections[cat.id];
                    }
                });
            }
        }

        onSelectionChange(newSelections);
    };

    const renderSection = (titleKey: keyof typeof uiTranslations.en, categories: SelectionCategory[]) => (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">{t(titleKey)}</h2>
            <div className="space-y-6">
                {categories.map((category) => (
                     <SelectionGroup
                        key={`${model.id}-${category.id}`}
                        category={category}
                        selectedValue={selections[category.id]}
                        allSelections={selections}
                        onSelect={(optionCode) => handleSelect(category.id, optionCode)}
                        t={t}
                    />
                ))}
            </div>
        </div>
    );

    const requiredCategories = model.configuration.filter(c => c.part === 'required');
    const additionalCategories = model.configuration.filter(c => c.part === 'additional');
    
    const isManifoldSelected = selections.manifold && selections.manifold !== 'VN';
    const manifoldCategories = isManifoldSelected
        ? model.configuration.filter(c => c.part === 'manifold')
        : [];

    return (
        <div className="space-y-8">
            {renderSection("requiredOptionsTitle", requiredCategories)}
            {renderSection("additionalOptionsTitle", additionalCategories)}
            {isManifoldSelected && renderSection("manifoldOptionsTitle", manifoldCategories)}
        </div>
    );
};
