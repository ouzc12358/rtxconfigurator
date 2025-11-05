
import type { ProductModel, SelectionValidationResult, Selections, SelectionCategory, Option, TFunction } from '../types';

// Validation Functions
const validateElectricalConnector = (optionCode: string, selections: Selections, t: TFunction): SelectionValidationResult => {
    const explosionProof = selections.explosionProof;
    const housingType = selections.housingType;

    if (!housingType) {
        return { isValid: false, reason: t('validation_selectHousing') };
    }

    // Thread type matching housing
    const isM20Connector = ['E1', 'E2', 'E3', 'E4', 'E5'].includes(optionCode);
    const isNPTConnector = ['E6', 'E7', 'E8', 'E9', 'EA'].includes(optionCode);

    if (isM20Connector && housingType !== '2') {
        return { isValid: false, reason: t('validation_requiresM20') };
    }
    if (isNPTConnector && housingType !== '1') {
        return { isValid: false, reason: t('validation_requiresNPT') };
    }
    
    // Explosion proof type matching
    if (explosionProof && ['D-', 'E-', 'F-'].includes(explosionProof)) { // Explosion proof types
        if (['E1', 'E6', 'E4', 'E5', 'E9', 'EA'].includes(optionCode)) { // Non-explosion proof connectors or dust plugs
            return { isValid: false, reason: t('validation_notForExplosionProof').replace('{type}', explosionProof) };
        }
    }
    return { isValid: true };
};

const validateManifold_AG = (optionCode: string, selections: Selections, t: TFunction): SelectionValidationResult => {
    if (selections.weldNeck && selections.weldNeck !== 'WN') {
        return { isValid: false, reason: t('validation_noManifoldWithWeldNeck') };
    }
    if (!['V1', 'V2', 'VN'].includes(optionCode)) {
        return { isValid: false, reason: t('validation_only2ValveManifold') };
    }
    return { isValid: true };
};

const validateWeldNeck_AG = (optionCode: string, selections: Selections, t: TFunction): SelectionValidationResult => {
    // "None" is always a valid choice.
    if (optionCode === 'WN') {
        return { isValid: true };
    }

    // Check for conflict with manifold selection.
    if (selections.manifold && selections.manifold !== 'VN') {
        return { isValid: false, reason: t('validation_noWeldNeckWithManifold') };
    }
    
    // A Process Connection must be selected first.
    const processConnection = selections.processConnection;
    if (!processConnection) {
        return { isValid: false, reason: t('validation_selectProcessConnection') };
    }

    const isTransmitterFemale = processConnection === '1'; // e.g., 1/2 NPT Female
    const isTransmitterMale = ['2', '3', '4'].includes(processConnection);
    
    const isWeldNeckMale = ['W1', 'W2', 'W3'].includes(optionCode);
    const isWeldNeckFemale = ['W4','W5','W6','W7','W8','W9','WA','WB','WC'].includes(optionCode);

    // Valid combinations
    if (isTransmitterFemale && isWeldNeckMale) {
        return { isValid: true };
    }
    if (isTransmitterMale && isWeldNeckFemale) {
        return { isValid: true };
    }
    
    // If we reach here, it's an invalid combination. Provide a specific reason.
    if (isTransmitterFemale) {
        return { isValid: false, reason: t('validation_requiresMaleWeldNeck') };
    }
    if (isTransmitterMale) {
        return { isValid: false, reason: t('validation_requiresFemaleWeldNeck') };
    }

    // Fallback for any unforeseen case.
    return { isValid: false, reason: t('validation_incompatibleProcessConnection') };
};


const validateManifold_K = (optionCode: string, selections: Selections, t: TFunction): SelectionValidationResult => {
     if (selections.weldNeck && selections.weldNeck !== 'WN') {
        return { isValid: false, reason: t('validation_noManifoldWithWeldNeck') };
    }
    if (!['V1', 'V2', 'VN'].includes(optionCode)) {
        return { isValid: false, reason: t('validation_only2ValveManifold') };
    }
    return { isValid: true };
};

