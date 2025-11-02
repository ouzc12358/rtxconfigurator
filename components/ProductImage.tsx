
import React, { useState, useEffect } from 'react';
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
    const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    useEffect(() => {
        // When the image URL changes, reset the status to loading.
        setImageStatus('loading');
    }, [imageUrl]);

    return (
        <div className="relative w-full aspect-square bg-gray-100 rounded-md overflow-hidden">
            {(imageStatus === 'loading') && (
                <div className="absolute inset-0 flex items-center justify-center" aria-label="Loading image">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
            
            {(imageStatus === 'error') && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-red-500 p-4" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-semibold">Image failed to load</p>
                 </div>
            )}

            <img 
                src={imageUrl}
                alt={`Technical drawing for ${model.name}`} 
                className={`absolute inset-0 object-contain w-full h-full transition-opacity duration-300 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageStatus('loaded')}
                onError={() => setImageStatus('error')}
                // Hide from screen readers if not loaded, the status messages handle it.
                aria-hidden={imageStatus !== 'loaded'}
            />
        </div>
    );
};
