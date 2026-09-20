"use client";

/**
 * 미래차 화면 단발 알림 팝업 — 서버 NoticeResponse(type:"notice")를 받아 잠깐 띄운다.
 *
 * DEFAULT_POPUP 컨셉을 그대로 따른다(BasicPopupBox 재사용) — 스텝 타임라인과 무관한
 * 비동기 안내용. 첫 용도는 수소충전 게이트: 관람객이 태블릿에서 수소충전을 확인하기 전에
 * S/D 로 발화하면 "태블릿에서 수소충전을 확인해 주세요"를 duration_ms(기본 3초) 동안 띄운다.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BasicPopupBox from "@/components/ui/popup_ui/basic-popup-box";
import { Icons } from "@/components/ui/icons";

export type NoticeMsg = {
  type: "notice";
  kind?: string;
  title: string;
  subtext?: string;
  duration_ms?: number;
};

// kind → 아이콘·톤 프리셋. 없는 kind 는 info 로 폴백.
const PRESET: Record<string, { icon: React.ReactNode; type: "warm" | "cold" }> = {
  hydrogen: { icon: <Icons.air />, type: "cold" },
  info: { icon: <Icons.alert />, type: "warm" },
};

export default function NoticePopup({ notice }: { notice: NoticeMsg | null }) {
  // notice 가 올 때마다 표시하고 duration 뒤 스스로 닫는다. 같은 내용이 연속으로 와도
  // key(seq)를 올려 재마운트 → 타이머가 새로 돈다.
  const [shown, setShown] = useState<NoticeMsg | null>(null);
  const [seq, setSeq] = useState(0);

  useEffect(() => {
    if (!notice) return;
    setShown(notice);
    setSeq((n) => n + 1);
    const dur = notice.duration_ms && notice.duration_ms > 0 ? notice.duration_ms : 3000;
    const t = setTimeout(() => setShown(null), dur);
    return () => clearTimeout(t);
  }, [notice]);

  const preset = shown ? PRESET[shown.kind ?? "info"] ?? PRESET.info : PRESET.info;

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          key={`notice-${seq}`}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="pointer-events-none fixed inset-x-0 top-[32%] z-40 flex justify-center"
        >
          <BasicPopupBox type={preset.type} className="!py-12 min-w-[520px]">
            <div className="text-white [&_svg]:h-16 [&_svg]:w-16">{preset.icon}</div>
            <p className="text-center text-[34px] font-semibold leading-snug">{shown.title}</p>
            {shown.subtext && (
              <p className="text-center text-[22px] text-white/70">{shown.subtext}</p>
            )}
          </BasicPopupBox>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