const validateManifold_D = (optionCode: string, selections: Selections, t: TFunction): SelectionValidationResult => {
    if (selections.weldNeck && selections.weldNeck !== 'WN') {
        return { isValid: false, reason: t('validation_noManifoldWithWeldNeck') };
    }
    if (!['V3', 'V4', 'V5', 'V6', 'VN'].includes(optionCode)) {
        return { isValid: false, reason: t('validation_only35ValveManifold') };
    }
    return { isValid: true };
};

const validateWeldNeck_KD = (optionCode: string, selections: Selections, t: TFunction): SelectionValidationResult => {
    if (optionCode !== 'WN') {
        return { isValid: false, reason: t('validation_noWeldNeckApplicable') };
    }
    return { isValid: true };
};


// Shared Option Categories
const sharedHousingAndExplosionOptions: SelectionCategory[] = [
    {
        id: 'communication',
        title: 'Communication Protocol',
        part: 'required',
        options: [{ code: 'H', description: 'HART Protocol' }]
    },
    {
        id: 'display',
        title: 'Display',
        part: 'required',
        options: [
            { code: 'N', description: 'No Display' },
            { code: 'Y', description: 'LCD Display' }
        ]
    },
    {
        id: 'housingType',
        title: 'Housing Type & Electrical Connection',
        part: 'required',
        options: [
            { code: '1', description: 'Aluminum / 1/2 - 14 NPT' },
            { code: '2', description: 'Aluminum / M20 x 1.5' }
        ]
    },
    {
        id: 'explosionProof',
        title: 'Explosion-Proof Certification',
        part: 'required',
        options: [
            { code: 'A-', description: 'None' },
            { code: 'B-', description: 'NEPSI: Ex ia IIC T4 Ga' },
            { code: 'D-', description: 'NEPSI: Ex db IIC T6 Gb' },
            { code: 'E-', description: 'NEPSI: Ex tb IIIC T85°C Db' },
            { code: 'F-', description: 'NEPSI: Ex ec IIC T6 Gc' },
        ]
    }
];

const sharedAdditionalOptions: SelectionCategory[] = [
    {
        id: 'mountingBracket',
        title: 'Mounting Bracket',
        part: 'additional',
        options: [
            { code: 'B1', description: 'Horizontal, Carbon Steel' },
            { code: 'B2', description: 'Horizontal, 304 SS' },
            { code: 'B3', description: 'Horizontal, 316 SS' },
            { code: 'B4', description: 'Vertical, Carbon Steel' },
            { code: 'B5', description: 'Vertical, 304 SS' },
            { code: 'B6', description: 'Vertical, 316 SS' },
            { code: 'BN', description: 'None' }
        ]
    },
    {
        id: 'electricalConnector',
        title: 'Electrical Connector',
        part: 'additional',
        options: [
            { code: 'E1', description: 'M20 x 1.5, Plastic' },
            { code: 'E2', description: 'M20 x 1.5, Ex d, 304 SS' },
            { code: 'E3', description: 'M20 x 1.5, Ex d, 316 SS' },
            { code: 'E4', description: 'M20 x 1.5, Dust Plug, Plastic/304 SS' },
            { code: 'E5', description: 'M20 x 1.5, Dust Plug, Plastic/316 SS' },
            { code: 'E6', description: '1/2 - 14 NPT, Plastic' },
            { code: 'E7', description: '1/2 - 14 NPT, Ex d, 304 SS' },
            { code: 'E8', description: '1/2 - 14 NPT, Ex d, 316 SS' },
            { code: 'E9', description: '1/2 - 14 NPT, Dust Plug, Plastic/304 SS' },
            { code: 'EA', description: '1/2 - 14 NPT, Dust Plug, Plastic/316 SS' }
        ],
        validate: validateElectricalConnector
    },
];

