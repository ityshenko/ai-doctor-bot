import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

const WELCOME = `
🏥 <b>AI Врач</b>

Здравствуйте! Я ваш виртуальный медицинский ассистент.

<b>Что я умею:</b>
📝 Анализировать симптомы по описанию
🎤 Слушать голосовые сообщения  
📸 Анализировать медицинские снимки и фото

<b>Команды:</b>
/start — Начать сначала
/clear — Очистить историю

⚠️ <i>Внимание: я не заменяю врача. При серьёзных симптомах обратитесь к специалисту.</i>
`;

if (!BOT_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN environment variable');
}

async function tgApi(method: string, params: any = {}) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function sendMessage(chatId: number, text: string) {
  return tgApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  });
}

async function getZAI() {
  try {
    const zaiModule = await import('z-ai-web-dev-sdk');
    // @ts-ignore
    if (zaiModule.ZAI) return new zaiModule.ZAI();
    // @ts-ignore
    if (zaiModule.default?.ZAI) return new zaiModule.default.ZAI();
    // @ts-ignore
    if (typeof zaiModule.default === 'function') return new zaiModule.default();
    return null;
  } catch (error) {
    console.error('Failed to import ZAI SDK:', error);
    return null;
  }
}

async function processText(text: string, chatId: number): Promise<string> {
  const zai = await getZAI();
  if (!zai) return 'Ошибка: не удалось инициализировать AI';
  
  // @ts-ignore
  const response = await zai.chat.completions.create({
    model: 'gemini-2.0-flash',
    messages: [{ role: 'user', content: text }],
  });

  // @ts-ignore
  return response.choices[0].message.content;
}

async function handleMessage(msg: any) {
  const chatId = msg.chat.id;
  console.log('Message received:', msg.text);

  if (msg.text === '/start') {
    await sendMessage(chatId, WELCOME);
    return;
  }

  if (msg.text) {
    const response = await processText(msg.text, chatId);
    await sendMessage(chatId, response);
    return;
  }

  await sendMessage(chatId, 'Отправьте текст или /start');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Webhook received:', JSON.stringify(body).substring(0, 200));
    
    if (body.message) {
      await handleMessage(body.message);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'setwebhook') {
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const url = `${proto}://${host}/api/telegram`;
    const result = await tgApi('setWebhook', { url });
    return NextResponse.json(result);
  }

  return NextResponse.json({ 
    status: 'ok', 
    message: 'Telegram bot API is running',
    timestamp: new Date().toISOString()
  });
}