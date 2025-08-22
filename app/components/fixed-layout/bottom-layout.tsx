export default function BottomLayout() {
    return (
        <div className="absolute inset-0 z-[1] perspective-1000">
            {/* 좌우 상하 그라데이션 */}
            <p className="fixed left-0 top-0 w-1/4 h-full bg-gradient-to-r from-black/50 to-black/0"/>
            <p className="fixed right-0 top-0 w-1/4 h-full bg-gradient-to-l from-black/50 to-black/0"/>
            <p className="fixed right-0 top-0 w-full h-1/4 bg-gradient-to-b from-black/50 to-black/0"/>
            <p className="fixed right-0 bottom-0 w-full h-1/4 bg-gradient-to-t from-black/50 to-black/0"/>
        </div>
    );
}