const sharedAdditionalOptions2: SelectionCategory[] = [
    {
        id: 'additionalCertification',
        title: 'Additional Certification',
        part: 'additional',
        options: [{ code: '0', description: 'None' }]
    },
    {
        id: 'lightningProtection',
        title: 'Lightning Protection',
        part: 'additional',
        options: [
            { code: 'A', description: 'None' },
            { code: 'B', description: 'Lightning surge protection' }
        ]
    },
    {
        id: 'alarmCurrent',
        title: 'Alarm Current',
        part: 'additional',
        options: [
            { code: 'C', description: '3.6 mA' },
            { code: 'D', description: '22.8 mA' }
        ]
    },
    {
        id: 'acceptanceData',
        title: 'Acceptance Data',
        part: 'additional',
        options: [
            { code: 'E', description: 'None' },
            { code: 'F1', description: 'Full temperature performance test report' }
        ]
    },
     {
        id: 'displayUnit',
        title: 'Display Unit',
        part: 'additional',
        options: [
            { code: 'X1', description: '%' },
            { code: 'X2', description: 'mA' },
            { code: 'X3', description: 'Pa' },
            { code: 'X4', description: 'kPa' },
            { code: 'X5', description: 'MPa' },
            { code: 'X6', description: 'gf/cm²' },
            { code: 'X7', description: 'kgf/cm²' },
            { code: 'X8', description: 'mmH₂O' },
            { code: 'X9', description: 'mH₂O' },
            { code: 'XA', description: 'inH₂O' },
            { code: 'XB', description: 'ftH₂O' },
            { code: 'XC', description: 'mbar' },
            { code: 'XD', description: 'bar' },
            { code: 'XE', description: 'psi' },
            { code: 'XF', description: 'mmHg' },
            { code: 'XG', description: 'inHg' },
            { code: 'XH', description: 'Torr' },
            { code: 'XJ', description: 'atm' },
        ]
    },
];

const manifoldSpectrum: SelectionCategory[] = [
    {
        id: 'manifold_processConnection',
        title: 'Process Connection',
        part: 'manifold',
        options: [
            { code: 'P1', description: '1/2 - 14 NPT' },
            { code: 'P2', description: 'M20 x 1.5' },
            { code: 'P3', description: 'G1/2' },
        ]
    },
    {
        id: 'manifold_material',
        title: 'Body & Wetted Parts Material',
        part: 'manifold',
        options: [
            { code: 'M1', description: '304 SS' },
            { code: 'M2', description: '316 SS' },
            { code: 'M3', description: '316L SS' },
            { code: 'M4', description: 'Hastelloy C276' },
            { code: 'M5', description: 'Monel 400' },
        ]
    },
    {
        id: 'manifold_transmitterConnection',
        title: 'Transmitter Connection',
        part: 'manifold',
        options: [
            { code: 'C1', description: '1/2 - 14 NPT Male' },
            { code: 'C2', description: 'G1/2 Female' },
            { code: 'C3', description: 'M20 x 1.5 Female' },
            { code: 'C4', description: '1/2 - 14 NPT Female' },
        ]
    },
    {
        id: 'manifold_mountingBolts',
        title: 'Mounting Bolts',
        part: 'manifold',
        options: [{ code: 'BN', description: 'None' }]
    },
    {
        id: 'manifold_pressureRating',
        title: 'Pressure Rating',
        part: 'manifold',
        options: [
            { code: 'R1', description: '16 MPa' },
            { code: 'R2', description: '32 MPa' },
            { code: 'R3', description: '42 MPa' },
        ]
    },
    {
        id: 'manifold_sealType',
        title: 'Process Head Sealing Type',
        part: 'manifold',
        options: [
            { code: 'S1', description: 'Welded connection (ø14 x 2)' },
            { code: 'S2', description: 'Welded connection (ø14 x 3)' },
            { code: 'S3', description: 'Welded connection (ø16 x 3)' },
            { code: 'S4', description: 'Ferrule connection (1/4")' },
            { code: 'S5', description: 'Ferrule connection (3/8")' },
            { code: 'S6', description: 'Ferrule connection (7/16")' },
            { code: 'S7', description: 'Ferrule connection (ø14)' },
            { code: 'S8', description: 'Ferrule connection (ø12)' },
        ]
    },
    {
        id: 'manifold_temperature',
        title: 'Process Medium Temperature',
        part: 'manifold',
        options: [
            { code: 'T1', description: '-40 ~ +230 °C' },
            { code: 'T2', description: '-40 ~ +350 °C' },
        ]
    },
    {
        id: 'manifold_plug',
        title: 'Plug Type',
        part: 'manifold',
        options: [
            { code: 'D1', description: 'With drain plug' },
            { code: 'DN', description: 'Without drain plug' },
        ]
    },
    {
        id: 'manifold_additional',
        title: 'Additional Options',
        part: 'manifold',
        options: [
            { code: 'A1', description: 'None' },
            { code: 'A2', description: 'Degreasing wash' },
            { code: 'A3', description: 'NACE test' },
        ]
    },
];

