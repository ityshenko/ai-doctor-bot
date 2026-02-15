export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui',
      background: 'linear-gradient(to bottom right, #eff6ff, #f0fdf4)'
    }}>
      <div style={{ 
        width: 80, 
        height: 80, 
        background: 'linear-gradient(to bottom right, #3b82f6, #22c55e)',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
        marginBottom: 20
      }}>
        🏥
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
        AI Врач Бот
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>
        Отправьте /start в Telegram
      </p>
      <div style={{ 
        padding: '8px 16px', 
        background: '#dcfce7', 
        color: '#166534',
        borderRadius: 999,
        fontSize: 14,
        fontWeight: 500
      }}>
        ✅ Бот работает
      </div>
    </main>
  );
}