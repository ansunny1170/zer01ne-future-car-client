import { useScene } from "@/context/scene-context";
import CloneTalk from "../ui/clone-talk";
import QuestionArea from "./question-area";
import CommonPopupUI from "../ui/popup_ui/common";
import { useEffect, useState, useMemo } from "react";
import UspPopupBox from "../ui/usp-popup-ui";
import { cn } from "@/utils/cn";

export default function StepRepeat({ dafultComment }: { dafultComment?: string }) {
    const { stepInfo, setSfxPath } = useScene();
    const { assets_timeline, question, choices } = stepInfo || {};
    const [questionFlag, setQuestionFlag] = useState(false);
    const [componentsView, setComponentsView] = useState(false);
    // 현재 보여줄 timeline 인덱스
    const [currentIdx, setCurrentIdx] = useState(0);

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

    // 오디오(SFX, COMPANION_VOICE)만 존재하는 아이템 자동 진행 처리
    useEffect(() => {
        if (!assets_timeline) return;
        if (isTimelineFinished) return;

        const item = assets_timeline[currentIdx];

        // SFX 또는 COMPANION_VOICE만 있는 경우
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const audioAsset = item.assets.find(asset => asset.type === "COMPANION_VOICE" || asset.type === "VEHICLE_SOUND_EFFECT") as any;
        if (audioAsset) {
            // 사운드 설정
            setSfxPath(audioAsset.file_name || "");

            // 사운드 재생 시간을 알 수 없으므로 임의로 5초 후 다음으로 진행
            const timer = setTimeout(() => setCurrentIdx(idx => idx + 1), 5000);
            return () => clearTimeout(timer);
        }
    }, [assets_timeline, currentIdx, isTimelineFinished, setSfxPath]);

    // 질문 영역에 전달할 버튼 객체 변환
    const questionButtons = useMemo(() => {
        if (!choices) return {};
        return choices.reduce<Record<string, string>>((acc, choice, idx) => {
            acc[choice.usp || `choice-${idx}`] = choice.description;
            return acc;
        }, {});
    }, [choices]);

    // 현재 보여줄 콘텐츠 결정
    const renderContent = () => {
        if (!assets_timeline || isTimelineFinished) {
            // 모든 timeline 처리가 끝나면 null 반환 (questionFlag로 별도 렌더링)
            return null;
        }

        const item = assets_timeline[currentIdx];

        // CloneTalk이 포함된 경우
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cloneAsset = item.assets.find(asset => asset.type === "CLONE_TALKS") as any;
        if (cloneAsset && "text" in cloneAsset) {
            return (
                <CloneTalk
                    text={cloneAsset.text || ""}
                    onComplete={() => setCurrentIdx(idx => idx + 1)}
                />
            );
        }

        // parallel: true인 경우 FUNCTION_USP_POOL 여러 개를 동시에 표시
        const uspPoolAssets = item.assets.filter(asset => asset.type === "FUNCTION_USP_POOL");
        if (uspPoolAssets.length > 0) {
            // 2초 후 다음 타임라인으로 이동
            setTimeout(() => setCurrentIdx(idx => idx + 1), 2000);

            return (
                <div className="flex flex-col gap-4">
                    {uspPoolAssets.map((asset, index) => (
                        <UspPopupBox
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            key={`${currentIdx}-${index}`}
                            text={(asset as any).description}
                            className="w-full"
                        />
                    ))}
                </div>
            );
        }

        // 팝업 UI 처리 (DEFAULT_POPUP, FUNCTION_USP_POOL 등)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const popupAsset = item.assets.find(asset => [
            "DEFAULT_POPUP",
            "TRIGGER_POPUP",
        ].includes(asset.type)) as any;

        if (popupAsset) {
            // 1.5초 후 다음 타임라인으로 이동
            setTimeout(() => setCurrentIdx(idx => idx + 1), 1500);

            return (
                <CommonPopupUI
                    key={currentIdx}
                    keyName={popupAsset.type}
                    text={popupAsset.description}
                    description={popupAsset.subtext_usp_pool}
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
