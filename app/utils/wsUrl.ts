// WS 주소는 "페이지를 연 호스트"(window.location)를 따라가게 한다.
// → localhost 로 열면 ws://localhost:PORT, DNS 로 열면 ws://<dns>:PORT (둘 다 백엔드에 도달).
// 백엔드 포트는 NEXT_PUBLIC_API_URL 의 포트(미설정 시 8100).
// sid 를 주면 특정 세션 전용(/ws/futurecar/{sid}), 생략하면 와일드카드(/ws/futurecar) —
// session_id 를 미리 알 수 없는 전시용 화면이 모든 세션의 메시지를 받아 스스로 판단할 때 쓴다.
export function wsUrl(sid?: string): string {
  let port = "8100";
  try {
    const u = new URL(process.env.NEXT_PUBLIC_API_URL || "");
    if (u.port) port = u.port;
  } catch {
    /* NEXT_PUBLIC_API_URL 미설정 시 기본 8100 */
  }
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  const base = `${scheme}//${window.location.hostname}:${port}/ws/futurecar`;
  return sid ? `${base}/${sid}` : base;
}
