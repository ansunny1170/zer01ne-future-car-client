import { AnimatePresence, motion } from "framer-motion";

export default function UspPopupWrapper({ data }: { data: { description: string }[] }) {
  return (
    <ul className="flex flex-col absolute left-8 top-24 gap-4 items-start text-left z-[999]">
      <AnimatePresence initial={false}>
        {data.map((item, index) => (
          <motion.li
            key={item.description + index}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35 }}
            className="flex justify-start items-center gap-2 bg-linear-to-r from-purple-500 to-transparent text-white font-bold max-w-[24vw] backdrop-blur-2xl p-4 rounded-full overflow-hidden bg-white/10 border border-white/30"
          >
            <p className="w-[24px] h-[24px] flex items-center justify-center shrink-0">
              <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.3688 0C12.3688 6.42242 17.5776 11.6288 24 11.6288V11.6288V12.3688V12.3688C17.5763 12.3688 12.3688 17.5763 12.3688 24V24H11.6288V24C11.6288 17.5776 6.42242 12.3688 0 12.3688V12.3688V11.6288V11.6288C6.42242 11.6288 11.6288 6.42242 11.6288 0V0H12.3688V0Z" fill="url(#paint0_linear_409_339)"/>
                <defs>
                <linearGradient id="paint0_linear_409_339" x1="24.8478" y1="0.991494" x2="4.33333" y2="20" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4C8BFF"/>
                <stop offset="0.721233" stop-color="#F7B094"/>
                <stop offset="1" stop-color="#FFC73B"/>
                </linearGradient>
                </defs>
              </svg>
            </p>
            {item.description}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}