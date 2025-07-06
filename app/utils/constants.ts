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
        "bgm": "night_synth.m4a",
        "sfx": null, 
        "video": "prologue",
        "text": `당신은 오늘 어떤 경험을 하고 싶으신가요?`,
        "question": null
    },
    2: {
        "ui": "navigation_alert.png",
        "bgm": "bosanova.m4a",
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
    3:{
        "ui": "parking_reservation_confirmed.png",
        "bgm": "classic.m4a",
        "sfx": "success_chime",
        "video": "city_day",
        "text": "공연장 인근의 공식 주차장에서 자리를 확보했습니다.\n\nHUD에는 주차장 위치와 함께 도보 이동 시간(3분)이 안내됩니다.\n\n비서: \"주차장까지 도착 후, 도보로 공연장까지 3분 정도 소요됩니다. 주차 안내를 시작합니다.\"",
        "question": {
          "title": "다음으로 어떤 작업을 도와드릴까요?",
          "subtitle": null,
          "content": [
            {
              "main_text": "공연 티켓 QR코드 확인",
              "sub_text": "도착 즉시 입장을 위해 미리 확인"
            },
            {
              "main_text": "공연 정보 다시 듣기",
              "sub_text": "줄거리, 캐스트 등 사전 정보 제공"
            },
            {
              "main_text": "동반자에게 도착 알림 전송",
              "sub_text": "현재 위치와 예상 도착 시간을 공유"
            }
          ]
        }
      },
      4:{
        "ui": "ticket_qr_display.png",
        "bgm": "bosanova.m4a",
        "sfx": "beep_show_qr",
        "video": "city_day",
        "text": "예약된 티켓 정보를 확인했습니다.\n\nHUD에 공연 티켓의 QR코드가 크게 표시되고, 공연장 입구에서 스캔이 용이하도록 최적화된 밝기로 조정됩니다.\n\n비서: \"이 QR코드는 공연장 입장 시 제시해 주세요. 유효 시간은 공연 시작 10분 전까지입니다.\"",
        "question": {
          "title": "추가로 어떤 작업이 필요하신가요?",
          "subtitle": null,
          "content": [
            {
              "main_text": "공연 시작 알림 설정",
              "sub_text": "시작 10분 전 진동 및 음성 알림 수신"
            },
            {
              "main_text": "좌석 위치 미리보기",
              "sub_text": "공연장 내부 지도에서 좌석 위치 확인"
            },
            {
              "main_text": "주변 맛집 추천받기",
              "sub_text": "공연 후 식사를 위한 근처 인기 식당 탐색"
            }
          ]
        }
      },
      5:{
        "ui": "restaurant_suggestion_list.png",
        "bgm": "lofi_hiphop.m4a",
        "sfx": "notification_ping",
        "video": "city_evening",
        "text": "공연장 주변에서 인기 있는 식당을 추천해 드릴게요.\n\nHUD에는 맛집 리스트와 함께 도보 거리 및 혼잡도 예측 정보가 표시됩니다.\n\n비서: \"공연 종료 시점 기준으로 대기 시간이 적은 순으로 추천드렸어요. 취향에 따라 선택하실 수 있습니다.\"",
        "question": {
          "title": "어떤 식당으로 예약할까요?",
          "subtitle": "공연 종료 예상 시각: 18시 30분 기준",
          "content": [
            {
              "main_text": "오스테리아 루카",
              "sub_text": "이탈리안 / 도보 5분 / 조용한 분위기"
            },
            {
              "main_text": "진가와",
              "sub_text": "일식 / 도보 3분 / 공연장 단골 맛집"
            },
            {
              "main_text": "더 그릴 스테이션",
              "sub_text": "스테이크 & 와인 / 도보 7분 / 프라이빗 룸 가능"
            }
          ]
        }
      },
      6:{
        "ui": "restaurant_reservation_confirmed.png",
        "bgm": "lofi_hiphop.m4a",
        "sfx": "success_chime",
        "video": "city_evening",
        "text": "예약된 식당 정보를 확인했습니다.\n\nHUD에는 식당 위치와 함께 도보 이동 시간(5분)이 안내됩니다.\n\n비서: \"예약 완료되었습니다. 공연 관람 후 도보로 5분 정도 소요됩니다. 즐거운 관람 되세요.\"",
        "question": {
          "title": "기술은 미래가 아닌 현재에, 당신을 위해 준비되어 있습니다.",
          "subtitle": null,
          "content": [
            {
              "main_text": "처음으로 돌아가기",
              "sub_text": "처음으로 돌아가기"
            }
          ]
        }
      }
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