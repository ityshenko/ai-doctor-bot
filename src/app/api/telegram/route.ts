import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_URL = process.env.WEBHOOK_URL!;

const histories = new Map<number, Array<{role: string; content: string}>>();

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

async function tgApi(method: string, params: Record<string, unknown> = {}) {
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

async function sendAction(chatId: number, action: string) {
  return tgApi('sendChatAction', { chat_id: chatId, action });
}

async function downloadFile(fileId: string): Promise<Buffer> {
  const fileInfo = await tgApi('getFile', { file_id: fileId });
  const filePath = fileInfo.result.file_path;
  const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

async function getZAI() {
  try {
    // @ts-ignore - полностью игнорируем проверку типов для этого импорта
    const zaiModule = await import('z-ai-web-dev-sdk');
    
    // @ts-ignore
    if (zaiModule.ZAI) {
      // @ts-ignore
      return new zaiModule.ZAI();
    }
    
    // @ts-ignore
    if (zaiModule.default) {
      // @ts-ignore
      if (zaiModule.default.ZAI) {
        // @ts-ignore
        return new zaiModule.default.ZAI();
      }
      // @ts-ignore
      if (typeof zaiModule.default === 'function') {
        // @ts-ignore
        return new zaiModule.default();
      }
    }
    
    // @ts-ignore
    for (const key in zaiModule) {
      // @ts-ignore
      const value = zaiModule[key];
      if (typeof value === 'function') {
        // @ts-ignore
        return new value();
      }
    }
    
    console.error('ZAI class not found in SDK');
    return null;
  } catch (error) {
    console.error('Failed to import ZAI SDK:', error);
    return null;
  }
}
    
    // Ищем любой конструктор с именем ZAI
    for (const key in zaiModule) {
      const value = zaiModule[key as keyof typeof zaiModule];
      if (typeof value === 'function' && 
          (value.name === 'ZAI' || key === 'ZAI' || key === 'default')) {
        return new (value as any)();
      }
    }
    
    console.error('ZAI class not found in SDK');
    return null;
  } catch (error) {
    console.error('Failed to import ZAI SDK:', error);
    return null;
  }
}

async function processText(text: string, chatId: number): Promise<string> {
  const history = histories.get(chatId) || [];
  history.push({ role: 'user', content: text });
  
  const zai = await getZAI();
  if (!zai) return 'Ошибка: не удалось инициализировать AI';
  
  const response = await zai.chat.completions.create({
    model: 'gemini-2.0-flash',
    messages: [
      {
        role: 'system',
        content: 'Ты врач-терапевт. Помогай пациентам разбираться с симптомами. Отвечай на русском.'
      },
      ...history
    ],
  });

  const reply = response.choices[0].message.content;
  history.push({ role: 'assistant', content: reply });
  histories.set(chatId, history);
  
  return reply;
}

async function transcribeVoice(base64: string): Promise<string> {
  const zai = await getZAI();
  if (!zai) return 'Ошибка распознавания';
  
  const result = await zai.audio.asr.create({
    file_base64: base64
  });
  return result.text || 'Не распознано';
}

async function analyzeImage(base64: string, prompt: string): Promise<string> {
  const zai = await getZAI();
  if (!zai) return 'Ошибка анализа изображения';
  
  const response = await zai.chat.completions.create({
    model: 'gemini-2.0-flash',
    messages: [
      {
        role: 'system',
        content: 'Ты врач. Анализируй медицинские изображения. Отвечай на русском.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', data: base64 }
        ]
      }
    ],
  });

  return response.choices[0].message.content;
}

async function handleMessage(msg: any) {
  const chatId = msg.chat.id;

  if (msg.text === '/start') {
    await sendMessage(chatId, WELCOME);
    return;
  }

  if (msg.text === '/clear') {
    histories.delete(chatId);
    await sendMessage(chatId, '🗑 История очищена');
    return;
  }

  if (msg.text) {
    await sendAction(chatId, 'typing');
    const response = await processText(msg.text, chatId);
    await sendMessage(chatId, response);
    return;
  }

  if (msg.voice) {
    await sendAction(chatId, 'typing');
    const audio = await downloadFile(msg.voice.file_id);
    const text = await transcribeVoice(audio.toString('base64'));
    await sendMessage(chatId, `🎤 <i>Вы сказали:</i> "${text}"`);
    const response = await processText(text, chatId);
    await sendMessage(chatId, response);
    return;
  }

  if (msg.photo?.length) {
    await sendAction(chatId, 'upload_photo');
    const photo = msg.photo[msg.photo.length - 1];
    const image = await downloadFile(photo.file_id);
    const response = await analyzeImage(image.toString('base64'), msg.caption || 'Проанализируй это медицинское изображение');
    await sendMessage(chatId, response);
    return;
  }

  await sendMessage(chatId, '🤖 Пожалуйста, отправьте текст, голосовое сообщение или фото');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.message) {
      handleMessage(body.message).catch(console.error);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in POST /api/telegram:', error);
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
    return NextResponse.json({ ...result, webhook_url: url });
  }

  if (action === 'info') {
    return NextResponse.json({ 
      status: 'ok', 
      bot_token_set: !!BOT_TOKEN,
      webhook_url_set: !!WEBHOOK_URL
    });
  }

  return NextResponse.json({ 
    status: 'ok', 
    message: 'Telegram bot API is running',
    timestamp: new Date().toISOString()
  });
}