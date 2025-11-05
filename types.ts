

import type { uiTranslations } from './data/translations';
export type TFunction = (key: keyof typeof uiTranslations.en, ...args: any[]) => string;

export interface Option { code: string; description: string; details?: string; min?: number; max?: number; unit?: string; minSpan?: number; }
export interface SelectionValidationResult { isValid: boolean; reason?: string; }
export interface SelectionCategory { id: string; title: string; options: Option[]; part: 'required' | 'additional' | 'manifold'; validate?: (optionCode: string, selections: Selections, t: TFunction) => SelectionValidationResult; }
export interface ProductModel { id: string; name: string; baseCode: string; description: string; configuration: SelectionCategory[]; t?: TFunction; }
export type Selections = { [categoryId: string]: string | undefined; };
export interface ImageInfo { src: string; alt: string; title: string; }

// --- Performance Calculation Types ---
export interface PerformanceSpec { 
    name: string; 
    value: string; 
    accuracyValue?: number | null; // Keep raw numeric value for charting
}
export interface PerformanceSpecs { [key: string]: PerformanceSpec; }
export interface PerformanceResult {
    specs: PerformanceSpecs;
    ratio: number | null;
    userRange: { low: string; high: string; };
    rangeOption: Option | undefined;
}
