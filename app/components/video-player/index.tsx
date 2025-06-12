export default function VideoPlayer({ message, direction }: { message: string, direction: "left" | "right" | "center" }) {
    return (
        <video src={`/videos/${message}_${direction}.mp4`} autoPlay loop muted className="w-full h-full object-cover absolute top-0 left-0 -z-10" />
    );
}