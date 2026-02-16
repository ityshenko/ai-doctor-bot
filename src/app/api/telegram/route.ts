import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// Функция для отправки сообщений в Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });
  
  return response.json();
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('🔥🔥🔥 НОВЫЙ ЗАПРОС:', new Date().toISOString());
  
  try {
    const body = await req.json();
    console.log('📦 Тело запроса:', JSON.stringify(body).substring(0, 200));
    
    // Обрабатываем сообщения
    if (body.message) {
      const chatId = body.message.chat.id;
      const messageText = body.message.text || '';
      
      console.log('💬 Текст сообщения:', messageText);
      console.log('👤 Чат ID:', chatId);
      
      // Отправляем ответ
      if (messageText === '/start') {
        await sendTelegramMessage(chatId, 'Привет! Я бот на Vercel!');
      } else {
        await sendTelegramMessage(chatId, `Вы написали: ${messageText}`);
      }
    }
    
    // Обязательно возвращаем 200 OK для Telegram
    return NextResponse.json({ ok: true });
    
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