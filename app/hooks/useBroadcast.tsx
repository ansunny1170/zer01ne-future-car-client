import { useState } from "react";

export default function useBroadcast() {
    const channel = new BroadcastChannel("my-channel");
    const [step, setStep] = useState<number>(0);
    const [category, setCategory] = useState<string>("a");

    channel.onmessage = (event) => {
        setStep(event.data.step);
        setCategory(event.data.category);
    };

    const handlePostMessage = ({step, category}: {step: number, category: string}) => {
        channel.postMessage({
            step,
            category
        });
        setStep(step);
        setCategory(category);
    };

    return { channel, step, category, handlePostMessage };
}