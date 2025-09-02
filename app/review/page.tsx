"use client";

import DetailArea from "@/components/review/detail-area";
import ListArea from "@/components/review/list-area";


export default function Review() {
    return (
        <div className="w-full h-screen flex items-stretch">
            <DetailArea/>
            <ListArea/>
        </div>
    );
}