export default function UspPopupWrapper({data}: {data: {description: string}[]}) {
  return (
    <ul className="flex flex-col absolute left-8 top-24 gap-4 items-start">
      {
        data.map((item, index) => (
          <li key={index} className="animate-popup bg-gray-500 text-white font-bold max-w-[24vw] backdrop-blur-2xl p-4 rounded-full overflow-hidden bg-white/10 border border-white/30">{item.description}</li>
        ))
      }
    </ul>
  );
}