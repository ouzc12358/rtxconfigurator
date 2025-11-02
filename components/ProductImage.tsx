
import React, { useState, useEffect } from 'react';
import type { ProductModel, Selections, ImageInfo } from '../types';
import * as images from '../images';

interface ProductImageProps {
    model: ProductModel;
    selections: Selections;
    onImageClick: (image: ImageInfo) => void;
}

// Sub-component to render a single image with its own loading and error states
const SingleImage: React.FC<{ src: string, alt: string, onClick: () => void }> = ({ src, alt, onClick }) => {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    useEffect(() => {
        setStatus('loading');
        const img = new Image();
        img.src = src;
        img.onload = () => setStatus('loaded');
        img.onerror = () => setStatus('error');
    }, [src]);

    return (
        <div 
            className="relative w-full aspect-square bg-gray-100 rounded-md overflow-hidden cursor-zoom-in group"
            onClick={onClick}
        >
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center" aria-label="Loading image">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}
            {status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-red-500 p-4" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-semibold">Image not found</p>
                </div>
            )}
            <img
                src={src}
                alt={alt}
                className={`absolute inset-0 object-contain w-full h-full transition-all duration-300 group-hover:scale-105 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                aria-hidden={status !== 'loaded'}
            />
        </div>
    );
};

const getImageSources = (model: ProductModel, selections: Selections): ImageInfo[] => {
    const result: ImageInfo[] = [];
    const { id: modelId } = model;
    const { manifold: manifoldSelection, pressureRange, processConnection } = selections;

    // 1. Base Transmitter Body Image
    if (modelId === 'RTX2300A' || modelId === 'RTX2400G') {
        result.push({
            src: images.base_rtx2300_2400g,
            alt: 'Technical drawing of RTX2300/2400G transmitter body',
            title: 'Transmitter Basic Shape'
        });
    } else if (modelId === 'RTX2400K' || modelId === 'RTX2500D') {
        result.push({
            src: images.base_rtx2400k_2500d,
            alt: 'Technical drawing of RTX2400K/2500D transmitter body',
            title: 'Transmitter Basic Shape'
        });
    }

    // 2. Pressure Connection Image (only for A and G models)
    if ((modelId === 'RTX2300A' || modelId === 'RTX2400G') && processConnection) {
        
        let isHighPressure = false;
        if (pressureRange) {
            const pressureCategory = model.configuration.find(c => c.id === 'pressureRange');
            const selectedOption = pressureCategory?.options.find(o => o.code === pressureRange);
            if (selectedOption?.max && selectedOption?.unit) {
                const maxPressure = selectedOption.max;
                const unit = selectedOption.unit;
                let maxInMpa = maxPressure;
                if (unit === 'kPa') {
                    maxInMpa = maxPressure / 1000;
                }
                // Check if max pressure is greater than 5 MPa
                if (maxInMpa > 5) {
                    isHighPressure = true;
                }
            }
        }

        let connSrc = '';
        if (isHighPressure) {
            if (processConnection === '1') connSrc = images.conn_gt_5mpa_npt_female;
            else if (processConnection === '2') connSrc = images.conn_gt_5mpa_npt_male;
            else if (processConnection === '3') connSrc = images.conn_gt_5mpa_m20_male;
            else if (processConnection === '4') connSrc = images.conn_gt_5mpa_g1_2_male;
        } else {
            if (processConnection === '1') connSrc = images.conn_le_5mpa_npt_female;
            else if (processConnection === '2') connSrc = images.conn_le_5mpa_npt_male;
            else if (processConnection === '3') connSrc = images.conn_le_5mpa_m20_male;
            else if (processConnection === '4') connSrc = images.conn_le_5mpa_g1_2_male;
        }

        if (connSrc) {
            result.push({
                src: connSrc,
                alt: 'Technical drawing of the selected pressure connection',
                title: 'Pressure Connection'
            });
        }
    }

    // 3. Valve Manifold Image
    if (manifoldSelection && manifoldSelection !== 'VN') {
        let manifoldSrc = '';
        if (modelId === 'RTX2300A' || modelId === 'RTX2400G') {
            manifoldSrc = images.manifold_2_valve_ag;
        } else if (modelId === 'RTX2400K') {
            manifoldSrc = images.manifold_2_valve_k;
        } else if (modelId === 'RTX2500D') {
            if (['V3', 'V4'].includes(manifoldSelection)) manifoldSrc = images.manifold_3_valve_d;
            if (['V5', 'V6'].includes(manifoldSelection)) manifoldSrc = images.manifold_5_valve_d;
        }
        if (manifoldSrc) {
            result.push({
                src: manifoldSrc,
                alt: 'Technical drawing of the selected valve manifold',
                title: 'Valve Manifold'
            });
        }
    }

    return result;
};


export const ProductImage: React.FC<ProductImageProps> = ({ model, selections, onImageClick }) => {
    const imageSources = getImageSources(model, selections);

    if (imageSources.length === 0) {
        return (
            <div className="relative w-full aspect-square bg-gray-100 rounded-md overflow-hidden flex items-center justify-center text-gray-500 text-center p-4">
                <p>Select options to view product images.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {imageSources.map((img, index) => (
                <div key={`${img.src}-${index}`}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">{img.title}</h3>
                    <SingleImage 
                        src={img.src} 
                        alt={img.alt}
                        onClick={() => onImageClick(img)}
                    />
                </div>
            ))}
        </div>
    );
};
