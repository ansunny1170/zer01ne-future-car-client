import BasicPopupBox from "./basic-popup-box";
import { motion } from "framer-motion";

export default function HudSamplePopup() {

  return (
    <BasicPopupBox type="warm" className="w-[400px] px-[15px] py-[30px]">
      <p className="text-[22px] text-left">맞춤형 광고시청</p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center"
      >
        <img className="w-[90%] mb-[10px]" src="/assets/images/img_hud_sample_01.png" alt="" />
        <img className="w-[100%]" src="/assets/images/img_hud_sample_02.png" alt="" />
      </motion.div>
    </BasicPopupBox>    
  );
}