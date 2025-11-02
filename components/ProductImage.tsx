
import React from 'react';
import type { ProductModel, Selections } from '../types';
import * as images from '../images';

interface ProductImageProps {
    model: ProductModel;
    selections: Selections;
}

const getImageSrc = (model: ProductModel, selections: Selections): string => {
    const { id: modelId } = model;
    const { manifold: manifoldSelection, pressureRange, processConnection } = selections;

    // --- 1. Check for Manifold Selection (Highest Priority) ---
    if (manifoldSelection && manifoldSelection !== 'VN') {
        if (modelId === 'RTX2300A' || modelId === 'RTX2400G') {
            return images.manifold_ag_2_valve;
        }
        if (modelId === 'RTX2400K') {
            return images.manifold_k_2_valve;
        }
        if (modelId === 'RTX2500D') {
            if (['V3', 'V4'].includes(manifoldSelection)) {
                return images.manifold_d_3_valve;
            }
            if (['V5', 'V6'].includes(manifoldSelection)) {
                return images.manifold_d_5_valve;
            }
        }
    }

    // --- 2. Check for Base Transmitter Body ---
    if (modelId === 'RTX2300A' || modelId === 'RTX2400G') {
        const highPressureRanges = ['G7', 'G8', 'G9'];
        const isHighPressure = pressureRange && highPressureRanges.includes(pressureRange);

        if (!processConnection) {
            return isHighPressure ? images.rtx2300_2400g_gt_5Mpa_base : images.rtx2300_2400g_le_5Mpa_base;
        }

        if (isHighPressure) {
            switch (processConnection) {
                case '1': return images.rtx2300_2400g_gt_5Mpa_conn_1;
                case '2': return images.rtx2300_2400g_gt_5Mpa_conn_2;
                case '3': return images.rtx2300_2400g_gt_5Mpa_conn_3;
                case '4': return images.rtx2300_2400g_gt_5Mpa_conn_4;
                default: return images.rtx2300_2400g_gt_5Mpa_base;
            }
        } else {
             switch (processConnection) {
                case '1': return images.rtx2300_2400g_le_5Mpa_conn_1;
                case '2': return images.rtx2300_2400g_le_5Mpa_conn_2;
                case '3': return images.rtx2300_2400g_le_5Mpa_conn_3;
                case '4': return images.rtx2300_2400g_le_5Mpa_conn_4;
                default: return images.rtx2300_2400g_le_5Mpa_base;
            }
        }
    }

    if (modelId === 'RTX2400K' || modelId === 'RTX2500D') {
        return images.rtx2400k_2500d_base;
    }

    // --- 3. Fallback to default ---
    return images.defaultImage;
};


export const ProductImage: React.FC<ProductImageProps> = ({ model, selections }) => {
    const imageUrl = getImageSrc(model, selections);

    return (
        <img 
            src={imageUrl}
            alt={`Technical drawing for ${model.name}`} 
            className="rounded-md object-contain w-full"
        />
    );
};
