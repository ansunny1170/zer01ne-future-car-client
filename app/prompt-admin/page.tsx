// 구주소 호환 — 프롬프트 관리가 관리자 허브(/admin/prompts)로 이사했다 (2026-09-19).
import { redirect } from "next/navigation";

export default function PromptAdminRedirect() {
    redirect("/admin/prompts");
}
