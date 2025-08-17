import { useScene } from "@/context/scene-context";
import { BASE_S3_LINK } from "@/constants";
import QuestionArea from "./question-area";
import CommonPopupUI from "../ui/popup_ui/common";
import { useEffect, useState, useMemo } from "react";
import UspPopupBox from "../ui/usp-popup-ui";
import { cn } from "@/utils/cn";
import UspPopupWrapper from "../ui/usp-popup-wrapper";
import CloneTalkSplit from "../ui/clone-talk-split";


export default function StepRepeat({ dafultComment }: { dafultComment?: string }) {
    const BASE_URL = BASE_S3_LINK;
    const { stepInfo, setSfxPath } = useScene();
    const { assets_timeline, question, choices } = stepInfo || {};
    const [questionFlag, setQuestionFlag] = useState(false);
    const [componentsView, setComponentsView] = useState(false);
    // 현재 보여줄 timeline 인덱스
    const [currentIdx, setCurrentIdx] = useState(0);
    const [currentUspPool, setCurrentUspPool] = useState<any[]>([]);
    const allSfx = useMemo(() =>
        assets_timeline?.flatMap(item =>
          item.assets
            .filter(a =>
              a.type === 'VEHICLE_SOUND_EFFECT' ||
              a.type === 'COMPANION_VOICE')
            .map(a => a.file_name)            // ★ 경로만 추출
        ) ?? [],
      [assets_timeline]);

    useEffect(() => {
        setSfxPath(allSfx as string[]);
    }, [allSfx]);

    // timeline 처리 완료 여부
    const isTimelineFinished = useMemo(() => {
        if (!assets_timeline) return true;
        return currentIdx >= assets_timeline.length;
    }, [assets_timeline, currentIdx]);

    // 타임라인이 끝났을 때 questionFlag를 true로 설정
    useEffect(() => {
        if (isTimelineFinished && !questionFlag) {
            setQuestionFlag(true);
        }
    }, [isTimelineFinished, questionFlag]);


    // FUNCTION_USP_POOL 순차 표시 처리 (parallel true 포함)
    useEffect(() => {
        if (!assets_timeline) return;
        if (isTimelineFinished) return;
        const item = assets_timeline[currentIdx];
        const uspPoolAssets = item.assets.filter(asset => asset.type === "FUNCTION_USP_POOL");
        if (uspPoolAssets.length > 0) {
            const timers: ReturnType<typeof setTimeout>[] = [];
            uspPoolAssets.forEach((asset, index) => {
                const timer = setTimeout(() => {
                    setCurrentUspPool(prev => [...prev, {
                        ...(asset as any),
                        description: (asset as any).description,
                    }]);
                }, index * 2000); // 2초 간격으로 순차 표시
                timers.push(timer);
            });
            const totalDuration = uspPoolAssets.length * 2000 + 1000; // 마지막 이후 1초
            const nextTimer = setTimeout(() => setCurrentIdx(idx => idx + 1), totalDuration);
            timers.push(nextTimer);
            return () => timers.forEach(clearTimeout);
        }
    }, [assets_timeline, currentIdx, isTimelineFinished]);

    // 현재 보여줄 콘텐츠 결정
    const renderContent = () => {  
        if (!assets_timeline || isTimelineFinished) {
            // 모든 timeline 처리가 끝나면 null 반환 (questionFlag로 별도 렌더링)
            return null;
        }

        const item = assets_timeline[currentIdx];
        console.log('Current timeline item:', currentIdx, item);

        // CloneTalk이 포함된 경우
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cloneAsset = item.assets.find(asset => asset.type === "CLONE_TALKS") as any;
        if (cloneAsset && "text" in cloneAsset) {
            return (
                <CloneTalkSplit
                    text={cloneAsset.text || ""}
                    onComplete={() => {
                        // 문장 완료 후 1초 간격을 두고 다음 타임라인으로 이동
                        setTimeout(() => setCurrentIdx(idx => idx + 1), 1000);
                    }}
                />
            );
        }

        // FUNCTION_USP_POOL 처리: effect에서 순차적으로 표시
        const uspPoolAssets = item.assets.filter(asset => asset.type === "FUNCTION_USP_POOL");
        if (uspPoolAssets.length > 0) {
            return null; // 화면 표시는 별도 effect에서 진행
        }

        // 팝업 UI 처리 (DEFAULT_POPUP, TRIGGER_POPUP 등)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const popupAsset = item.assets.find(asset => [
            "DEFAULT_POPUP",
            "TRIGGER_POPUP",
        ].includes(asset.type)) as any;

        if (popupAsset) {
            console.log('Rendering popup:', popupAsset);
            // id가 있으면 id를 keyName으로 사용, 없으면 type 사용
            const keyName = popupAsset.id ? popupAsset.id.toUpperCase() : popupAsset.type;
            return (
                <CommonPopupUI
                    key={currentIdx}
                    keyName={keyName}
                    text={popupAsset.description}
                    description={popupAsset.subtext_usp_pool}
                    onComplete={() => {
                        console.log('Popup completed, moving to next timeline');
                        // 팝업 완료 후 다음 타임라인으로 이동
                        setTimeout(() => setCurrentIdx(idx => idx + 1), 500);
                    }}
                />
            );
        }

        // 처리되지 않은 경우 바로 다음으로 진행
        setCurrentIdx(idx => idx + 1);
        return null;
    };


    useEffect(() => {
        setTimeout(() => {
            setComponentsView(true);
        }, 500);
    }, []);

    return (
        <div className={cn("absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 transition-all duration-300", componentsView && "opacity-100") }>
            {renderContent()}

            <UspPopupWrapper data={currentUspPool} />

            {questionFlag && (
                <QuestionArea 
                    mainText={question || ""} 
                    buttons={(choices || []).reduce((acc, choice) => {
                        acc[choice?.usp || ""] = choice?.description || "";
                        return acc;
                    }, {} as { [key: string]: string })} 
                    defaultComment={dafultComment}
                />
            )}
        </div>
    );
}
