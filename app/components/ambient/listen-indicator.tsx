"use client";

/**
 * 차량 마이크 청취 표시 — /ambient 하단 중앙의 작은 알약.
 *
 * 관람객에게 "지금 말해도 된다"를 알리는 최소 신호다. 듣는 중이면 맥동하는 점과 중간 자막,
 * 서버가 발화를 받아 다음 스텝을 만드는 동안(paused)은 조용한 확인 문구만 보인다.
 * 마이크 권한 거부·네트워크 오류는 운영자가 볼 수 있게 붉게 표시한다.
 */
import { AnimatePresence, motion } from "framer-motion";
import type { CarListenerState } from "@/hooks/useCarListener";
import { cn } from "@/utils/cn";

export default function ListenIndicator({ state }: { state: CarListenerState }) {
  const { status, interim, pending, lastFinal, error } = state;
  if (status === "off" || status === "unsupported") return null;

  const isError = status === "error";
  // 듣는 중: 중간 자막 > 전송 대기(디바운스) 중인 누적 발화 > 안내 문구 순으로 보여 준다.
  const label = isError
    ? `마이크 오류: ${error ?? "알 수 없음"}`
    : status === "paused"
      ? lastFinal
        ? `전송됨 · "${lastFinal}"`
        : "잠시만요…"
      : interim || (pending ? `"${pending}"` : "듣고 있어요. 편하게 말씀해 주세요.");

  return (
    <AnimatePresence>
      <motion.div
        key="listen-indicator"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="pointer-events-none fixed bottom-[6vh] left-1/2 z-30 -translate-x-1/2"
      >
        <div
          className={cn(
            "flex max-w-[70vw] items-center gap-3 rounded-full px-5 py-3 text-[18px] backdrop-blur-2xl",
            isError ? "bg-red-900/50 text-red-200" : "bg-[#003A66]/40 text-[#9DE6FF]",
          )}
        >
          <span
            className={cn(
              "inline-block h-3 w-3 shrink-0 rounded-full",
              status === "listening" && "animate-pulse bg-[#9DE6FF]",
              status === "paused" && "bg-[#9DE6FF]/40",
              isError && "bg-red-400",
            )}
          />
          <span className={cn("truncate", status === "paused" && "opacity-70")}>{label}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
