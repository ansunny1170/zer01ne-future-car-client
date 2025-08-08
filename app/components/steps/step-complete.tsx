import { useScene } from "@/context/scene-context";
import CloneTalk from "../ui/clone-talk";
            import CommonPopupUI from "../ui/popup_ui/common";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/utils/cn";
import UspPopupWrapper from "../ui/usp-popup-wrapper";
import { motion } from "framer-motion";
import HyundaiLoading from "../ui/hyundai-loading";

export default function StepComplete() {
    const { stepInfo, setSfxPath, reStart } = useScene();
    const { assets_timeline, question, choices } = stepInfo || {};
    const [endFlag, setEndFlag] = useState(false);
    const [componentsView, setComponentsView] = useState(false);
    // 현재 보여줄 timeline 인덱스
    const [currentIdx, setCurrentIdx] = useState(0);
    const [currentUspPool, setCurrentUspPool] = useState<any[]>([]);

    // timeline 처리 완료 여부
    const isTimelineFinished = useMemo(() => {
        if (!assets_timeline) return true;
        return currentIdx >= assets_timeline.length;
    }, [assets_timeline, currentIdx]);

    // 타임라인 완료 시 1초 후 endFlag
    useEffect(() => {
        if (isTimelineFinished && !endFlag) {
            const timer = setTimeout(() => {
                setEndFlag(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isTimelineFinished, endFlag]);

    // assets_timeline 자체가 없을 때는 바로 endFlag 활성화
    useEffect(() => {
        if (!assets_timeline && !endFlag) {
            setEndFlag(true);
        }
    }, [assets_timeline, endFlag]);

    // 오디오(SFX, COMPANION_VOICE)만 존재하는 아이템 자동 진행 처리
    useEffect(() => {
        if (!assets_timeline) return;
        if (isTimelineFinished) return;

        const item = assets_timeline[currentIdx];

        // SFX 또는 COMPANION_VOICE만 있는 경우
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const audioAssets = item.assets.filter(asset => asset.type === "COMPANION_VOICE" || asset.type === "VEHICLE_SOUND_EFFECT") as any[];
        if (audioAssets.length > 0) {
            // 병렬(true) 여부와 상관없이, 여러 개의 효과음을 순차적으로 짧은 간격으로 재생한다.
            // (여러 오디오 태그를 동시에 컨트롤하기 어렵기 때문에 sfxPath를 빠르게 교체하는 방식 사용)
            const timers: ReturnType<typeof setTimeout>[] = [];

            audioAssets.forEach((asset, index) => {
                const timer = setTimeout(() => {
                    setSfxPath(asset.file_name || "");
                }, index * 1500); // 1.5초 간격으로 다음 효과음 재생
                timers.push(timer);
            });

            // 모든 효과음이 끝난 뒤(마지막 타이머 + 1초)에 다음 타임라인으로 이동
            const totalDuration = audioAssets.length * 1500 + 1000;
            const nextTimer = setTimeout(() => setCurrentIdx(idx => idx + 1), totalDuration);
            timers.push(nextTimer);

            return () => {
                timers.forEach(t => clearTimeout(t));
            };
        }
    }, [assets_timeline, currentIdx, isTimelineFinished, setSfxPath]);


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
                    onComplete={() => {
                        // 문장 완료 후 1초 간격을 두고 다음 타임라인으로 이동
                        setTimeout(() => setCurrentIdx(idx => idx + 1), 1000);
                    }}
                />
            );
        }

        // parallel: true인 경우 FUNCTION_USP_POOL 여러 개를 동시에 표시
        const uspPoolAssets = item.assets.filter(asset => asset.type === "FUNCTION_USP_POOL");
        if (uspPoolAssets.length > 0) {
            // 2초 후 다음 타임라인으로 이동
            setTimeout(() => setCurrentIdx(idx => idx + 1), 2000);

            setCurrentUspPool(prev => [...prev, ...uspPoolAssets.map(asset => (
                {
                    ...(asset as any),
                    description: (asset as any).description,
                }
            )).filter(asset => asset.description)]);
        }

        // 팝업 UI 처리 (DEFAULT_POPUP, FUNCTION_USP_POOL 등)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const popupAsset = item.assets.find(asset => [
            "DEFAULT_POPUP",
            "TRIGGER_POPUP",
        ].includes(asset.type)) as any;

        if (popupAsset) {
            // 3초 후 다음 타임라인으로 이동
            setTimeout(() => setCurrentIdx(idx => idx + 1), 3000);

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

    // 던축카 s카 누르면 첫 화면으로 이동 + re
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === "s" || event.key.toLowerCase() === "ㄴ") {
                reStart();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className={
            cn(
                "absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 transition-all duration-300",
                componentsView && "opacity-100",
            )
        }>
            {renderContent()}

            <UspPopupWrapper data={currentUspPool} />

            {
                endFlag && (
                    <div className="pl-8 absolute inset-0 text-white z-[22]">
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1 }}
                      className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center backdrop-blur-lg bg-black/10 z-[22]"
                    >
                      <h1 className="text-[96px] font-bold">체험이 모두 끝났습니다!</h1>
                      <HyundaiLoading/>
                      <p className="text-[45px] opacity-80">뒷쪽 출구로 퇴장해 주세요.</p>
                    </motion.div>
                  </div>
                )       
            }
        </div>
    );
}
