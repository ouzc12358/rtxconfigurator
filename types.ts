
export interface Option {
    code: string;
    description: string;
    details?: string;
}

export interface SelectionValidationResult {
    isValid: boolean;
    reason?: string;
}

export interface SelectionCategory {
    id: string;
    title: string;
    options: Option[];
    part: 'required' | 'additional' | 'manifold';
    validate?: (optionCode: string, selections: Selections) => SelectionValidationResult;
}

export interface ProductModel {
    id: string;
    name: string;
    baseCode: string;
    description: string;
    configuration: SelectionCategory[];
}

export type Selections = {
    [categoryId: string]: string | undefined;
};