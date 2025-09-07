/* eslint-disable @next/next/no-img-element */
import BasicHudPopupBox from "./basic-hud-popup-box";
import { motion } from "framer-motion";

const popupDict: {
  [key: string]: {
    name: string;
    title: string;
    image: string;
  };
} = {
  MMR_FRD: {
    name: "이 장소의 추억_1",
    title: "이 장소의 추억...",
    image: "/assets/images/hud_MMR_FRD.png",
  },
  MMR_FMY: {
    name: "이 장소의 추억_2",
    title: "이 장소의 추억...",
    image: "/assets/images/hud_MMR_FMY.png",
  },
  TV: {
    name: "맞춤형 광고 시청",
    title: "맞춤형 광고 시청",
    image: "/assets/images/hud_TV.png",
  },
  REPORT: {
    name: "자동출장 보고서",
    title: "자동출장 보고서",
    image: "/assets/images/hud_REPORT.png",
  },
  MY_SVC: {
    name: "자주 찾는 정비소 예약",
    title: "자주 찾는 정비소 예약",
    image: "/assets/images/hud_MY_SVC.png",
  },
  RMC: {
    name: "집안 원격제어",
    title: "집안 원격제어",
    image: "/assets/images/hud_RMC.png",
  },
  PET: {
    name: "펫알림",
    title: "펫알림",
    image: "/assets/images/hud_PET.png",
  },
  EV: {
    name: "근처 EV충전소 알림",
    title: "근처 EV충전소 알림",
    image: "/assets/images/hud_EV.png",
  },
  KID_REPORT: {
    name: "유치원 알림창",
    title: "유치원 알림창",
    image: "/assets/images/hud_KID_REPORT.png",
  },
  KID_ALERT: {
    name: "아이유치원 생활",
    title: "아이유치원 생활",
    image: "/assets/images/hud_KID_ALERT.png",
  },
  FOOD_FOOD: {
    name: "맛집 VS 맛집",
    title: "맛집 VS 맛집",
    image: "/assets/images/hud_FOOD_FOOD.png",
  },
  FOOD_MAP: {
    name: "로컬 맛집지도",
    title: "로컬 맛집지도",
    image: "/assets/images/hud_FOOD_MAP.png",
  },
  FOOD_WAIT: {
    name: "맛집 대기 현황",
    title: "맛집 대기 현황",
    image: "/assets/images/hud_FOOD_WAIT.png",
  },
  MY_PLACE: {
    name: "장소 즐겨찾기",
    title: "장소 즐겨찾기",
    image: "/assets/images/hud_MY_PLACE.png",
  },
  LOCAL_FLEA: {
    name: "로컬 플리마켓",
    title: "로컬 플리마켓",
    image: "/assets/images/hud_LOCAL_FLEA.png",
  },
}

export default function HudPopup({keyName}: {keyName: string}) {
  return (
    <BasicHudPopupBox type="cold" className="w-[400px] px-[15px] py-[30px]">
      <p className="text-[22px] text-left text-shadow-lg font-bold">{popupDict[keyName].title}</p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center"
      >
        <img className="w-[90%] mb-[10px]" src={popupDict[keyName].image} alt="" />
      </motion.div>
    </BasicHudPopupBox>    
  );
}