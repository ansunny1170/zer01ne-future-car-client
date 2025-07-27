import { Icons } from "../icons";
import BasicPopupBox from "./basic-popup-box";
import { motion } from 'framer-motion';

const popupDict: {
    [key: string]: {
        icon: React.ReactNode;
        type: "warm" | "cold";
        className: string;
        defaultText: string;
    };
} = {
    common: {
        icon: <Icons.alert />,
        type: "warm",
        className: "",
        defaultText: ""
    },
    detour:{
        icon: <Icons.alert />,
        type: "cold",
        className: "",
        defaultText: ""
    },
    parkingLot: {
        icon: <Icons.car />,
        type: "cold",
        defaultText: "빈 자리를 찾는 중입니다...",
        className: "",
    },
    air: {
        icon: <Icons.air />,
        type: "cold",
        defaultText: "실내 공기가 쾌적합니다.",
        className: "",
    },
    emotion: {
        icon: <Icons.heart />,
        type: "cold",
        defaultText: "탑승자 감정인식 결과",
        className: "",
    },
    calendar: {
        icon: <Icons.calendar />,
        type: "cold",
        defaultText: "일정 알림",
        className: "",
    },
    carOpen: {
        icon: <Icons.doorOpen />,
        type: "warm",
        defaultText: "문열림",
        className: "min-w-auto",
    },
    carClose: {
        icon: <Icons.doorClose />,
        type: "warm",
        defaultText: "문닫힘",
        className: "min-w-auto",
    },
    careNode: {
        icon: <Icons.car />,
        type: "cold",
        defaultText: "동승자 케어모드 시작",
        className: "",
    },
    incomingCall: {
        icon: <Icons.calling />,
        type: "cold",
        defaultText: "Incoming Call 팝업",
        className: "",
    },
    message: {
        icon: <Icons.message />,
        type: "cold",
        defaultText: "메세지 알림",
        className: "",
    },
    tireAir: {
        icon: <Icons.alert />,
        type: "warm",
        defaultText: "타이어 공기압 저하 알림",
        className: "",
    },
    oil: {
        icon: <Icons.oil />,
        type: "warm",
        defaultText: "엔진오일 경고",
        className: "",
    },
    battery: {
        icon: <Icons.battery />,
        type: "warm",
        defaultText: "배터리가 15% 이하입니다.",
        className: "",
    },
    neerRepair: {
        icon: <Icons.alert />,
        type: "warm",
        defaultText: "",
        className: "",
    },
    emergencyDetour: {
        icon: <Icons.alert />,
        type: "warm",
        defaultText: "",
        className: "",
    },
    temperature: {
        icon: <Icons.thermometer />,
        type: "cold",
        defaultText: "온도를 조절하는 중입니다...",
        className: "",
    },
    carWash: {
        icon: <Icons.carWash />,
        type: "cold",
        defaultText: "세차 예약 중입니다....",
        className: "",
    },

}

export default function CommonPopupUI({keyName, text, description}: {keyName: string, text?: string, description?: string}) {
  return (
    <BasicPopupBox type={popupDict[keyName]?.type} className={popupDict[keyName]?.className}>
        <motion.div
            className="flex flex-col items-center gap-6 w-full"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
        >
            <p className="w-[66px] h-[66px] flex items-center justify-center">
                {popupDict[keyName]?.icon}
            </p>
            <div className="leading-[1.2]">
                <h1 className="text-[42px] font-bold">{text || popupDict[keyName].defaultText}</h1>
                <p className="text-[22px] opacity-80">{description}</p>
            </div>
        </motion.div>
    </BasicPopupBox>
  );
}