import HudSamplePopup from "./hud-sample-popup";

export default function HudSampleLayer() {
    return (
        <div className="absolute inset-0 perspective-1000">
            <div className="absolute bottom-[50px] left-[5%]" style={{ transform: 'scale(0.4) rotateY(15deg)' }}>
                <HudSamplePopup />
            </div>
            <div className="absolute bottom-[70px] right-[8%]" style={{ transform: 'scale(0.4) rotateY(-10deg)' }}>
                <HudSamplePopup />
            </div>
        </div>
    )
}