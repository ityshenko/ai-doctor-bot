import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('🔥🔥🔥 НОВЫЙ ЗАПРОС:', new Date().toISOString());
  
  try {
    const body = await req.json();
    console.log('📦 Тело запроса:', JSON.stringify(body).substring(0, 200));
    
    if (body.message) {
      console.log('💬 Текст сообщения:', body.message.text);
      console.log('👤 Чат ID:', body.message.chat.id);
    }
    
    // Отвечаем максимально быстро
    const response = { ok: true, time: Date.now() - startTime + 'ms' };
    console.log('✅ Ответ отправлен:', response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.log('💥 ОШИБКА:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Telegram bot API is running',
    time: new Date().toISOString()
  });
}

// Добавим обработку OPTIONS для CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}