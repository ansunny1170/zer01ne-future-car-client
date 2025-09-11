
import { Icons } from "../ui/icons";

export default function DummySpeech({dummyText}: {dummyText: string}) {
  return (
    <div className='flex items-center justify-center gap-4 p-4 font-semibold rounded-full bg-white/10 text-white/70 text-[34px]'>
        <span>
          <Icons.leftQuote/>
        </span>
        {dummyText}
        <span>
          <Icons.rightQuote/>
        </span>
    </div>
  )
}