export const productModels: ProductModel[] = [
    {
        id: 'RTX2300A',
        name: 'RTX2300-A',
        baseCode: 'RTX2300-A',
        description: 'Absolute Pressure Transmitter',
        configuration: [
            {
                id: 'wettedMaterial', title: 'Wetted Parts Material', part: 'required',
                options: [
                    { code: 'E', description: '316L SS / 316L SS' },
                    { code: 'F', description: 'Hastelloy C-276 / 316L SS' },
                    { code: 'G', description: 'Hastelloy C-276 / Hastelloy C-276' },
                ]
            },
            {
                id: 'diaphragmFillFluid', title: 'Diaphragm Fill Fluid', part: 'required',
                options: [{ code: 'D', description: 'Silicone Oil' }]
            },
            {
                id: 'pressureRange', title: 'Pressure Range', part: 'required',
                options: [
                    { code: 'A2', description: '0 to 40 kPa', min: 0, max: 40, unit: 'kPa', minSpan: 10 },
                    { code: 'A5', description: '0 to 200 kPa', min: 0, max: 200, unit: 'kPa', minSpan: 10 },
                    { code: 'A7', description: '0 to 1 MPa', min: 0, max: 1, unit: 'MPa', minSpan: 0.01 },
                    { code: 'A9', description: '0 to 5 MPa', min: 0, max: 5, unit: 'MPa', minSpan: 0.05 },
                ]
            },
            {
                id: 'processConnection', title: 'Process Connection', part: 'required',
                options: [
                    { code: '1', description: '1/2 - 14 NPT Female' },
                    { code: '2', description: '1/2 - 14 NPT Male' },
                    { code: '3', description: 'M20 x 1.5 Male' },
                    { code: '4', description: 'G1/2 B Male' },
                ]
            },
            {
                id: 'chamberBolts', title: 'Chamber Bolts', part: 'required',
                options: [{ code: '0', description: 'None' }]
            },
            ...sharedHousingAndExplosionOptions,
            ...sharedAdditionalOptions,
             {
                id: 'weldNeck', title: 'Weld Neck Connector', part: 'additional',
                options: [
                    { code: 'W1', description: '1/2-14 NPT Male, 304 SS' },
                    { code: 'W2', description: '1/2-14 NPT Male, 316 SS' },
                    { code: 'W3', description: '1/2-14 NPT Male, 316L SS' },
                    { code: 'W4', description: 'G1/2 Female, 304 SS' },
                    { code: 'W5', description: 'G1/2 Female, 316 SS' },
                    { code: 'W6', description: 'G1/2 Female, 316L SS' },
                    { code: 'W7', description: 'M20x1.5 Female, 304 SS' },
                    { code: 'W8', description: 'M20x1.5 Female, 316 SS' },
                    { code: 'W9', description: 'M20x1.5 Female, 316L SS' },
                    { code: 'WA', description: '1/2-14 NPT Female, 304 SS' },
                    { code: 'WB', description: '1/2-14 NPT Female, 316 SS' },
                    { code: 'WC', description: '1/2-14 NPT Female, 316L SS' },
                    { code: 'WN', description: 'None' }
                ],
                validate: validateWeldNeck_AG
            },
            ...sharedAdditionalOptions2,
            {
                id: 'manifold', title: 'Valve Manifold Assembly', part: 'additional',
                options: [
                    { code: 'V1', description: '2-valve manifold, not assembled' },
                    { code: 'V2', description: '2-valve manifold, assembled' },
                    { code: 'VN', description: 'No manifold' }
                ],
                validate: validateManifold_AG
            },
            {
                id: 'oRingMaterial', title: 'O-ring Material', part: 'additional',
                options: [{ code: 'X', description: 'None' }]
            },
            ...manifoldSpectrum
        ]
    },
    {
        id: 'RTX2400G',
        name: 'RTX2400-G',
        baseCode: 'RTX2400-G',
        description: 'Gauge Pressure Transmitter',
        configuration: [
            {
                id: 'wettedMaterial', title: 'Wetted Parts Material', part: 'required',
                options: [
                    { code: 'E', description: '316L SS / 316L SS' },
                    { code: 'F', description: 'Hastelloy C-276 / 316L SS' },
                    { code: 'G', description: 'Hastelloy C-276 / Hastelloy C-276' },
                ]
            },
            {
                id: 'diaphragmFillFluid', title: 'Diaphragm Fill Fluid', part: 'required',
                options: [{ code: 'D', description: 'Silicone Oil' }]
            },
            {
                id: 'pressureRange', title: 'Pressure Range', part: 'required',
                options: [
                    { code: 'G2', description: '-40 to 40 kPa', min: -40, max: 40, unit: 'kPa', minSpan: 0.8 },
                    { code: 'G4', description: '-100 to 200 kPa', min: -100, max: 200, unit: 'kPa', minSpan: 1 },
                    { code: 'G5', description: '-0.1 to 1 MPa', min: -0.1, max: 1, unit: 'MPa', minSpan: 0.01 },
                    { code: 'G6', description: '-0.1 to 5 MPa', min: -0.1, max: 5, unit: 'MPa', minSpan: 0.05 },
                    { code: 'G7', description: '-0.1 to 20 MPa', min: -0.1, max: 20, unit: 'MPa', minSpan: 0.2 },
                    { code: 'G8', description: '-0.1 to 40 MPa', min: -0.1, max: 40, unit: 'MPa', minSpan: 0.4 },
                    { code: 'G9', description: '-0.1 to 70 MPa', min: -0.1, max: 70, unit: 'MPa', minSpan: 0.7 },
                ]
            },
            {
                id: 'processConnection', title: 'Process Connection', part: 'required',
                options: [
                    { code: '1', description: '1/2 - 14 NPT Female' },
                    { code: '2', description: '1/2 - 14 NPT Male' },
                    { code: '3', description: 'M20 x 1.5 Male' },
                    { code: '4', description: 'G1/2 B Male' },
                ]
            },
            {
                id: 'chamberBolts', title: 'Chamber Bolts', part: 'required',
                options: [{ code: '0', description: 'None' }]
            },
            ...sharedHousingAndExplosionOptions,
            ...sharedAdditionalOptions,
            {
                id: 'weldNeck', title: 'Weld Neck Connector', part: 'additional',
                options: [
                    { code: 'W1', description: '1/2-14 NPT Male, 304 SS' },
                    { code: 'W2', description: '1/2-14 NPT Male, 316 SS' },
                    { code: 'W3', description: '1/2-14 NPT Male, 316L SS' },
                    { code: 'W4', description: 'G1/2 Female, 304 SS' },
                    { code: 'W5', description: 'G1/2 Female, 316 SS' },
                    { code: 'W6', description: 'G1/2 Female, 316L SS' },
                    { code: 'W7', description: 'M20x1.5 Female, 304 SS' },
                    { code: 'W8', description: 'M20x1.5 Female, 316 SS' },
                    { code: 'W9', description: 'M20x1.5 Female, 316L SS' },
                    { code: 'WA', description: '1/2-14 NPT Female, 304 SS' },
                    { code: 'WB', description: '1/2-14 NPT Female, 316 SS' },
                    { code: 'WC', description: '1/2-14 NPT Female, 316L SS' },
                    { code: 'WN', description: 'None' }
                ],
                validate: validateWeldNeck_AG
            },
            ...sharedAdditionalOptions2,
             {
                id: 'manifold', title: 'Valve Manifold Assembly', part: 'additional',
                options: [
                    { code: 'V1', description: '2-valve manifold, not assembled' },
                    { code: 'V2', description: '2-valve manifold, assembled' },
                    { code: 'VN', description: 'No manifold' }
                ],
                validate: validateManifold_AG
            },
            {
                id: 'oRingMaterial', title: 'O-ring Material', part: 'additional',
                options: [{ code: 'X', description: 'None' }]
            },
            ...manifoldSpectrum
        ]
    },
    {
        id: 'RTX2400K',
        name: 'RTX2400-K',
        baseCode: 'RTX2400-K',
        description: 'Differential Pressure Gauge Transmitter',
        configuration: [
            {
                id: 'wettedMaterial', title: 'Wetted Parts Material', part: 'required',
                options: [
                    { code: 'A', description: '316L SS' },
                    { code: 'B', description: 'Hastelloy C-276' }
                ]
            },
            {
                id: 'diaphragmFillFluid', title: 'Diaphragm Fill Fluid', part: 'required',
                options: [{ code: 'D', description: 'Silicone Oil' }]
            },
            {
                id: 'pressureRange', title: 'Pressure Range', part: 'required',
                options: [
                    { code: 'G2', description: '-40 to 40 kPa', min: -40, max: 40, unit: 'kPa', minSpan: 0.8 },
                    { code: 'G4', description: '-100 to 200 kPa', min: -100, max: 200, unit: 'kPa', minSpan: 1 },
                    { code: 'G5', description: '-0.1 to 1 MPa', min: -0.1, max: 1, unit: 'MPa', minSpan: 0.01 },
                    { code: 'G6', description: '-0.1 to 5 MPa', min: -0.1, max: 5, unit: 'MPa', minSpan: 0.05 },
                ]
            },
            {
                id: 'processConnection', title: 'Process Connection', part: 'required',
                options: [
                    { code: '5', description: '1/4 - 18 NPT Female, Rear Vent' },
                    { code: '6', description: '1/4 - 18 NPT Female, Side Vent' },
                ]
            },
            {
                id: 'chamberBolts', title: 'Chamber Bolts', part: 'required',
                options: [
                    { code: '1', description: 'SCM435 Alloy Steel' },
                    { code: '2', description: '304 SS' },
                    { code: '3', description: '316 SS' },
                ]
            },
            ...sharedHousingAndExplosionOptions,
            ...sharedAdditionalOptions,
            {
                 id: 'weldNeck', title: 'Weld Neck Connector', part: 'additional',
                 options: [{ code: 'WN', description: 'None' }],
                 validate: validateWeldNeck_KD,
            },
            ...sharedAdditionalOptions2,
            {
                id: 'manifold', title: 'Valve Manifold Assembly', part: 'additional',
                options: [
                    { code: 'V1', description: '2-valve manifold, not assembled' },
                    { code: 'V2', description: '2-valve manifold, assembled' },
                    { code: 'VN', description: 'No manifold' }
                ],
                validate: validateManifold_K
            },
            {
                id: 'oRingMaterial', title: 'O-ring Material', part: 'additional',
                options: [
                    { code: 'Z', description: 'Nitrile Rubber' },
                    { code: 'Y', description: 'Fluororubber' }
                ]
            },
            ...manifoldSpectrum
        ]
    },
    {
        id: 'RTX2500D',
        name: 'RTX2500-D',
        baseCode: 'RTX2500-D',
        description: 'Differential Pressure Transmitter',
        configuration: [
            {
                id: 'wettedMaterial', title: 'Wetted Parts Material', part: 'required',
                options: [
                    { code: 'A', description: '316L SS' },
                    { code: 'B', description: 'Hastelloy C-276' }
                ]
            },
            {
                id: 'diaphragmFillFluid', title: 'Diaphragm Fill Fluid', part: 'required',
                options: [{ code: 'D', description: 'Silicone Oil' }]
            },
            {
                id: 'pressureRange', title: 'Pressure Range', part: 'required',
                options: [
                    { code: 'B0', description: '-2 to 2 kPa (No center diaphragm)', min: -2, max: 2, unit: 'kPa', minSpan: 0.1 },
                    { code: 'D0', description: '-2 to 2 kPa', min: -2, max: 2, unit: 'kPa', minSpan: 0.1 },
                    { code: 'D1', description: '-10 to 10 kPa', min: -10, max: 10, unit: 'kPa', minSpan: 0.5 },
                    { code: 'D3', description: '-100 to 100 kPa', min: -100, max: 100, unit: 'kPa', minSpan: 1 },
                    { code: 'D5', description: '-0.5 to 1 MPa', min: -0.5, max: 1, unit: 'MPa', minSpan: 0.01 },
                    { code: 'D6', description: '-0.5 to 5 MPa', min: -0.5, max: 5, unit: 'MPa', minSpan: 0.05 },
                    { code: 'D7', description: '-0.5 to 14 MPa', min: -0.5, max: 14, unit: 'MPa', minSpan: 0.14 },
                ]
            },
            {
                id: 'processConnection', title: 'Process Connection', part: 'required',
                options: [
                    { code: '5', description: '1/4 - 18 NPT Female, Rear Vent' },
                    { code: '6', description: '1/4 - 18 NPT Female, Side Vent' },
                ]
            },
            {
                id: 'chamberBolts', title: 'Chamber Bolts', part: 'required',
                options: [
                    { code: '1', description: 'SCM435 Alloy Steel' },
                    { code: '2', description: '304 SS' },
                    { code: '3', description: '316 SS' },
                ]
            },
            ...sharedHousingAndExplosionOptions,
            ...sharedAdditionalOptions,
            {
                 id: 'weldNeck', title: 'Weld Neck Connector', part: 'additional',
                 options: [{ code: 'WN', description: 'None' }],
                 validate: validateWeldNeck_KD,
            },
            ...sharedAdditionalOptions2,
            {
                id: 'manifold', title: 'Valve Manifold Assembly', part: 'additional',
                options: [
                    { code: 'V3', description: '3-valve manifold, not assembled' },
                    { code: 'V4', description: '3-valve manifold, assembled' },
                    { code: 'V5', description: '5-valve manifold, not assembled' },
                    { code: 'V6', description: '5-valve manifold, assembled' },
                    { code: 'VN', description: 'No manifold' }
                ],
                validate: validateManifold_D
            },
            {
                id: 'oRingMaterial', title: 'O-ring Material', part: 'additional',
                options: [
                    { code: 'Z', description: 'Nitrile Rubber' },
                    { code: 'Y', description: 'Fluororubber' }
                ]
            },
            ...manifoldSpectrum
        ]
    }
];

