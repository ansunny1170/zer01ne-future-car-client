import { useEffect, useState } from "react";

export default function useBroadcast() {
    const channel = new BroadcastChannel("my-channel");
    const [step, setStep] = useState<number>(0);
    const [category, setCategory] = useState<string>("a");
    const lastStep = 3;

    channel.onmessage = (event) => {
        if (event.data.step > lastStep) {
            setStep(0);
            setCategory("a");
        } else if (event.data.step < 0) {
            setStep(lastStep);
        } else {
            setStep(event.data.step);
            setCategory(event.data.category);
        }
    };

    useEffect(() => {
        channel.postMessage({
            step,
            category
        });
    }, [step, category]);

    return { channel, step, category, setStep, setCategory, lastStep };
}