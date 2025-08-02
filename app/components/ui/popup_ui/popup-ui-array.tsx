'use client';

import { useEffect, useState } from "react";
import CommonPopupUI from "./common";

interface Asset {
    type: string;
    description: string;
    subtext_usp_pool?: string;
}

interface TimelineItem {
    parallel: boolean;
    assets: Asset[];
}

interface PopupUiArrayProps {
    assets_timeline: TimelineItem[];
    onComplete?: () => void;
    setQuestionFlag?: (flag: boolean) => void;
}

export default function PopupUiArray({ assets_timeline = [], onComplete, setQuestionFlag }: PopupUiArrayProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
    const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
    const popupShowTime = 1500;

    useEffect(() => {
        // assets_timeline이 null이거나 빈 배열일 경우 바로 questionFlag를 true로 설정
        if (!assets_timeline?.length) {
            setQuestionFlag?.(true);
            return;
        }

        const showNextAsset = () => {
            const currentTimelineItem = assets_timeline[currentIndex];
            if (!currentTimelineItem) {
                onComplete?.();
                // 모든 팝업을 보여준 후 questionFlag를 true로 설정
                setQuestionFlag?.(true);
                return;
            }

            const asset = currentTimelineItem.assets[currentAssetIndex];
            if (asset) {
                setCurrentAsset(asset);
                setCurrentAssetIndex(prev => prev + 1);
            } else {
                setCurrentIndex(prev => prev + 1);
                setCurrentAssetIndex(0);
                setCurrentAsset(null);
            }
        };

        const timer = setTimeout(showNextAsset, currentAsset ? popupShowTime : 0);

        return () => clearTimeout(timer);
    }, [assets_timeline, currentIndex, currentAssetIndex, currentAsset, onComplete, setQuestionFlag]);

    if (!currentAsset) return null;

    return (
        <CommonPopupUI
            keyName={currentAsset.type}
            text={currentAsset.description}
            description={currentAsset.subtext_usp_pool}
        />
    );
}