// -- Performance Calculation Data and Functions --

type AccuracyFunction = (r: number) => number | null;
interface AccuracyInfo {
    func: AccuracyFunction;
    maxRatio: number;
}

const accuracyFunctions: { [modelId: string]: { [rangeCode: string]: AccuracyInfo } } = {
    'RTX2300A': {
        'A2': { func: (r) => r <= 4 ? 0.04 : null, maxRatio: 4 },
        'A5': { func: (r) => r <= 10 ? 0.04 : (r < 20 ? 0.004 + 0.0036 * r : null), maxRatio: 20 },
        'A7': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'A9': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
    },
    'RTX2400G': {
        'G2': { func: (r) => r <= 5 ? 0.04 : (r < 50 ? 0.004 + 0.0072 * r : null), maxRatio: 50 },
        'G4': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'G5': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'G6': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'G7': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'G8': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'G9': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
    },
    'RTX2400K': { // Same as RTX2400G
        'G2': { func: (r) => r <= 5 ? 0.04 : (r < 50 ? 0.004 + 0.0072 * r : null), maxRatio: 50 },
        'G4': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'G5': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'G6': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
    },
    'RTX2500D': {
        'B0': { func: (r) => r <= 20 ? 0.05 + 0.015 * r : null, maxRatio: 20 },
        'D0': { func: (r) => r <= 20 ? 0.05 + 0.015 * r : null, maxRatio: 20 },
        'D1': { func: (r) => r <= 20 ? 0.013 + 0.027 * r : null, maxRatio: 20 },
        'D3': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'D5': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'D6': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
        'D7': { func: (r) => r <= 10 ? 0.04 : (r < 100 ? 0.004 + 0.0036 * r : null), maxRatio: 100 },
    }
};

