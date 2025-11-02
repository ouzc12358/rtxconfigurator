
import { productModels as baseProductModels } from './productData';
import { productTranslations, uiTranslations } from './translations';
import type { ProductModel } from '../types';

export const getTranslatedProductData = (language: 'en' | 'cn'): ProductModel[] => {
    const t = (key: keyof typeof uiTranslations.en) => {
        return uiTranslations[language][key] || uiTranslations.en[key];
    };

    return baseProductModels.map(model => {
        const modelKey = model.id.toLowerCase();
        const translatedConfiguration = model.configuration.map(category => {
            const categoryKey = `${modelKey}_${category.id.toLowerCase()}`;
            const translatedOptions = category.options.map(option => {
                const optionKey = `${categoryKey}_${option.code}`;
                return {
                    ...option,
                    description: productTranslations[language][optionKey as keyof typeof productTranslations.en] || option.description,
                };
            });
            return {
                ...category,
                title: productTranslations[language][categoryKey as keyof typeof productTranslations.en] || category.title,
                options: translatedOptions,
            };
        });

        return {
            ...model,
            name: productTranslations[language][`${modelKey}_name` as keyof typeof productTranslations.en] || model.name,
            description: productTranslations[language][`${modelKey}_desc` as keyof typeof productTranslations.en] || model.description,
            configuration: translatedConfiguration,
            t,
        };
    });
};