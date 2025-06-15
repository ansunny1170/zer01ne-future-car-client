import { useRef, useEffect, useMemo } from "react";
import { useScene } from "../context/scene-context";

export default function useBroadcast() {
    const senderId = useRef(Date.now() + Math.random()).current;
    const channel = useMemo(() => new BroadcastChannel("my-channel"), []);
    const { sceneNumber, category, categoryNumber, setSceneNumber, setCategory, setCategoryNumber, lastSceneNumber } = useScene();

    // 메시지 수신: 다른 탭/페이지에서 온 메시지로 상태 동기화
    useEffect(() => {
        channel.onmessage = (event) => {
            if (event.data.senderId === senderId) return;
            if (event.data.sceneNumber > lastSceneNumber) {
                if (sceneNumber !== 1) setSceneNumber(1);
                if (categoryNumber !== event.data.categoryNumber) setCategoryNumber(event.data.categoryNumber);
            } else if (event.data.sceneNumber < 1) {
                if (sceneNumber !== lastSceneNumber) setSceneNumber(lastSceneNumber);
                if (categoryNumber !== 1) setCategoryNumber(1);
            } else {
                if (sceneNumber !== event.data.sceneNumber) setSceneNumber(event.data.sceneNumber);
                if (category !== event.data.category) setCategory(event.data.category);
                if (categoryNumber !== event.data.categoryNumber) setCategoryNumber(event.data.categoryNumber);
            }
        };
        // cleanup
        return () => { channel.onmessage = null; };
    }, [channel, senderId, sceneNumber, category, categoryNumber, lastSceneNumber]);

    // 상태가 바뀐 뒤에만 메시지 전파 (모든 페이지에서 동기화)
    useEffect(() => {
        channel.postMessage({
            senderId,
            sceneNumber,
            category,
            categoryNumber
        });
    }, [sceneNumber, category, categoryNumber, channel, senderId]);

    return {
        channel,
        sceneNumber,
        category,
        categoryNumber,
        setCategory,
        setCategoryNumber,
        setSceneNumber,
        lastSceneNumber
    };
}