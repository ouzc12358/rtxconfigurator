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
const sharedRequiredOptions: SelectionCategory[] = [
    {
        id: 'wettedMaterial',
        title: 'Wetted Parts Material',
        part: 'required',
        options: [
            { code: 'E', description: '316L SS / 316L SS' },
            { code: 'F', description: 'Hastelloy C-276 / 316L SS' },
            { code: 'G', description: 'Hastelloy C-276 / Hastelloy C-276' },
        ]
    },
    {
        id: 'diaphragmFillFluid',
        title: 'Diaphragm Fill Fluid',
        part: 'required',
        options: [{ code: 'D', description: 'Silicone Oil' }]
    },
];

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
            { code: 'F-', description: 'NEPSI: Ex ec IIC T6 Gc' }
        ]
    }
];

const electricalConnectors: Option[] = [
    { code: 'E1', description: 'Plastic Gland M20x1.5' },
    { code: 'E2', description: '304 SS Explosion-proof Gland M20x1.5' },
    { code: 'E3', description: '316 SS Explosion-proof Gland M20x1.5' },
    { code: 'E4', description: 'Plastic Dust Plug M20x1.5' },
    { code: 'E5', description: 'Metal Dust Plug M20x1.5' },
    { code: 'E6', description: 'Plastic Gland 1/2-14NPT' },
    { code: 'E7', description: '304 SS Explosion-proof Gland 1/2-14NPT' },
    { code: 'E8', description: '316 SS Explosion-proof Gland 1/2-14NPT' },
    { code: 'E9', description: 'Plastic Dust Plug 1/2-14NPT' },
    { code: 'EA', description: 'Metal Dust Plug 1/2-14NPT' }
];

const displayUnits: Option[] = [
    { code: 'X1', description: '%' }, { code: 'X2', description: 'mA' },
    { code: 'X3', description: 'Pa' }, { code: 'X4', description: 'kPa' },
    { code: 'X5', description: 'MPa' }, { code: 'X6', description: 'gf/cm²' },
    { code: 'X7', description: 'kgf/cm²' }, { code: 'X8', description: 'mmH₂O' },
    { code: 'X9', description: 'mH₂O' }, { code: 'XA', description: 'inH₂O' },
    { code: 'XB', description: 'ftH₂O' }, { code: 'XC', description: 'mbar' },
    { code: 'XD', description: 'bar' }, { code: 'XE', description: 'psi' },
    { code: 'XF', description: 'mmHg' }, { code: 'XG', description: 'inHg' },
    { code: 'XH', description: 'Torr' }, { code: 'XJ', description: 'atm' },
    { code: 'XK', description: 'i4H₂O' }, { code: 'XL', description: 'm4H₂O' },
    { code: 'XM', description: 'm' }, { code: 'XN', description: 'mm' }
];

const allManifoldOptions: Option[] = [
    { code: 'VN', description: 'No manifold' },
    { code: 'V1', description: '2-Valve Manifold, not assembled' },
    { code: 'V2', description: '2-Valve Manifold, assembled' },
    { code: 'V3', description: '3-Valve Manifold, not assembled' },
    { code: 'V4', description: '3-Valve Manifold, assembled' },
    { code: 'V5', description: '5-Valve Manifold, not assembled' },
    { code: 'V6', description: '5-Valve Manifold, assembled' },
];

const allWeldNeckOptions: Option[] = [
    { code: 'WN', description: 'No weld neck connector' },
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
];

