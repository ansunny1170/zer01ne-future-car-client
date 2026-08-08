// WS 주소는 "페이지를 연 호스트"(window.location)를 따라가게 한다.
// → localhost 로 열면 ws://localhost:PORT, DNS 로 열면 ws://<dns>:PORT (둘 다 백엔드에 도달).
// 백엔드 포트는 NEXT_PUBLIC_API_URL 의 포트(미설정 시 8100).
export function wsUrl(sid: string): string {
  let port = "8100";
  try {
    const u = new URL(process.env.NEXT_PUBLIC_API_URL || "");
    if (u.port) port = u.port;
  } catch {
    /* NEXT_PUBLIC_API_URL 미설정 시 기본 8100 */
  }
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${window.location.hostname}:${port}/ws/futurecar/${sid}`;
}
