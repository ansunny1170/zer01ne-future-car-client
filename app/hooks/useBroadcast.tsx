import { useEffect, useState } from "react";

export default function useBroadcast() {
    const channel = new BroadcastChannel("my-channel");
    const [step, setStep] = useState<number>(0);
    const [category, setCategory] = useState<string>("a");

    channel.onmessage = (event) => {
        setStep(event.data.step);
        setCategory(event.data.category);
    };

    useEffect(() => {
        channel.postMessage({
            step,
            category
        });
    }, [step, category]);

    return { channel, step, category, setStep, setCategory };
}