// Manifold Spectrum Options
const manifoldSpectrum: SelectionCategory[] = [
    {
        id: 'manifold_processConnection',
        title: 'Process Connection',
        part: 'manifold',
        options: [
            { code: 'P1', description: '1/2 - 14 NPT female' },
            { code: 'P2', description: 'M20 x 1.5 female' },
            { code: 'P3', description: 'G1/2 female' },
        ]
    },
    {
        id: 'manifold_material',
        title: 'Manifold Body & Wetted Parts Material',
        part: 'manifold',
        options: [
            { code: 'M1', description: '304 SS' },
            { code: 'M2', description: '316 SS' },
            { code: 'M3', description: '316L SS' },
            { code: 'M4', description: 'Hastelloy C-276' },
            { code: 'M5', description: 'Monel 400' },
        ]
    },
    {
        id: 'manifold_transmitterConnection',
        title: 'Transmitter Connection',
        part: 'manifold',
        options: [
            { code: 'C1', description: '1/2 - 14 NPT male' },
            { code: 'C2', description: 'G1/2 female' },
            { code: 'C3', description: 'M20 x 1.5 female' },
            { code: 'C4', description: '1/2 - 14 NPT female' },
            { code: 'C5', description: 'Flange connection' },
        ]
    },
     {
        id: 'manifold_mountingBolts',
        title: 'Mounting Bolts',
        part: 'manifold',
        options: [
            { code: 'BN', description: 'No mounting bolts' },
            { code: 'B1', description: '7/16-20 UNF-2B' },
            { code: 'B2', description: 'M10 x 1.5 - 6H' },
        ]
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
        title: 'Process Connector Seal Type',
        part: 'manifold',
        options: [
            { code: 'S1', description: 'Welded connection (Φ14 x 2)' },
            { code: 'S2', description: 'Welded connection (Φ14 x 3)' },
            { code: 'S3', description: 'Welded connection (Φ16 x 3)' },
            { code: 'S4', description: 'Ferrule connection (1/4")' },
            { code: 'S5', description: 'Ferrule connection (3/8")' },
            { code: 'S6', description: 'Ferrule connection (7/16")' },
            { code: 'S7', description: 'Ferrule connection (Φ14)' },
            { code: 'S8', description: 'Ferrule connection (Φ12)' },
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
            { code: 'D1', description: 'With drain/vent plug' },
            { code: 'DN', description: 'Without drain/vent plug' },
        ]
    },
    {
        id: 'manifold_additional',
        title: 'Additional Options',
        part: 'manifold',
        options: [
            { code: 'A1', description: 'None' },
            { code: 'A2', description: 'Degreasing' },
            { code: 'A3', description: 'NACE test' },
        ]
    }
];

// Model-specific configurations
const rtx2300a_config: SelectionCategory[] = [
    {
        id: 'pressureType',
        title: 'Pressure Type',
        part: 'required',
        options: [{ code: 'A', description: 'Absolute' }]
    },
    ...sharedRequiredOptions,
    {
        id: 'pressureRange',
        title: 'Pressure Range',
        part: 'required',
        options: [
            { code: 'A2', description: '0 to 40 kPa', min: 0, max: 40, unit: 'kPa' },
            { code: 'A5', description: '0 to 200 kPa', min: 0, max: 200, unit: 'kPa' },
            { code: 'A7', description: '0 to 1 MPa', min: 0, max: 1, unit: 'MPa' },
            { code: 'A9', description: '0 to 5 MPa', min: 0, max: 5, unit: 'MPa' },
        ]
    },
    {
        id: 'processConnection',
        title: 'Process Connection',
        part: 'required',
        options: [
            { code: '1', description: '1/2 - 14 NPT Female' },
            { code: '2', description: '1/2 - 14 NPT Male' },
            { code: '3', description: 'M20 x 1.5 Male' },
            { code: '4', description: 'G1/2 B Male' },
        ]
    },
    {
        id: 'chamberBolts',
        title: 'Chamber Bolts',
        part: 'required',
        options: [{ code: '0', description: 'None' }]
    },
    ...sharedHousingAndExplosionOptions,
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
            { code: 'BN', description: 'None' },
        ]
    },
    {
        id: 'electricalConnector',
        title: 'Electrical Connector',
        part: 'additional',
        options: electricalConnectors,
        validate: validateElectricalConnector,
    },
    {
        id: 'weldNeck',
        title: 'Weld Neck Connector',
        part: 'additional',
        options: allWeldNeckOptions,
        validate: validateWeldNeck_AG,
    },
    {
        id: 'additionalCert',
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
            { code: 'B', description: 'Lightning protection' }
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
        id: 'acceptanceDocs',
        title: 'Acceptance Documents',
        part: 'additional',
        options: [
            { code: 'E', description: 'None' },
            { code: 'F1', description: 'Submit acceptance documents' }
        ]
    },
    {
        id: 'displayUnit',
        title: 'Display Unit',
        part: 'additional',
        options: displayUnits
    },
    {
        id: 'outputUnit',
        title: 'Output Units',
        part: 'additional',
        options: displayUnits
    },
    {
        id: 'manifold',
        title: 'Valve Manifold',
        part: 'additional',
        options: allManifoldOptions,
        validate: validateManifold_AG,
    },
    {
        id: 'sealMaterial',
        title: 'Seal Material',
        part: 'additional',
        options: [{ code: 'X', description: 'None' }]
    },
    ...manifoldSpectrum
];

