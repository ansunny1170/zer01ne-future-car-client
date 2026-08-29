import { NextResponse } from "next/server";

/**
 * /api/ambient-config — /ambient 화면이 부팅 때 읽는 **런타임** 설정.
 *
 * NEXT_PUBLIC_* 은 빌드 시점에 번들로 박제돼 컨테이너 env 로는 못 바꾼다. 전시장에서 Mac Studio 의
 * compose env 만 고쳐 재기동하면 반영되도록, 여기서는 요청 시점의 process.env 를 읽는다
 * (Next standalone 서버는 Node 프로세스라 런타임 env 가 살아 있다).
 *
 *   STANDBY_VIDEO  대기(standby) 화면 반복 영상 — 미디어 저장소 파일명 또는 절대 URL.
 *                  없으면 빌드 시 NEXT_PUBLIC_STANDBY_VIDEO, 그것도 없으면 en6.mp4.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const standbyVideo =
    process.env.STANDBY_VIDEO?.trim() || process.env.NEXT_PUBLIC_STANDBY_VIDEO?.trim() || "en6.mp4";
  return NextResponse.json(
    { standbyVideo },
    { headers: { "Cache-Control": "no-store" } },
  );
}
