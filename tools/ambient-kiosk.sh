#!/usr/bin/env bash
# 미래차 전시 화면(/ambient) 을 Mac Studio 의 Chrome 으로 여는 스크립트.
#
# 왜 필요한가:
#   - Chrome 은 사용자가 페이지에 한 번도 상호작용(클릭·키)하지 않으면 소리 있는 재생을 막는다
#     (autoplay policy). /ambient 는 서버 push 로 재생을 시작하므로 정확히 그 조건에 걸려
#     "아무 키나 누르기 전엔 소리가 안 나는" 현상이 생긴다 → --autoplay-policy 로 해제.
#   - 전용 프로필(--user-data-dir)을 쓰므로 이미 떠 있는 일반 Chrome 과 무관하게 플래그가 먹는다.
#   - 주소는 localhost 를 기본으로 한다(같은 Mac Studio 안에서 서빙). localhost 는 브라우저가
#     "보안 컨텍스트" 로 취급해 마이크 권한을 기억할 수 있다 — Tailscale 호스트명(http)은 그렇지 않다.
#
# 사용:
#   tools/ambient-kiosk.sh                 # http://localhost:8101/ambient 를 kiosk(전체화면)로
#   URL=http://localhost:8101/ambient?sid=… tools/ambient-kiosk.sh
#   KIOSK=0 tools/ambient-kiosk.sh         # 창 모드(디버깅용)
#   MIC=1 tools/ambient-kiosk.sh           # 마이크 권한 창까지 자동 허용(차 마이크 STT 를 쓸 때)
set -euo pipefail

URL="${URL:-http://localhost:8101/ambient}"
PROFILE="${PROFILE:-$HOME/.futurecar-kiosk-profile}"
KIOSK="${KIOSK:-1}"
MIC="${MIC:-0}"

args=(
  "--user-data-dir=$PROFILE"
  "--autoplay-policy=no-user-gesture-required"   # 상호작용 없이도 소리 재생
  "--disable-session-crashed-bubble"             # 비정상 종료 뒤 "복원" 풍선 숨김
  "--noerrdialogs"
  "--disable-infobars"
  "--no-first-run"
  "--no-default-browser-check"
  "--overscroll-history-navigation=0"            # 스와이프 뒤로가기 방지
)
[[ "$KIOSK" == "1" ]] && args+=("--kiosk")
if [[ "$MIC" == "1" ]]; then
  # 마이크 권한 창 자동 허용. localhost 가 아닌 http 주소(Tailscale 호스트명)로 열 때는
  # --unsafely-treat-insecure-origin-as-secure=<origin> 도 함께 필요하다.
  args+=("--use-fake-ui-for-media-stream")
  origin="${URL%%/ambient*}"
  [[ "$origin" != http://localhost* && "$origin" != http://127.0.0.1* ]] && args+=("--unsafely-treat-insecure-origin-as-secure=$origin")
fi

echo "==> Chrome kiosk: $URL"
echo "    profile=$PROFILE kiosk=$KIOSK mic=$MIC"
exec open -na "Google Chrome" --args "${args[@]}" "$URL"
