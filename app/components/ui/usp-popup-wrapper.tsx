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
            className="bg-linear-to-r from-purple-500 to-transparent text-white font-bold max-w-[24vw] backdrop-blur-2xl p-4 rounded-full overflow-hidden bg-white/10 border border-white/30"
          >
            {item.description}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}