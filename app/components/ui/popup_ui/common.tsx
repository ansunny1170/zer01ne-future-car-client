import { Icons } from "../icons";
import BasicPopupBox from "./basic-popup-box";
import CloneTalk from "../clone-talk";

const popupDict: {
    [key: string]: {
        icon: React.ReactNode;
        type: "warm" | "cold";
        className: string;
        defaultText: string;
    };
} = {
    DEFAULT_POPUP: {
        icon: <Icons.alert />,
        type: "warm",
        className: "",
        defaultText: ""
    },
    DETOUR:{
        icon: <Icons.alert />,
        type: "cold",
        className: "",
        defaultText: ""
    },
    PARKING_LOT: {
        icon: <Icons.car />,
        type: "cold",
        defaultText: "빈 자리를 찾는 중입니다...",
        className: "",
    },
    AIR: {
        icon: <Icons.air />,
        type: "cold",
        defaultText: "실내 공기가 쾌적합니다.",
        className: "",
    },
    EMOTION: {
        icon: <Icons.heart />,
        type: "cold",
        defaultText: "탑승자 감정인식 결과",
        className: "",
    },
    CALENDAR: {
        icon: <Icons.calendar />,
        type: "cold",
        defaultText: "일정 알림",
        className: "",
    },
    CAR_OPEN: {
        icon: <Icons.doorOpen />,
        type: "warm",
        defaultText: "문열림",
        className: "min-w-auto",
    },
    CAR_CLOSE: {
        icon: <Icons.doorClose />,
        type: "warm",
        defaultText: "문닫힘",
        className: "min-w-auto",
    },
    CARE_NODE: {
        icon: <Icons.car />,
        type: "cold",
        defaultText: "동승자 케어모드 시작",
        className: "",
    },
    INCOMING_CALL: {
        icon: <Icons.calling />,
        type: "cold",
        defaultText: "Incoming Call 팝업",
        className: "",
    },
    MESSAGE: {
        icon: <Icons.message />,
        type: "cold",
        defaultText: "메세지 알림",
        className: "",
    },
    TIRE_AIR: {
        icon: <Icons.alert />,
        type: "warm",
        defaultText: "타이어 공기압 저하 알림",
        className: "",
    },
    OIL: {
        icon: <Icons.oil />,
        type: "warm",
        defaultText: "엔진오일 경고",
        className: "",
    },
    BATTERY: {
        icon: <Icons.battery />,
        type: "warm",
        defaultText: "배터리가 15% 이하입니다.",
        className: "",
    },
    NEER_REPAIR: {
        icon: <Icons.alert />,
        type: "warm",
        defaultText: "",
        className: "",
    },
    EMERGENCY_DETOUR: {
        icon: <Icons.alert />,
        type: "warm",
        defaultText: "",
        className: "",
    },
    TEMPERATURE: {
        icon: <Icons.thermometer />,
        type: "cold",
        defaultText: "온도를 조절하는 중입니다...",
        className: "",
    },
    CAR_WASH: {
        icon: <Icons.carWash />,
        type: "cold",
        defaultText: "세차 예약 중입니다....",
        className: "",
    },
}

export default function CommonPopupUI({keyName, text, description, onComplete}: {keyName: string, text?: string, description?: string, onComplete?: () => void}) {
  return (
    <>
        {keyName === 'CLONE_TALKS' ? (
            <CloneTalk
                text={text || ""}
                onComplete={onComplete}
            />
        ) : (
        <BasicPopupBox type={popupDict[keyName]?.type} className={popupDict[keyName]?.className}>
            <div
                className="flex flex-col items-center gap-6 w-full opacity-0 translate-y-[50px] animate-popup"
            >
                <p className="w-[66px] h-[66px] flex items-center justify-center">
                    {popupDict[keyName]?.icon || <Icons.alert />}
                </p>
                <div className="leading-[1.2]">
                    <h1 className="text-[42px] font-bold">{text || popupDict[keyName]?.defaultText}</h1>
                    <p className="text-[22px] opacity-80">{description}</p>
                </div>
            </div>
        </BasicPopupBox>
    )}
    </>
  );
}