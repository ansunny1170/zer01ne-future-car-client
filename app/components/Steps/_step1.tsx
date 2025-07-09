import { useScene } from "@/app/context/scene-context";
import { useState, useEffect } from "react";

export default function Step1() {
    const personaUrl = "https://rockskotch.app.n8n.cloud/webhook/persona"
    const storyUrl = "https://rockskotch.app.n8n.cloud/webhook/storyteller"
    const [inputText, setInputText] = useState<string>("");
    const { stepNumber, persona, setPersona } = useScene();

    const getPersona = async () => {
        const res = await fetch(personaUrl, {
            method: "POST",
            body: JSON.stringify({
                "personaAnswer": inputText
            })
        });
        const data = await res.json();
        
        setPersona(data.output.personaType);
    }

    const getStory = async () => {
        const res = await fetch(storyUrl, {
            method: "POST",
            body: JSON.stringify({
                "persona": persona,
                "stepNumber": stepNumber,
            })
        });
        const data = await res.json();
        console.log(data);
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await getPersona();
    }

    useEffect(() => {
        if (persona) {
            setTimeout(async () => {
                await getStory();
            }, 1000);
        }
    }, [persona]);
    
    return (
        <div className="absolute inset-0 text-amber-50 text-xl flex flex-col items-center justify-center text-center">
            <p>오늘 누구와, 어떤 목적으로 드라이브를 떠나시나요?</p>
            <form onSubmit={(e) => handleSubmit(e)}>
                <p><input type="text" className="bg-white text-black px-4 py-2 rounded-md" value={inputText} onChange={(e) => setInputText(e.target.value)} /></p>
                <p><button className="bg-amber-500 text-black px-4 py-2 rounded-md" type="submit">웹훅 테스트</button></p>
            </form>

            {persona && (
                <p>답변 : {persona}</p>
            )}
        </div>
    );
}