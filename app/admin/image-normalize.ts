// 관리자 화면 이미지 업로드 전 정규화 — 원본 크기·비율이 제각각이어도 차 화면에 똑같이 보이게 (2026-10-05).
// 브리핑 사진(카드 140×100)과 이미지 팝업(그림 칸 339×259)이 같이 쓴다.
//  - "smart": 투명 배경(일러스트·누끼)은 투명 여백을 걷어내고 칸 안에 맞춤(여백 8%), 꽉 찬 사진은 칸을 채우도록 가운데 기준으로 자름
//  - "contain": 무엇이든 잘리지 않게 칸 안에 맞춤(투명 여백만 걷어냄, 남는 자리는 투명)

// 불투명(알파 > 10) 픽셀이 있는 영역. 전부 투명하면 원본 전체.
function opaqueBounds(bmp: ImageBitmap): { x: number; y: number; w: number; h: number } {
    const full = { x: 0, y: 0, w: bmp.width, h: bmp.height };
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const cx = c.getContext("2d");
    if (!cx) return full;
    cx.drawImage(bmp, 0, 0);
    const data = cx.getImageData(0, 0, c.width, c.height).data;
    let minX = c.width, minY = c.height, maxX = -1, maxY = -1;
    for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
            if (data[(y * c.width + x) * 4 + 3] > 10) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    return maxX < 0 ? full : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function hasTransparency(bmp: ImageBitmap): boolean {
    const probe = document.createElement("canvas");
    probe.width = 64;
    probe.height = 64;
    const pctx = probe.getContext("2d");
    if (!pctx) return false;
    pctx.drawImage(bmp, 0, 0, 64, 64);
    const alpha = pctx.getImageData(0, 0, 64, 64).data;
    for (let i = 3; i < alpha.length; i += 4) {
        if (alpha[i] < 250) return true;
    }
    return false;
}

export async function normalizeImage(file: File, outW: number, outH: number, fit: "smart" | "contain"): Promise<File> {
    const bmp = await createImageBitmap(file);
    const transparent = hasTransparency(bmp);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    if (transparent || fit === "contain") {
        // 투명 여백을 걷어낸 뒤 맞춘다 — 원본에 빈 공간이 많으면 대상이 칸 안에서 너무 작아 보인다.
        const box = transparent ? opaqueBounds(bmp) : { x: 0, y: 0, w: bmp.width, h: bmp.height };
        const pad = fit === "smart" ? 0.08 : 0;
        const scale = Math.min((outW * (1 - pad * 2)) / box.w, (outH * (1 - pad * 2)) / box.h);
        const w = box.w * scale;
        const h = box.h * scale;
        ctx.drawImage(bmp, box.x, box.y, box.w, box.h, (outW - w) / 2, (outH - h) / 2, w, h);
    } else {
        const scale = Math.max(outW / bmp.width, outH / bmp.height);
        const w = bmp.width * scale;
        const h = bmp.height * scale;
        ctx.drawImage(bmp, (outW - w) / 2, (outH - h) / 2, w, h);
    }
    // contain 은 남는 자리가 투명이어야 해서 PNG. 사진을 꽉 채운 경우만 JPEG(용량).
    const png = transparent || fit === "contain";
    const type = png ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
    if (!blob) return file;
    return new File([blob], png ? "image.png" : "image.jpg", { type });
}
