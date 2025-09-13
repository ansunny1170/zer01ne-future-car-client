export const random = (number: number) => {
    return Math.floor(Math.random() * number) + 1;
}

export const getFormattedTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const formattedTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
    return formattedTime;
}

export const getArtistName = () => {
    // 확률 기반 아티스트 이름 배열 (가중치 적용)
    const artists = [
        // 가장 높은 확률 (30%)
        ...Array(30).fill("니츠 & 아키"),
        
        // 높은 확률 (각 12%)
        ...Array(12).fill("YE CHAN KIM"),
        ...Array(12).fill("KYUNG HEE LEE"),
        
        // 중간 확률 (10%)
        ...Array(10).fill("EUN SEON CHOI"),
        
        // 중간~낮은 확률 (각 6%)
        ...Array(6).fill("YUMI LIM"),
        ...Array(6).fill("JIN HWA LEE"),
        ...Array(6).fill("IL HO SEO"),
        ...Array(6).fill("JIN BEOM KIM"),
        ...Array(6).fill("CHAE WON JUNG"),
        
        // 낮은 확률 (2%)
        ...Array(2).fill("SI HYUN JUNG"),
    ];
    
    // 랜덤하게 선택
    const randomIndex = Math.floor(Math.random() * artists.length);
    return artists[randomIndex];
}