const rtx2400g_config: SelectionCategory[] = [
    {
        id: 'pressureType',
        title: 'Pressure Type',
        part: 'required',
        options: [{ code: 'G', description: 'Gauge' }]
    },
    ...sharedRequiredOptions,
    {
        id: 'pressureRange',
        title: 'Pressure Range',
        part: 'required',
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
        id: 'processConnection',
        title: 'Process Connection',
        part: 'required',
        options: [
            { code: '1', description: '1/2 - 14 NPT Female' },
            { code: '2', description: '1/2 - 14 NPT Male' },
            { code: '3', description: 'M20 x 1.5 Male' },
            { code: '4', description: 'G1/2 B Male' },
        ]
    },
    {
        id: 'chamberBolts',
        title: 'Chamber Bolts',
        part: 'required',
        options: [{ code: '0', description: 'None' }]
    },
    ...sharedHousingAndExplosionOptions,
    // Additional options are identical to 2300A
    ...rtx2300a_config.filter(c => c.part === 'additional' || c.part === 'manifold')
];

const rtx2400k_config: SelectionCategory[] = [
    {
        id: 'pressureType',
        title: 'Pressure Type',
        part: 'required',
        options: [{ code: 'K', description: 'Differential Pressure Gauge' }]
    },
    {
        id: 'wettedMaterial',
        title: 'Wetted Parts Material',
        part: 'required',
        options: [
            { code: 'A', description: '316L SS' },
            { code: 'B', description: 'Hastelloy C-276' }
        ]
    },
    {
        id: 'diaphragmFillFluid',
        title: 'Diaphragm Fill Fluid',
        part: 'required',
        options: [{ code: 'D', description: 'Silicone Oil' }]
    },
    {
        id: 'pressureRange',
        title: 'Pressure Range',
        part: 'required',
        options: [
            { code: 'G2', description: '-40 to 40 kPa', min: -40, max: 40, unit: 'kPa' },
            { code: 'G4', description: '-100 to 200 kPa', min: -100, max: 200, unit: 'kPa' },
            { code: 'G5', description: '-0.1 to 1 MPa', min: -0.1, max: 1, unit: 'MPa' },
            { code: 'G6', description: '-0.1 to 5 MPa', min: -0.1, max: 5, unit: 'MPa' },
        ]
    },
    {
        id: 'processConnection',
        title: 'Process Connection',
        part: 'required',
        options: [
            { code: '5', description: '1/4 - 18 NPT Female, Rear Vent' },
            { code: '6', description: '1/4 - 18 NPT Female, Side Vent' }
        ]
    },
    {
        id: 'chamberBolts',
        title: 'Chamber Bolts',
        part: 'required',
        options: [
            { code: '1', description: 'Carbon Steel' },
            { code: '2', description: '316 SS' }
        ]
    },
    ...sharedHousingAndExplosionOptions,
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
            { code: 'BN', description: 'None' },
        ]
    },
    {
        id: 'electricalConnector',
        title: 'Electrical Connector',
        part: 'additional',
        options: electricalConnectors,
        validate: validateElectricalConnector,
    },
    {
        id: 'weldNeck',
        title: 'Weld Neck Connector',
        part: 'additional',
        options: allWeldNeckOptions,
        validate: validateWeldNeck_KD,
    },
    {
        id: 'additionalCert',
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
            { code: 'B', description: 'Lightning protection' }
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
        id: 'acceptanceDocs',
        title: 'Acceptance Documents',
        part: 'additional',
        options: [
            { code: 'E', description: 'None' },
            { code: 'F1', description: 'Submit acceptance documents' }
        ]
    },
    {
        id: 'displayUnit',
        title: 'Display Unit',
        part: 'additional',
        options: displayUnits
    },
    {
        id: 'outputUnit',
        title: 'Output Units',
        part: 'additional',
        options: displayUnits
    },
    {
        id: 'manifold',
        title: 'Valve Manifold',
        part: 'additional',
        options: allManifoldOptions,
        validate: validateManifold_K,
    },
    {
        id: 'sealMaterial',
        title: 'Seal Material',
        part: 'additional',
        options: [{ code: 'X', description: 'None' }]
    },
    ...manifoldSpectrum
];

