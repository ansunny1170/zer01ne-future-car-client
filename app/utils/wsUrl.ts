// WS 주소는 "페이지를 연 호스트명"(window.location.hostname)을 따라가되, 포트와 경로 접두어는
// NEXT_PUBLIC_API_URL 에서 가져온다.
//   - localhost 로 열면 ws://localhost:8100/ws/futurecar, Tailscale DNS 로 열면 ws://<dns>:8100/…
//   - 외부 프록시 빌드(NEXT_PUBLIC_API_URL=http://jscouple.site:8080/car1)에서는
//     ws://jscouple.site:8080/car1/ws/futurecar — 프록시가 /car1/ 접두어를 떼고 백엔드 8100 으로 넘긴다.
//     경로 접두어를 무시하면 ws://jscouple.site:8100 으로 가서 실패한다(2026-08-30 외부 공개 때 확인).
//   - NEXT_PUBLIC_API_URL 미설정/파싱 실패 시 8100, 포트가 없으면 스킴 기본 포트.
// sid 를 주면 특정 세션 전용(/ws/futurecar/{sid}), 생략하면 와일드카드(/ws/futurecar) —
// session_id 를 미리 알 수 없는 전시용 화면이 모든 세션의 메시지를 받아 스스로 판단할 때 쓴다.
export function wsUrl(sid?: string): string {
  let port: string | null = "8100";
  let prefix = "";
  try {
    const u = new URL(process.env.NEXT_PUBLIC_API_URL || "");
    port = u.port || null;
    prefix = u.pathname.replace(/\/+$/, "");
  } catch {
    /* NEXT_PUBLIC_API_URL 미설정 시 기본 8100, 접두어 없음 */
  }
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = port ? `${window.location.hostname}:${port}` : window.location.hostname;
  const base = `${scheme}//${host}${prefix}/ws/futurecar`;
  return sid ? `${base}/${sid}` : base;
}
