// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const STEP_QUESTION_LIST = {
    scene1 : {
        mainText : "좋은 하루입니다. 주행을 시작하시겠어요?",
        subText : "",
        category : {
            a: "시작"
        }
    },
    scene2 : {
        mainText : "12시부터 4시까지 이런 일정은 어떠세요?",
        subText : "(메인 시나리오 n초 감상 후 발생)",
        category : {
            a: "돈 벌어오기",
            b: "꾸미기",
            c: "심부름하기",
        }
    },
    scene3 : {
        mainText : "일정을 완료했습니다. 아이를 픽업합니다.\n 창 밖 풍경을 어떻게 설정할까요?",
        subText : "ai 000를 적용합니다.",
        category : {
            a: "공룡",
            b: "로봇",
            c: "요정",
            d: "우주",
        }
    },
    scene5 : {
        mainText : "아이 픽업을 완료했습니다.\n 퇴근길 마중을 나갈게요!",
        subText : "어떤 모드로 전환할까요?",
        category : {
            a: "회복모드",
            b: "정산하기",
            c: "음악듣기",
        }
    },
    scene7 : {
        mainText : "집에 도착했습니다.",
        subText : "충전 모드로 전환합니다. 좋은 밤 되세요.",
        category : {
        }
    },
}

export const SCENE_LIST = {
    scene1 : {a: 1},
    scene2 : {a: 2},
    scene3 : {a: 3, b: 3, c: 3},
    scene4 : {a: 3, b: 2, c: 3, d: 3},
    scene5 : {a: 2},
    scene6 : { a: 1, b: 1, c: 1 },
    scene7 : { a: 3 }
}

export const STEP_DUMMY = {
    0: {
        "ui": null,
        "bgm": "night_synth.m4a",
        "sfx": null, 
        "video": "prologue",
        "question": {
            "title": "시작하시겠어요?",
            "subtitle": "음성으로 입력해주세요",
            "content": [
                {
                    "main_text": "시작"
                }
            ]
        }
    },
    1: {
        "ui": null,
        "bgm": null,
        "sfx": null, 
        "video": null,
        "text": `당신은 오늘 어떤 경험을 하고 싶으신가요?`,
        "question": null
    },
    2: {
        "ui": "navigation_alert.png",
        "bgm": "pop_dance.m4a",
        "sfx": "car_alert", 
        "video": "city_day",
        "text": `현재 시각 15시 30분. 차량이 뮤지컬 공연장까지 실시간 경로를 분석합니다.\n\nHUD에 도심 배경과 함께 빠른 경로 탐색 알림이 표시됩니다.\n\n비서: "예상 도착 시간 16시 02분. 공연 시작까지 30분 이내로 이동해야 합니다."`,
        "question": {
            "title": "지금 차량에서 어떤 기능을 실행할까요?",
            "subtitle": null,
            "content": [
                {
                    "main_text": "우회 경로 탐색",
                    "sub_text": "예상 시간보다 빠른 길이 있는지 실시간 재탐색"
                },
                {
                    "main_text": "공연장 주차장 예약", 
                    "sub_text": "가까운 주차 자리 사전 확보로 주차 시간 단축"
                },
                {
                    "main_text": "긴장 완화 모드",
                    "sub_text": "심호흡 가이드 + 잔잔한 BGM으로 마음 안정"
                }
            ]
        }
    },
}

export const PERSONA_LIST = [
    "도심에서 힐링해요",
    "반려견과 드라이브",
    "연인과 데이트",
    "친구와 모험",
    "신혼여행 중",
    "아이와 안전하게",
    "문화생활 즐겨요",
    "전국 여행 중",
    "황금기를 즐겨요",
    "추억 만들기",
    "둘만의 시간",
    "가족과 함께",
    "음악이 전부",
    "안정적 이동",
    "첫 출근길"
]