const rtx2500d_config: SelectionCategory[] = [
    {
        id: 'pressureType',
        title: 'Pressure Type',
        part: 'required',
        options: [{ code: 'D', description: 'Differential Pressure' }]
    },
    {
        id: 'wettedMaterial',
        title: 'Wetted Parts Material',
        part: 'required',
        options: [
            { code: 'A', description: '316L SS' },
            { code: 'B', description: 'Hastelloy C-276' }
        ]
    },
    {
        id: 'diaphragmFillFluid',
        title: 'Diaphragm Fill Fluid',
        part: 'required',
        options: [{ code: 'D', description: 'Silicone Oil' }]
    },
    {
        id: 'pressureRange',
        title: 'Pressure Range',
        part: 'required',
        options: [
            { code: 'D2', description: '-6 to 6 kPa', min: -6, max: 6, unit: 'kPa' },
            { code: 'D3', description: '-40 to 40 kPa', min: -40, max: 40, unit: 'kPa' },
            { code: 'D4', description: '-200 to 200 kPa', min: -200, max: 200, unit: 'kPa' },
            { code: 'D5', description: '-1 to 1 MPa', min: -1, max: 1, unit: 'MPa' },
        ]
    },
    {
        id: 'processConnection',
        title: 'Process Connection',
        part: 'required',
        options: [
            { code: '5', description: '1/4 - 18 NPT Female, Rear Vent' },
            { code: '6', description: '1/4 - 18 NPT Female, Side Vent' }
        ]
    },
    {
        id: 'chamberBolts',
        title: 'Chamber Bolts',
        part: 'required',
        options: [
            { code: '1', description: 'Carbon Steel' },
            { code: '2', description: '316 SS' }
        ]
    },
    ...sharedHousingAndExplosionOptions,
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
            { code: 'BN', description: 'None' },
        ]
    },
    {
        id: 'electricalConnector',
        title: 'Electrical Connector',
        part: 'additional',
        options: electricalConnectors,
        validate: validateElectricalConnector,
    },
    {
        id: 'weldNeck',
        title: 'Weld Neck Connector',
        part: 'additional',
        options: allWeldNeckOptions,
        validate: validateWeldNeck_KD,
    },
    {
        id: 'additionalCert',
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
            { code: 'B', description: 'Lightning protection' }
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
        id: 'acceptanceDocs',
        title: 'Acceptance Documents',
        part: 'additional',
        options: [
            { code: 'E', description: 'None' },
            { code: 'F1', description: 'Submit acceptance documents' }
        ]
    },
    {
        id: 'displayUnit',
        title: 'Display Unit',
        part: 'additional',
        options: displayUnits
    },
    {
        id: 'outputUnit',
        title: 'Output Units',
        part: 'additional',
        options: displayUnits
    },
    {
        id: 'manifold',
        title: 'Valve Manifold',
        part: 'additional',
        options: allManifoldOptions,
        validate: validateManifold_D,
    },
    {
        id: 'sealMaterial',
        title: 'Seal Material',
        part: 'additional',
        options: [{ code: 'X', description: 'None' }]
    },
    ...manifoldSpectrum
];

export const productModels: ProductModel[] = [
    {
        id: 'RTX2300A',
        name: 'RTX 2300A',
        baseCode: '2300A',
        description: 'Absolute Pressure Transmitter',
        configuration: rtx2300a_config,
    },
    {
        id: 'RTX2400G',
        name: 'RTX 2400G',
        baseCode: '2400G',
        description: 'Gauge Pressure Transmitter',
        configuration: rtx2400g_config,
    },
    {
        id: 'RTX2400K',
        name: 'RTX 2400K',
        baseCode: '2400K',
        description: 'Differential Pressure Gauge Transmitter',
        configuration: rtx2400k_config,
    },
    {
        id: 'RTX2500D',
        name: 'RTX 2500D',
        baseCode: '2500D',
        description: 'Differential Pressure Transmitter',
        configuration: rtx2500d_config,
    },
];
