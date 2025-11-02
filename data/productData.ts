
import type { ProductModel, SelectionValidationResult, Selections, SelectionCategory, Option } from '../types';

// Validation Functions
const validateElectricalConnector = (optionCode: string, selections: Selections): SelectionValidationResult => {
    const explosionProof = selections.explosionProof;
    const housingType = selections.housingType;

    if (!housingType) {
        return { isValid: false, reason: "Please select a 'Housing Type' first." };
    }

    // Thread type matching housing
    const isM20Connector = ['E1', 'E2', 'E3', 'E4', 'E5'].includes(optionCode);
    const isNPTConnector = ['E6', 'E7', 'E8', 'E9', 'EA'].includes(optionCode);

    if (isM20Connector && housingType !== '2') {
        return { isValid: false, reason: "Requires M20 housing (Type 2)." };
    }
    if (isNPTConnector && housingType !== '1') {
        return { isValid: false, reason: "Requires 1/2 NPT housing (Type 1)." };
    }
    
    // Explosion proof type matching
    if (explosionProof && ['D-', 'E-', 'F-'].includes(explosionProof)) { // Explosion proof types
        if (['E1', 'E6', 'E4', 'E5', 'E9', 'EA'].includes(optionCode)) { // Non-explosion proof connectors or dust plugs
            return { isValid: false, reason: `Not suitable for explosion proof type ${explosionProof}. Requires an explosion-proof electrical connector.` };
        }
    }
    return { isValid: true };
};

const validateManifold_AG = (optionCode: string, selections: Selections): SelectionValidationResult => {
    if (selections.weldNeck && selections.weldNeck !== 'WN') {
        return { isValid: false, reason: "Cannot select a manifold when a Weld Neck Connector is chosen." };
    }
    if (!['V1', 'V2', 'VN'].includes(optionCode)) {
        return { isValid: false, reason: "This model only supports 2-valve manifolds (V1, V2)." };
    }
    return { isValid: true };
};

const validateWeldNeck_AG = (optionCode: string, selections: Selections): SelectionValidationResult => {
    // "None" is always a valid choice.
    if (optionCode === 'WN') {
        return { isValid: true };
    }

    // Check for conflict with manifold selection.
    if (selections.manifold && selections.manifold !== 'VN') {
        return { isValid: false, reason: "Cannot select a Weld Neck Connector when a manifold is chosen." };
    }
    
    // A Process Connection must be selected first.
    const processConnection = selections.processConnection;
    if (!processConnection) {
        return { isValid: false, reason: "Please select a 'Process Connection' first to see compatible options."};
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
        return { isValid: false, reason: "Requires a male weld neck (W1, W2, W3) for a female process connection." };
    }
    if (isTransmitterMale) {
        return { isValid: false, reason: "Requires a female weld neck for a male process connection." };
    }

    // Fallback for any unforeseen case.
    return { isValid: false, reason: "Incompatible with selected Process Connection." };
};


const validateManifold_K = (optionCode: string, selections: Selections): SelectionValidationResult => {
     if (selections.weldNeck && selections.weldNeck !== 'WN') {
        return { isValid: false, reason: "Cannot select a manifold when a Weld Neck Connector is chosen." };
    }
    if (!['V1', 'V2', 'VN'].includes(optionCode)) {
        return { isValid: false, reason: "This model only supports 2-valve manifolds (V1, V2)." };
    }
    return { isValid: true };
};

const validateManifold_D = (optionCode: string, selections: Selections): SelectionValidationResult => {
    if (selections.weldNeck && selections.weldNeck !== 'WN') {
        return { isValid: false, reason: "Cannot select a manifold when a Weld Neck Connector is chosen." };
    }
    if (!['V3', 'V4', 'V5', 'V6', 'VN'].includes(optionCode)) {
        return { isValid: false, reason: "This model only supports 3-valve (V3, V4) and 5-valve (V5, V6) manifolds." };
    }
    return { isValid: true };
};

const validateWeldNeck_KD = (optionCode: string, selections: Selections): SelectionValidationResult => {
    if (optionCode !== 'WN') {
        return { isValid: false, reason: "Weld Neck Connectors are not applicable for this model." };
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
                    { code: 'A2', description: '0 to 40 kPa', min: 0, max: 40, unit: 'kPa' },
                    { code: 'A5', description: '0 to 200 kPa', min: 0, max: 200, unit: 'kPa' },
                    { code: 'A7', description: '0 to 1 MPa', min: 0, max: 1, unit: 'MPa' },
                    { code: 'A9', description: '0 to 5 MPa', min: 0, max: 5, unit: 'MPa' },
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
                    { code: 'G4', description: '-100 to 200 kPa', min: -100, max: 200, unit: 'kPa' },
                    { code: 'G5', description: '-0.1 to 1 MPa', min: -0.1, max: 1, unit: 'MPa' },
                    { code: 'G6', description: '-0.1 to 5 MPa', min: -0.1, max: 5, unit: 'MPa' },
                    { code: 'G7', description: '-0.1 to 20 MPa', min: -0.1, max: 20, unit: 'MPa' },
                    { code: 'G8', description: '-0.1 to 40 MPa', min: -0.1, max: 40, unit: 'MPa' },
                    { code: 'G9', description: '-0.1 to 70 MPa', min: -0.1, max: 70, unit: 'MPa' },
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
                    { code: 'G2', description: '-40 to 40 kPa', min: -40, max: 40, unit: 'kPa' },
                    { code: 'G4', description: '-100 to 200 kPa', min: -100, max: 200, unit: 'kPa' },
                    { code: 'G5', description: '-0.1 to 1 MPa', min: -0.1, max: 1, unit: 'MPa' },
                    { code: 'G6', description: '-0.1 to 5 MPa', min: -0.1, max: 5, unit: 'MPa' },
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
                    { code: 'B0', description: '-2 to 2 kPa (No center diaphragm)', min: -2, max: 2, unit: 'kPa' },
                    { code: 'D0', description: '-2 to 2 kPa', min: -2, max: 2, unit: 'kPa' },
                    { code: 'D1', description: '-10 to 10 kPa', min: -10, max: 10, unit: 'kPa' },
                    { code: 'D3', description: '-100 to 100 kPa', min: -100, max: 100, unit: 'kPa' },
                    { code: 'D5', description: '-0.5 to 1 MPa', min: -500, max: 1000, unit: 'kPa' },
                    { code: 'D6', description: '-0.5 to 5 MPa', min: -500, max: 5000, unit: 'kPa' },
                    { code: 'D7', description: '-0.5 to 14 MPa', min: -500, max: 14000, unit: 'kPa' },
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
