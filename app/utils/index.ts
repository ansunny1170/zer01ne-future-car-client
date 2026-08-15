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
        ...Array(20).fill("니츠 & 아키"),
        ...Array(20).fill("YE CHAN KIM"),
        ...Array(20).fill("KYUNG HEE LEE"),
        ...Array(20).fill("EUN SEON CHOI"),
        ...Array(20).fill("ZER01NE"),
    ];

    // 랜덤하게 선택
    const randomIndex = Math.floor(Math.random() * artists.length);
    return artists[randomIndex];
}