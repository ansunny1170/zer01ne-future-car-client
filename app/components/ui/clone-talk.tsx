/* eslint-disable @next/next/no-img-element */
export default function CloneTalk() {
  return (
    <div className="absolute inset-0 z-10">
        <p
            style={{
                animation: 'hueRotate 10s ease infinite'
            }}
        >
            <img src="/assets/images/effect_agent_talk.png" alt="clone-talk" className="animate-hueRotate w-full object-cover mix-blend-screen" />
        </p>

        
    </div>
  )
}