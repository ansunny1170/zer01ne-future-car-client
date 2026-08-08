"use client";

import { cn } from "@/utils/cn";

interface TabletSimModalProps {
  open: boolean;
  onClose: () => void;
}

// 🥚 개발자 전용: 태블릿 시뮬레이터로 /ambient 를 로컬에서 테스트하는 방법 안내 모달
export default function TabletSimModal({ open, onClose }: TabletSimModalProps) {
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

        <h1 className="text-2xl font-bold mb-6">태블릿 시뮬레이터 사용법 (로컬 테스트)</h1>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">1) 미리 실행해 둘 것</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>
              MQTT 브로커: <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">docker start fc-mosquitto</code>
              {" "}(allow_anonymous 라 계정 불필요)
            </li>
            <li>MySQL: <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">futurecar-mysql-local</code> 컨테이너가 떠 있어야 한다</li>
            <li>
              백엔드: 서버 저장소에서{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000</code>
            </li>
            <li>
              이 화면: <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">http://localhost:3000/ambient?sid=MANUAL01</code>
              {" "}(sid 는 시뮬레이터의 SESSION_ID 와 같아야 한다)
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">2) ambient 프롬프트 등록 (최초 1회)</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>DB 의 최신 prompt 가 classic 용이면 ambient 로 생성되지 않는다.</li>
            <li>
              프롬프트 서빙: 서버 저장소 <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">app/prompts</code> 에서{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">python3 -m http.server 8899</code>
            </li>
            <li>
              DB 등록:
              <pre className="bg-neutral-100 rounded p-3 overflow-x-auto text-sm mt-1">
                {"INSERT INTO prompt (file_url) VALUES ('http://127.0.0.1:8899/ambient_step4.md');"}
              </pre>
            </li>
            <li>classic 으로 되돌리려면 예전 S3 URL 을 같은 방식으로 다시 INSERT 한다.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">3) 시뮬레이터 실행</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>
              서버 저장소에서 <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">./venv/bin/python tools/mqtt_sim/manual_tablet.py</code>
            </li>
            <li>
              실행 즉시 plan 이 자동 전송되고, 백엔드 로그에{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">step 1 생성 완료</code> …{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">step 4 생성 완료</code> 가 순서대로 찍힌다.
            </li>
            <li>
              생성이 끝나기 전에 start 를 누르면{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">STEP_NOT_READY</code> 에러가 난다(대기·재시도 없이 즉시 에러 = 정상 동작).
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">4) 버튼</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li><code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">1</code> enter — 탑승 → 대기 화면</li>
            <li><code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">2</code> start — step1 송출</li>
            <li><code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">3</code> advance — 다음 step (2 → 3 → 4)</li>
            <li><code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">4</code> context — ambient 에서는 사용하지 않음(no-op)</li>
            <li><code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">5</code> exit — 여정 종료 → 작별 화면</li>
            <li>
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">0</code> plan 재전송 ·{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">m</code> 메뉴 ·{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">q</code> 종료
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">5) 권장 진행 순서</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>
              plan 자동 전송 → 생성 완료 대기 →{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">1</code> →{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">2</code> →{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">3</code> →{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">3</code> →{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">3</code> →{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">5</code>
            </li>
            <li>
              exit 뒤에 <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">2</code> 나{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">3</code> 을 눌러도 화면이 바뀌지 않아야 정상이다(JOURNEY_ENDED).
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">6) 꼭 해볼 검증</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>
              동일 plan 무시: 작별 화면에서 <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">0</code> 을 눌러도 아무 변화가 없어야 한다.
            </li>
            <li>
              다른 plan 리프레시: <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">tools/mqtt_sim/dummy_plan.json</code> 의 place 하나를 바꾼 뒤 시뮬레이터를 재실행하면 대기 화면으로 리프레시되고 새 여정 생성이 시작된다.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">7) 여정을 끝낸 뒤 다시 테스트하려면</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>시뮬레이터만 재실행하는 것으로는 부족하다. 같은 session_id 에 같은 plan 이 다시 오면 무시되기 때문이다.</li>
            <li>
              방법 1(권장): 세션 ID 를 바꾼다 —{" "}
              <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">SESSION_ID=MANUAL02 ./venv/bin/python tools/mqtt_sim/manual_tablet.py</code>
              {" "}로 실행하고 이 화면도 <code className="bg-neutral-100 text-neutral-800 rounded px-2 py-1">?sid=MANUAL02</code> 로 연다.
            </li>
            <li>방법 2: dummy_plan.json 내용을 바꾼다.</li>
            <li>방법 3: 백엔드를 재시작한다(메모리 세션 초기화).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8) 화면에서 상태 보기</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm leading-relaxed">
            <li>좌상단 3연속 클릭 또는 Ctrl/Cmd+Shift+D → devMode 토글 (좌상단 step info 패널 + 좌하단 연결 배지)</li>
            <li>우상단 3연속 클릭 또는 Ctrl/Cmd+Shift+G → 진행 설명서</li>
            <li>중앙 우측 3연속 클릭 또는 Ctrl/Cmd+Shift+T → 이 창</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
