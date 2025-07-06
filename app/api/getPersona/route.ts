import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 임시 페르소나 데이터
    const personas = [
      {
        id: 1,
        name: "진취적인 도전가",
        description: "새로운 도전을 두려워하지 않고 적극적으로 목표를 향해 나아가는 성향",
        traits: ["도전적", "열정적", "긍정적"]
      },
      {
        id: 2,
        name: "신중한 계획가",
        description: "모든 상황을 꼼꼼히 분석하고 계획적으로 접근하는 성향",
        traits: ["분석적", "계획적", "신중함"]
      },
      {
        id: 3,
        name: "창의적인 혁신가",
        description: "기존의 틀을 벗어나 새로운 아이디어를 제시하는 성향",
        traits: ["창의적", "혁신적", "독창적"]
      }
    ];

    return NextResponse.json({ 
      success: true, 
      data: personas 
    });
  } catch (error: unknown) {
    console.error('페르소나 조회 에러:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "페르소나 정보를 가져오는데 실패했습니다." 
      },
      { 
        status: 500 
      }
    );
  }
} 