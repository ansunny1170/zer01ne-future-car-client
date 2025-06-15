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