export const getAccuracyFunction = (modelId: string, rangeCode: string): AccuracyInfo | null => {
    return accuracyFunctions[modelId]?.[rangeCode] ?? null;
};

export const calculatePerformanceSpecs = (model: ProductModel, selections: Selections, ratio: number | null, t: TFunction) => {
    const r = ratio ?? 1; // Default to 1:1 if no ratio provided
    const specs: { [key: string]: { name: string, value: string } } = {};

    // Accuracy
    const accFunc = getAccuracyFunction(model.id, selections.pressureRange || '')?.func;
    const accuracyValue = accFunc ? accFunc(r) : null;
    specs.accuracy = {
        name: t('spec_accuracy'),
        value: accuracyValue !== null ? `±${accuracyValue.toFixed(4)} % FS` : t('spec_notApplicable')
    };

    // Long Term Stability
    specs.longTermStability = {
        name: t('spec_longTermStability'),
        value: `±0.1% URL / 10 ${t('spec_years')}`
    };
    
    // Temperature Effect
    const tempEffect = 0.06 * r + 0.01;
    let tempNote = t('spec_tempEffect_note');
    const rangeCat = model.configuration.find(c => c.id === 'pressureRange');
    const rangeOpt = rangeCat?.options.find(o => o.code === selections.pressureRange);
    if (rangeOpt && rangeOpt.unit === 'kPa' && rangeOpt.max && rangeOpt.max < 40) {
        tempNote = t('spec_tempEffect_note_doubled');
    }
    specs.temperatureEffect = {
        name: t('spec_temperatureEffect'),
        value: `±${tempEffect.toFixed(4)}% FS * N (${tempNote})`
    };

    // Vibration Effect
    const vibrationEffect = 0.03 + 0.0025 * r;
    specs.vibrationEffect = {
        name: t('spec_vibrationEffect'),
        value: `±${vibrationEffect.toFixed(4)} % FS`
    };

    // Power Supply Effect
    const powerSupplyEffect = 0.025 + 0.0025 * r;
    specs.powerSupplyEffect = {
        name: t('spec_powerSupplyEffect'),
        value: `±${powerSupplyEffect.toFixed(4)} % FS`
    };
    
    // Static Pressure Effects (for RTX2500D)
    if (model.id === 'RTX2500D' && selections.pressureRange) {
        const rangeCode = selections.pressureRange;
        let staticPressureEffect = '';
        if (['B0', 'D0'].includes(rangeCode)) {
            staticPressureEffect = `±${(0.2 * r).toFixed(2)}% FS / 200 kPa`
        } else if (rangeCode === 'D1') {
            staticPressureEffect = `±${(0.1 * r).toFixed(2)}% FS / 3.2 MPa`
        } else if (['D3', 'D5', 'D6', 'D7'].includes(rangeCode)) {
            staticPressureEffect = `±${(0.04 * r).toFixed(2)}% FS / 16 MPa`
        }
        if (staticPressureEffect) {
            specs.staticPressureEffect = {
                name: t('spec_staticPressureEffect'),
                value: staticPressureEffect
            }
        }
    }

    return specs;
};
