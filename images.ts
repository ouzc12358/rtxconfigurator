// Base transmitter bodies. Sourced from PDF diagrams 3.4.1 and 3.4.4.
export const base_rtx2300_2400g = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/RTX2300%2C%20RTX2400-G%20%E5%9F%BA%E6%9C%AC%E5%B0%BA%E5%AF%B8.png';
export const base_rtx2400k_2500d = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/RTX2400K,RTX2500D%E5%9F%BA%E6%9C%AC%E5%B0%BA%E5%AF%B8.png';

// Pressure connections for RTX2300/2400G (<= 5MPa). Sourced from PDF diagram 3.4.2.
export const conn_le_5mpa_npt_female = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/Process%20Connection(Pressure%3C%3D5MPa)%201-2NPT%20Female.png';
export const conn_le_5mpa_npt_male = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/Process%20Connection(Pressure%3C%3D5MPa)%201-2NPT%20Male.png';
export const conn_le_5mpa_m20_male = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/Process%20Connection(Pressure%3C%3D5MPa)%20M20x1.5%20Male.png';
export const conn_le_5mpa_g1_2_male = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/Process%20Connection(Pressure%3C%3D5MPa)%20G1-2B%20Male.png';

// Pressure connections for RTX2300/2400G (> 5MPa). Sourced from PDF diagram 3.4.3.
export const conn_gt_5mpa_npt_female = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/Process%20Connection(Pressure%3E5MPa)%201-2NPT%20Female.png';
export const conn_gt_5mpa_npt_male = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/Process%20Connection(Pressure%3E5MPa)%201-2NPT%20Male.png';
export const conn_gt_5mpa_m20_male = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/Process%20Connection(Pressure%3E5MPa)%20M20x1.5%20Male.png';
export const conn_gt_5mpa_g1_2_male = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/Process%20Connection(Pressure%3E5MPa)%20G1-2B%20Male.png';

// Note: RTX2400K and RTX2500D connections are integrated into the base body, so no separate connection image is typically shown.

// Valve manifolds. Sourced from PDF section 3.5.
export const manifold_2_valve_ag = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/2%20Valve%20Manifold%20for%20RTX2300A%26RTX2400G.png';
export const manifold_2_valve_k = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/2%20Valve%20Manifold%20for%20RTX2400K.png';
export const manifold_3_valve_d = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/3%20Valve%20Manifold%20for%20RTX2500D.png';
export const manifold_5_valve_d = 'https://raw.githubusercontent.com/ouzc12358/rtxconfigurator/main/picture/5%20Valve%20Manifold%20for%20RTX2500D.png';

// Fallback default image
export const defaultImage = base_rtx2300_2400g;