import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📨 Сообщение:', body?.message?.text);
    
    // Отвечаем Telegram ТОЛЬКО ok: true
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Ошибка:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Telegram bot API is running' 
  });
}