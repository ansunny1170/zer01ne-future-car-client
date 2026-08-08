"use client";

import { cn } from "@/utils/cn";

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
}

// 🥚 개발자 전용: main-2026(ambient) 진행 설명서 모달
export default function GuideModal({ open, onClose }: GuideModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-[90vw] max-w-3xl max-h-[85vh] overflow-y-auto",
          "bg-white text-black rounded-2xl p-8 shadow-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-black text-lg"
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>

        <h1 className="text-2xl font-bold mb-6">main-2026 (ambient) 진행 설명서</h1>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">1) 전체 전시 구성</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>OC 서버(오케스트레이터): 페르소나·여정(plan)의 단일 출처. MQTT로 발행.</li>
            <li>tablet-fe: 관람객이 드는 리모컨. enter / start / advance / exit 를 발행.</li>
            <li>미래차 서버: plan을 받아 스텝별 화면 데이터를 LLM으로 미리 생성하고, tablet 신호에 맞춰 송출.</li>
            <li>미래차 화면(이 화면): 서버가 보낸 스텝 데이터를 렌더링.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">2) 여정 데이터(plan)를 받는 시점</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>관람객이 페르소나를 선택(로그인)하면 OC가 그 페르소나의 active plan을 발행한다.</li>
            <li>
              토픽: <code className="bg-black/5 px-1 rounded">orchestration/{"{session_id}"}/future-car/request</code> 의{" "}
              <code className="bg-black/5 px-1 rounded">{"{\"type\":\"plan\"}"}</code>
            </li>
            <li>plan = persona + stops[] (stop 1개 = step 1개, 보통 4개: 경유지 / 충전소 / 목적지)</li>
            <li>관리자가 백오피스에서 수동으로 재발행할 수도 있다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">3) 미래차 서버의 처리</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>plan을 받는 즉시 백그라운드에서 step1→N을 순차로 LLM 생성한다(앞 스텝을 기억하며 이어 생성).</li>
            <li>생성 결과는 classic과 동일한 StepInfo 형식이며 chat_history 테이블에 저장된다.</li>
            <li>관람객이 이동하는 동안 미리 전부 만들어 두므로 진행 중 지연이 없다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">4) 스텝 진행 (tablet 버튼 → 이 화면)</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li><span className="font-medium">enter</span>: 탑승 → 대기 화면</li>
            <li><span className="font-medium">start</span>: step1 송출</li>
            <li><span className="font-medium">advance</span>: 다음 step 송출 (2 → 3 → 4)</li>
            <li><span className="font-medium">exit</span>: 여정 종료 → 마지막 인사 화면</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">5) 준비되지 않은 스텝을 요청하면</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>정상 흐름에서는 생성이 먼저 끝나므로 발생하지 않는다.</li>
            <li>
              만약 발생하면 대기·재시도 없이 즉시 에러를 보낸다:{" "}
              <code className="bg-black/5 px-1 rounded">STEP_NOT_READY</code>
              {" "}(생성 실패 시 <code className="bg-black/5 px-1 rounded">GENERATION_FAILED</code>,
              plan 없이 진행 시 <code className="bg-black/5 px-1 rounded">PLAN_MISSING</code>)
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">6) 같은 세션에 plan이 다시 오면</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>여정이 진행 중일 때 내용이 동일한 plan → 확인 후 무시한다. 재생성하지 않고 진행 상태를 유지한다.</li>
            <li>여정이 진행 중일 때 내용이 다른 plan → 새 여정으로 덮어쓴다. 서버·클라이언트 세션을 리프레시하고 step을 처음부터 다시 시작한다. 생성 중이던 이전 plan의 작업은 폐기되어 새 여정에 섞이지 않는다.</li>
            <li>여정이 이미 종료(exit)된 뒤라면 동일한 plan이 오더라도 새 여정으로 리프레시한다. 그렇지 않으면 그 session_id 가 영구히 잠기기 때문이다.</li>
            <li>이미 생성·진행된 데이터는 chat_history에 그대로 남는다. 같은 session_id 로 다시 진행해도 기존 행을 지우지 않고 새 행이 쌓이며, 조회는 항상 가장 최근 행을 사용한다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">7) 여정 종료 후</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>
              exit 이후에는 마지막 인사 화면이 유지되며, tablet의 어떤 버튼도 화면을 바꾸지 않는다(
              <code className="bg-black/5 px-1 rounded">JOURNEY_ENDED</code> 응답).
            </li>
            <li>새 plan이 도착하면(동일한 plan이어도) 세션이 리프레시되어 다음 관람객의 여정이 시작된다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8) MQTT retain 정책</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>retain 은 브로커가 토픽의 마지막 메시지를 저장해 두었다가, 나중에 새로 구독하는 클라이언트에게 즉시 한 번 보내주는 기능이다.</li>
            <li>state(현재 상태)는 retain=true — 늦게 접속해도 지금 어느 단계인지 바로 알 수 있어야 하기 때문이다.</li>
            <li>step / reaction / error 는 retain=false — "지금 이걸 재생하라"는 1회성 명령이므로 저장해 두면 안 된다.</li>
            <li>만약 step 을 retain 했다면, 화면이 잠깐 끊겼다 재접속했을 때 브로커가 지난 스텝을 다시 보내 tablet 이 누르지도 않은 스텝이 재생될 수 있다.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
