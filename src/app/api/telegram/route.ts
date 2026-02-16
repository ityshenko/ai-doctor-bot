import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

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

// Функция для получения ответа от ChatGPT
async function getAIResponse(userMessage: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Ты - AI доктор. Отвечай на вопросы о здоровье кратко, но профессионально. Если вопрос не связан со здоровьем, вежливо направляй к теме."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 200,
    });

    return completion.choices[0].message.content || "Извините, я не смог обработать запрос.";
  } catch (error) {
    console.error('OpenAI Error:', error);
    return "Произошла ошибка при обращении к AI. Попробуйте позже.";
  }
}

export async function POST(req: NextRequest) {
  console.log('🔥 НОВЫЙ ЗАПРОС:', new Date().toISOString());
  
  try {
    const body = await req.json();
    
    if (body.message) {
      const chatId = body.message.chat.id;
      const messageText = body.message.text || '';
      
      console.log('💬 Сообщение:', messageText);
      
      // Обрабатываем команды
      if (messageText === '/start') {
        await sendTelegramMessage(chatId, 'Здравствуйте! Я AI доктор. Опишите свои симптомы или задайте вопрос о здоровье.');
      } 
      else if (messageText === '/help') {
        await sendTelegramMessage(chatId, 'Просто напишите ваш вопрос о здоровье, и я постараюсь помочь.');
      }
      else {
        // Отправляем "печатает..." чтобы пользователь ждал
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendChatAction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, action: 'typing' })
        });
        
        // Получаем ответ от AI
        const aiResponse = await getAIResponse(messageText);
        
        // Отправляем ответ пользователю
        await sendTelegramMessage(chatId, aiResponse);
      }
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('💥 ОШИБКА:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'AI Doctor Bot is running'
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