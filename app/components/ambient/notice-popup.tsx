"use client";

/**
 * 미래차 화면 알림 팝업 — 서버 NoticeResponse(type:"notice")를 받아 띄운다.
 *
 * DEFAULT_POPUP 컨셉을 그대로 따른다(BasicPopupBox 재사용) — 스텝 타임라인과 무관한
 * 비동기 안내용. 첫 용도는 수소충전 게이트: step1 렌더 완료 후 관람객이 태블릿에서
 * 수소충전을 확인하기 전까지 "태블릿에서 수소충전을 확인해 주세요"를 계속 띄운다.
 *
 * 표시 방식(서버 NoticeResponse 와 1:1):
 * - sticky=false(기본): duration_ms(기본 3초) 뒤 스스로 사라진다.
 * - sticky=true: 자동으로 사라지지 않고, 같은 kind 의 clear 가 올 때까지 유지한다.
 * - clear=true: 같은 kind 의 (sticky) 팝업을 내린다. title 은 무시.
 *
 * onStickyChange: sticky 팝업이 떠 있는 동안 true. page 가 이걸 받아 게이트 중에는
 * 발화 유도(마이크·질문 UI)를 막는다.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BasicPopupBox from "@/components/ui/popup_ui/basic-popup-box";
import { Icons } from "@/components/ui/icons";

export type NoticeMsg = {
  type: "notice";
  kind?: string;
  title: string;
  subtext?: string;
  duration_ms?: number;
  sticky?: boolean;
  clear?: boolean;
};

// kind → 아이콘·톤 프리셋. 없는 kind 는 info 로 폴백.
const PRESET: Record<string, { icon: React.ReactNode; type: "warm" | "cold" }> = {
  hydrogen: { icon: <Icons.air />, type: "cold" },
  info: { icon: <Icons.alert />, type: "warm" },
};

export default function NoticePopup({
  notice,
  onStickyChange,
}: {
  notice: NoticeMsg | null;
  onStickyChange?: (active: boolean) => void;
}) {
  const [shown, setShown] = useState<NoticeMsg | null>(null);
  const [seq, setSeq] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!notice) return;
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    // clear: 같은 kind 의 현재 팝업을 내린다(다른 kind 면 무시).
    if (notice.clear) {
      setShown((prev) => {
        if (prev && (prev.kind ?? "info") === (notice.kind ?? "info")) {
          clearTimer();
          return null;
        }
        return prev;
      });
      return;
    }

    clearTimer();
    setShown(notice);
    setSeq((n) => n + 1);
    // sticky 는 타이머를 걸지 않는다 — clear 가 올 때까지 유지.
    if (!notice.sticky) {
      const dur = notice.duration_ms && notice.duration_ms > 0 ? notice.duration_ms : 3000;
      timerRef.current = setTimeout(() => setShown(null), dur);
    }
    return clearTimer;
  }, [notice]);

  // sticky 팝업이 떠 있는지 상위에 알린다(게이트 판정).
  useEffect(() => {
    onStickyChange?.(!!(shown && shown.sticky));
  }, [shown, onStickyChange]);

  const preset = shown ? PRESET[shown.kind ?? "info"] ?? PRESET.info : PRESET.info;

  return (
    <AnimatePresence>
      {shown && (
        <div key={`notice-${seq}`} className="pointer-events-none fixed inset-0 z-40">
          {/* 배경 블러 — 대기/로딩/엔딩 오버레이와 동일한 관례(backdrop-blur-lg bg-black/10) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 bg-black/30 backdrop-blur-2xl"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-x-0 top-[32%] flex justify-center"
          >
            <BasicPopupBox type={preset.type} className="!py-12 min-w-[520px]">
              <div className="text-white [&_svg]:h-16 [&_svg]:w-16">{preset.icon}</div>
              <p className="text-center text-[34px] font-semibold leading-snug">{shown.title}</p>
              {shown.subtext && (
                <p className="text-center text-[22px] text-white/70">{shown.subtext}</p>
              )}
            </BasicPopupBox>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
