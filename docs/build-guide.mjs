import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const docsDir = path.resolve('/Users/saparboy/Projects/Post2SocialMedia/docs')
const imagesDir = path.join(docsDir, 'images')

function getBase64Image(filename) {
  const filePath = path.join(imagesDir, filename)
  if (!fs.existsSync(filePath)) return ''
  const ext = path.extname(filename).replace('.', '')
  const b64 = fs.readFileSync(filePath).toString('base64')
  return `data:image/${ext};base64,${b64}`
}

const imgDashboard = getBase64Image('01_dashboard.png')
const imgCompose = getBase64Image('02_compose.png')
const imgButtons = getBase64Image('03_inline_buttons.png')
const imgScheduled = getBase64Image('04_scheduled.png')
const imgHistory = getBase64Image('05_history.png')
const imgSettings = getBase64Image('06_settings.png')
const imgDigest = getBase64Image('07_telegram_digest.png')
const imgDesktop = getBase64Image('08_desktop_app.png')

const htmlContent = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TelePost v1.1.0 - Foydalanish Qo'llanmasi</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    :root {
      --primary: #6366f1;
      --primary-dark: #4f46e5;
      --accent: #06b6d4;
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: rgba(99, 102, 241, 0.15);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.65;
      padding: 0;
      margin: 0;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 960px;
      margin: 0 auto;
      padding: 40px 24px 80px 24px;
    }

    /* Cover / Header */
    .header {
      text-align: center;
      padding: 60px 20px 40px;
      background: linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0) 100%);
      border-radius: 24px;
      margin-bottom: 40px;
      border: 1px solid var(--card-border);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    h1 {
      font-size: 2.75rem;
      font-weight: 800;
      background: linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, #06b6d4 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 12px;
      line-height: 1.2;
    }

    .subtitle {
      font-size: 1.15rem;
      color: var(--text-muted);
      max-width: 650px;
      margin: 0 auto 20px;
    }

    .version-meta {
      display: flex;
      justify-content: center;
      gap: 20px;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .version-meta span {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    /* Table of contents */
    .toc {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 40px;
    }

    .toc h3 {
      font-size: 1.1rem;
      color: #ffffff;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toc ol {
      padding-left: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 8px 24px;
    }

    .toc li a {
      color: #93c5fd;
      text-decoration: none;
      font-size: 0.92rem;
      transition: color 0.2s;
    }

    .toc li a:hover {
      color: #ffffff;
      text-decoration: underline;
    }

    /* Section styling */
    .section {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      page-break-inside: avoid;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .section-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.3));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      border: 1px solid rgba(99, 102, 241, 0.4);
    }

    h2 {
      font-size: 1.45rem;
      font-weight: 700;
      color: #ffffff;
    }

    h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #e2e8f0;
      margin: 20px 0 10px;
    }

    p {
      color: #cbd5e1;
      margin-bottom: 14px;
      font-size: 0.95rem;
    }

    ul, ol {
      color: #cbd5e1;
      padding-left: 20px;
      margin-bottom: 16px;
      font-size: 0.95rem;
    }

    li {
      margin-bottom: 8px;
    }

    strong {
      color: #ffffff;
    }

    /* Code blocks and inline code */
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: rgba(15, 23, 42, 0.7);
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 0.88rem;
      color: #38bdf8;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    pre {
      background: #090d16;
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      padding: 16px;
      margin: 14px 0 20px;
      overflow-x: auto;
    }

    pre code {
      background: transparent;
      padding: 0;
      border: none;
      color: #e2e8f0;
    }

    /* Screenshots */
    .screenshot-box {
      margin: 20px 0;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
      background: #0b1120;
    }

    .screenshot-box img {
      width: 100%;
      height: auto;
      display: block;
    }

    .screenshot-caption {
      padding: 10px 16px;
      background: #0f172a;
      font-size: 0.82rem;
      color: var(--text-muted);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Alert / Note boxes */
    .alert {
      padding: 16px 20px;
      border-radius: 12px;
      margin: 18px 0;
      font-size: 0.92rem;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .alert-info {
      background: rgba(6, 182, 212, 0.1);
      border-left: 4px solid var(--accent);
      color: #bae6fd;
    }

    .alert-success {
      background: rgba(16, 185, 129, 0.1);
      border-left: 4px solid var(--success);
      color: #a7f3d0;
    }

    .alert-warning {
      background: rgba(245, 158, 11, 0.1);
      border-left: 4px solid var(--warning);
      color: #fde68a;
    }

    .alert-icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    /* Feature grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }

    .grid-card {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px;
    }

    .grid-card h4 {
      font-size: 0.95rem;
      color: #ffffff;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .grid-card p {
      font-size: 0.85rem;
      margin: 0;
      color: var(--text-muted);
    }

    /* Footer */
    .footer {
      text-align: center;
      padding-top: 40px;
      color: var(--text-muted);
      font-size: 0.85rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Print styles */
    @media print {
      body {
        background-color: #ffffff !important;
        color: #0f172a !important;
      }
      .container {
        max-width: 100% !important;
        padding: 0 !important;
      }
      .section {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        margin-bottom: 24px !important;
        padding: 20px !important;
      }
      h1, h2, h3, h4, strong {
        color: #0f172a !important;
        -webkit-text-fill-color: initial !important;
      }
      p, li {
        color: #334155 !important;
      }
      .header {
        background: #f8fafc !important;
        border: 1px solid #e2e8f0 !important;
        padding: 30px 10px !important;
      }
      .screenshot-box {
        border: 1px solid #cbd5e1 !important;
        box-shadow: none !important;
      }
      .screenshot-caption {
        background: #f1f5f9 !important;
        color: #475569 !important;
      }
      .alert {
        background: #f8fafc !important;
      }
      .alert-info { border-left-color: #0284c7 !important; color: #0369a1 !important; }
      .alert-success { border-left-color: #16a34a !important; color: #15803d !important; }
      .alert-warning { border-left-color: #d97706 !important; color: #b45309 !important; }
      pre, code {
        background: #f1f5f9 !important;
        color: #0f172a !important;
        border-color: #cbd5e1 !important;
      }
      .grid-card {
        background: #f8fafc !important;
        border-color: #e2e8f0 !important;
      }
    }
  </style>
</head>
<body>

<div class="container">
  <!-- Header / Title -->
  <div class="header">
    <div class="badge">🚀 RASMIY QO'LLANMA</div>
    <h1>TelePost v1.1.0</h1>
    <p class="subtitle">Telegram Kanallar va Guruhlarni Boshqarish, Avtomatlashtirilgan Postlar va Auditoriya Tahlili Bo'yicha To'liq Qo'llanma</p>
    <div class="version-meta">
      <span>📦 Versiya: <strong>1.1.0</strong></span>
      <span>💻 Platforma: <strong>macOS (Apple Silicon) & Windows (x64)</strong></span>
      <span>📅 Sana: <strong>Sentyabr 2026</strong></span>
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="toc">
    <h3>📑 Mundarija</h3>
    <ol>
      <li><a href="#section-1">1. Dasturni O'rnatish va Ishga Tushirish</a></li>
      <li><a href="#section-2">2. Umumiy Ko'rinish (Dashboard)</a></li>
      <li><a href="#section-3">3. Bot va Kanallarni Sozlash</a></li>
      <li><a href="#section-4">4. Yangi Post Yaratish va Yuborish</a></li>
      <li><a href="#section-5">5. Interaktiv Tugmalar (Inline Buttons)</a></li>
      <li><a href="#section-6">6. Postlarni Rejalashtirish (Scheduler)</a></li>
      <li><a href="#section-7">7. Tarix va Analitika</a></li>
      <li><a href="#section-8">8. Real-Vaqtda Auditoriya va Adminlar JSON Hisoboti</a></li>
      <li><a href="#section-9">9. Kunlik Telegram Xulosasi (Daily Digest)</a></li>
      <li><a href="#section-10">10. Tizim Sozlamalari va Xavfsizlik</a></li>
    </ol>
  </div>

  <!-- Section 1 -->
  <div class="section" id="section-1">
    <div class="section-header">
      <div class="section-icon">📥</div>
      <h2>1. Dasturni O'rnatish va Ishga Tushirish</h2>
    </div>
    <p>TelePost — bu Telegram kanallari va superguruhlarida professional kontent tarqatish, rejalashtirish va hisobotlar yuritish uchun mo'ljallangan krossplatforma desktop ilovasi.</p>

    <h3>🍎 macOS (Apple Silicon M1/M2/M3/M4) uchun:</h3>
    <ol>
      <li><code>dist/TelePost-1.1.0-mac-arm64.dmg</code> faylini oching.</li>
      <li>Chiqadigan oynada <strong>TelePost.app</strong> belgisini <strong>Applications</strong> papkasiga tortib tashlang.</li>
      <li>Ilovani oching. Agar birinchi marta tizim xavfsizlik ogohlantirishi chiqsa: <em>System Settings → Privacy & Security → Open Anyway</em> tugmasini bosing.</li>
    </ol>

    ${imgDesktop ? `
    <div class="screenshot-box">
      <img src="${imgDesktop}" alt="macOS TelePost Desktop ilovasi">
      <div class="screenshot-caption">📷 1-rasm: TelePost macOS tizimida mustaqil desktop ilova sifatida ishga tushgan holati</div>
    </div>
    ` : ''}

    <h3>🪟 Windows (x64) uchun:</h3>
    <ol>
      <li><code>dist/TelePost-Setup-1.1.0.exe</code> o'rnatuvchi faylini yuklab oling va ishga tushiring.</li>
      <li>O'rnatish ustasi dasturni avtomatik tarzda o'rnatadi va ish stoliga (Desktop) yorliq (shortcut) chiqaradi.</li>
      <li>Ish stolidagi <strong>TelePost</strong> yorlig'ini bosing. Dastur bir zumda ochiladi.</li>
    </ol>

    <div class="alert alert-info">
      <div class="alert-icon">💡</div>
      <div><strong>Eslatma:</strong> Desktop ilova to'liq oflayn ishlaydi, ma'lumotlar bazasi (SQLite) kompyuteringizning xavfsiz papkasida shaxsiy tarzda saqlanadi.</div>
    </div>
  </div>

  <!-- Section 2 -->
  <div class="section" id="section-2">
    <div class="section-header">
      <div class="section-icon">📊</div>
      <h2>2. Umumiy Ko'rinish (Dashboard)</h2>
    </div>
    <p>Dastur ishga tushganda asosiy boshqaruv paneli — <strong>Dashboard</strong> ochiladi. Bu yerda siz barcha muhim ko'rsatkichlarni bir joyda ko'rishingiz mumkin.</p>

    <div class="grid">
      <div class="grid-card">
        <h4>📢 Faol Kanallar</h4>
        <p>Ulangan va xabar yuborishga tayyor bo'lgan barcha kanallar va guruhlar soni.</p>
      </div>
      <div class="grid-card">
        <h4>📝 Bugungi Postlar</h4>
        <p>Bugun muvaffaqiyatli tarqatilgan jami yangi xabarlar hisoblagichi.</p>
      </div>
      <div class="grid-card">
        <h4>⏰ Navbatdagi Postlar</h4>
        <p>Muayyan sana yoki soatga rejalashtirilgan va o'z vaqtini kutayotgan xabarlar.</p>
      </div>
      <div class="grid-card">
        <h4>📈 Jami Statistika</h4>
        <p>Barcha vaqtlar davomida chop etilgan umumiy postlar arxivi.</p>
      </div>
    </div>

    ${imgDashboard ? `
    <div class="screenshot-box">
      <img src="${imgDashboard}" alt="Dashboard Umumiy ko'rinish">
      <div class="screenshot-caption">📷 2-rasm: Asosiy boshqaruv paneli (Dashboard) va faollik ko'rsatkichlari</div>
    </div>
    ` : ''}
  </div>

  <!-- Section 3 -->
  <div class="section" id="section-3">
    <div class="section-header">
      <div class="section-icon">📢</div>
      <h2>3. Bot va Kanallarni Sozlash</h2>
    </div>
    <p>Postlar yuborish va hisobotlarni qabul qilish uchun Telegram bot va kerakli guruh yoki kanallarni ilovaga biriktirish kerak.</p>

    <h3>1. Bot yaratish va Token olish:</h3>
    <ol>
      <li>Telegramda <code>@BotFather</code> botiga kiring va <code>/newbot</code> buyrug'ini yuboring.</li>
      <li>Bot nomini va usernameni kiriting (masalan: <code>zargar_maxalla_bot</code>).</li>
      <li>BotFather bergan maxfiy HTTP API tokenni nusxalab oling (masalan: <code>8755328959:AAH4...</code>).</li>
      <li>Dasturda <strong>Sozlamalar (Settings)</strong> bo'limiga kirib, Bot Token maydoniga joylang va saqlang.</li>
    </ol>

    <h3>2. Kanal yoki Guruh qo'shish usullari:</h3>
    <div class="alert alert-success">
      <div class="alert-icon">⚡</div>
      <div><strong>Ajoyib Yangilik (v1.1.0):</strong> Botni Telegramning o'zida yangi kanal yoki guruhga <strong>Admin</strong> qilib qo'shsangiz, tizim buni <strong>avtomatik tarzda real-vaqtda</strong> aniqlaydi va o'zi ro'yxatga oladi!</div>
    </div>

    <p>Shuningdek, dastur interfeysidagi <strong>"Kanal qo'shish"</strong> tugmasi orqali ham qo'shishingiz mumkin:</p>
    <ul>
      <li><strong>Yakka kanal qo'shish:</strong> Kanal ID si (masalan <code>-1001608478012</code>) yoki username (<code>@kanal_nomi</code>).</li>
      <li><strong>Bir vaqtning o'zida bir nechta kanal qo'shish:</strong> Vergul yoki qator tashlab bir nechtasini kiriting:
        <pre><code>-1001608478012, @yangiliklar_uz, -100192837465</code></pre>
      </li>
    </ul>
  </div>

  <!-- Section 4 -->
  <div class="section" id="section-4">
    <div class="section-header">
      <div class="section-icon">✍️</div>
      <h2>4. Yangi Post Yaratish va Yuborish</h2>
    </div>
    <p>Chap menyudan <strong>"Xabar yozish" (Compose)</strong> bo'limini tanlang. Bu yerda professional Telegram postlarini tayyorlash uchun barcha vositalar mavjud.</p>

    ${imgCompose ? `
    <div class="screenshot-box">
      <img src="${imgCompose}" alt="Xabar yozish oynasi">
      <div class="screenshot-caption">📷 3-rasm: Post muharriri, media yuklash va jonli ko'rinish (Live Preview)</div>
    </div>
    ` : ''}

    <h3>Asosiy imkoniyatlar:</h3>
    <ul>
      <li><strong>Kanalni tanlash:</strong> Postni bitta kanalga yoki barcha kanallarga bir vaqtda yuborish uchun biriktiring.</li>
      <li><strong>Formatlash (HTML / Markdown):</strong> Matnlarni <b>qalin</b>, <i>kursiv</i>, <u>tagiga chizilgan</u>, <s>ustidan chizilgan</s> yoki havola ko'rinishida formatlang.</li>
      <li><strong>Jonli Ko'rinish (Live Preview):</strong> Xabar Telegramda foydalanuvchilarga qanday ko'rinishda borishini o'ng tomondagi ekranda darhol kuzatib boring.</li>
      <li><strong>Media Fayllar:</strong> Rasm (Photo), Video, Hujjat (PDF/ZIP) yoki Ovozli xabarlarni sudrab tashlang (Drag & Drop).</li>
      <li><strong>Text-to-Speech:</strong> Matndan avtomatik audio generatsiya qilish imkoniyati.</li>
    </ul>
  </div>

  <!-- Section 5 -->
  <div class="section" id="section-5">
    <div class="section-header">
      <div class="section-icon">🔘</div>
      <h2>5. Interaktiv Tugmalar (Inline Buttons)</h2>
    </div>
    <p>Xabaringiz tagiga chiroyli va qulay interaktiv tugmalar (Inline Keyboard) biriktirishingiz mumkin.</p>

    ${imgButtons ? `
    <div class="screenshot-box">
      <img src="${imgButtons}" alt="Inline Keyboard sozlash">
      <div class="screenshot-caption">📷 4-rasm: Xabar ostiga interaktiv tugmalar qo'shish bloki</div>
    </div>
    ` : ''}

    <ul>
      <li><strong>Havola tugmasi (URL):</strong> Foydalanuvchilarni saytingizga, veb-sahifaga yoki boshqa manzilga yo'naltiruvchi tugma.</li>
      <li><strong>Telegram havolasi:</strong> Admin akkaunti yoki guruh muhokamasiga o'tish tugmasi.</li>
      <li><strong>Qatorlar strukturasi:</strong> <code>+ Add Row</code> tugmasi orqali tugmalarni bir necha qator va ustunlarga ajratib joylashtirishingiz mumkin.</li>
    </ul>
  </div>

  <!-- Section 6 -->
  <div class="section" id="section-6">
    <div class="section-header">
      <div class="section-icon">⏰</div>
      <h2>6. Postlarni Rejalashtirish (Scheduler)</h2>
    </div>
    <p>Har doim kompyuter oldida o'tirish shart emas. Postlarni bir necha kun yoki hafta oldin belgilangan soatlarga rejalashtirib qo'yishingiz mumkin.</p>

    ${imgScheduled ? `
    <div class="screenshot-box">
      <img src="${imgScheduled}" alt="Rejalashtirilgan postlar">
      <div class="screenshot-caption">📷 5-rasm: Rejalashtirilgan xabarlar taqvimi va navbati</div>
    </div>
    ` : ''}

    <h3>Rejalashtirish imkoniyatlari:</h3>
    <ul>
      <li><strong>Aniq sana va vaqt:</strong> Post aynan qaysi kuni va soat necha daqiqada chiqishi kerakligini belgilang.</li>
      <li><strong>Takrorlanuvchi postlar:</strong> Har kuni, har 2 kunda yoki haftaning ma'lum kunlarida avtomatik ravishda qayta e'lon qilinadigan xabarlar.</li>
      <li><strong>Avto-o'chirish (Auto-Delete):</strong> E'lon qilinganidan 24 soat yoki 3 kundan keyin postni kanaldan avtomatik o'chirish funksiyasi (vaqtinchalik e'lonlar va aksiyalar uchun ayni muddao).</li>
    </ul>
  </div>

  <!-- Section 7 -->
  <div class="section" id="section-7">
    <div class="section-header">
      <div class="section-icon">📜</div>
      <h2>7. Tarix va Analitika (History)</h2>
    </div>
    <p>Chop etilgan har bir post <strong>"Tarix" (History)</strong> bo'limida saqlanadi. U yerda xabarning yuborilgan vaqti, qaysi kanallarga yetib borganligi, xabarning Telegramdagi ID si va holati ko'rinib turadi.</p>

    ${imgHistory ? `
    <div class="screenshot-box">
      <img src="${imgHistory}" alt="Postlar tarixi">
      <div class="screenshot-caption">📷 6-rasm: Yuborilgan postlar tarixi va holatlari</div>
    </div>
    ` : ''}

    <p>Agar kerak bo'lsa, xabarni to'g'ridan-to'g'ri dasturdan turib Telegram kanalining o'zidan ham o'chirib tashlash imkoniyati mavjud.</p>
  </div>

  <!-- Section 8 -->
  <div class="section" id="section-8">
    <div class="section-header">
      <div class="section-icon">🛡️</div>
      <h2>8. Real-Vaqtda Auditoriya va Adminlar JSON Hisoboti</h2>
    </div>
    <p>TelePost'ning eng kuchli eksklyuziv imkoniyatlaridan biri — bu guruh va kanallarning auditoriyasi hamda administratorlari to'g'risida doimiy va xavfsiz hisobot yuritishdir.</p>

    <div class="grid">
      <div class="grid-card">
        <h4>🔒 Bir Martalik To'liq Eksport</h4>
        <p>Yangi kanal qo'shilganda uning barcha adminlari to'liq ro'yxati (ID, Ism, Familiya, Username, Role) tuzilib, tayyor JSON fayl qilib owner Telegramiga yuboriladi.</p>
      </div>
      <div class="grid-card">
        <h4>🚫 Zero-Spam Kafolati</h4>
        <p>Dastur holatni diskdagi doimiy faylda eslab qoladi. Dastur qayta ochilganda agar yangi odam qo'shilmagan bo'lsa, mutlaqo jim turadi, ortiqcha fayl tashlamaydi.</p>
      </div>
      <div class="grid-card">
        <h4>👥 Yangi A'zolar Monitoringi</h4>
        <p>Guruhga yangi a'zolar qo'shilgandagina yoki yangi admin tayinlangandagina bot sizga darhol yangilanish haqida xabar beradi.</p>
      </div>
      <div class="grid-card">
        <h4>⚡ Multi-Kanal Qo'llab-quvvatlash</h4>
        <p>Botni 5 ta yangi guruhga qo'shsangiz, ularning har birining alohida hisoboti birma-bir sizning shaxsiy Telegramingizga yetib boradi.</p>
      </div>
    </div>
  </div>

  <!-- Section 9 -->
  <div class="section" id="section-9">
    <div class="section-header">
      <div class="section-icon">📈</div>
      <h2>9. Kunlik Telegram Xulosasi (Daily Digest)</h2>
    </div>
    <p>Har kuni ertalab soat 09:00 dan keyin bot o'zi biriktirilgan kanallar bo'yicha kunlik to'liq tahlilni sizning Telegramingizga chiroyli xulosa qilib yuboradi.</p>

    ${imgDigest ? `
    <div class="screenshot-box">
      <img src="${imgDigest}" alt="Telegram Kunlik Xulosasi">
      <div class="screenshot-caption">📷 7-rasm: Telegram bot orqali keladigan kunlik hisobot (Daily Digest)</div>
    </div>
    ` : ''}

    <p>Kunlik xulosada quyidagilar aks etadi:</p>
    <ul>
      <li>Oxirgi 24 soatda chop etilgan postlar soni</li>
      <li>Kanallar bo'yicha jami yangi ko'rishlar (Views)</li>
      <li>Postlarga bildirilgan reaksiyalar (Reactions) va ulashishlar (Shares)</li>
      <li>Kanallarning jami a'zolari dinamikasi</li>
    </ul>
  </div>

  <!-- Section 10 -->
  <div class="section" id="section-10">
    <div class="section-header">
      <div class="section-icon">⚙️</div>
      <h2>10. Tizim Sozlamalari va Xavfsizlik</h2>
    </div>
    <p><strong>"Sozlamalar" (Settings)</strong> bo'limida ilovaning barcha asosiy parametrlari boshqariladi:</p>

    ${imgSettings ? `
    <div class="screenshot-box">
      <img src="${imgSettings}" alt="Sozlamalar oynasi">
      <div class="screenshot-caption">📷 8-rasm: Xavfsizlik va tizim sozlamalari</div>
    </div>
    ` : ''}

    <ul>
      <li><strong>Bot Tokeni:</strong> Telegram botining HTTP API tokenini xavfsiz saqlash va yangilash.</li>
      <li><strong>Xavfsizlik & Parol:</strong> Dasturga kirish parolini o'zgartirish.</li>
      <li><strong>Tilni tanlash:</strong> Interfeysni O'zbekcha (Lotin) yoki Inglizcha tillariga o'tkazish.</li>
      <li><strong>Tizim holati:</strong> Baza holati, ilova versiyasi (v1.1.0) va lokal xotira parametrlari.</li>
    </ul>

    <div class="alert alert-warning">
      <div class="alert-icon">⚠️</div>
      <div><strong>Xavfsizlik Tavsiyasi:</strong> Bot tokeningizni va ma'lumotlar bazasini uchinchi shaxslarga bermang. Dastur barcha ma'lumotlarni shaxsiy kompyuteringizda shifrlangan va xavfsiz holda saqlaydi.</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>© 2026 TelePost Ecosystem. Barcha huquqlar himoyalangan.</p>
    <p>Versiya: <strong>v1.1.0</strong> | Platformalar: <strong>macOS & Windows</strong></p>
  </div>
</div>

</body>
</html>
`

fs.writeFileSync(path.join(docsDir, 'TelePost_Qollanma.html'), htmlContent, 'utf-8')
console.log('✅ HTML guide generated successfully: docs/TelePost_Qollanma.html')

// Now convert to PDF using Chrome Headless
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const htmlPath = path.join(docsDir, 'TelePost_Qollanma.html')
const pdfPath = path.join(docsDir, 'TelePost_Qollanma.pdf')

try {
  console.log('Generating PDF via headless Chrome...')
  execSync(`"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`, {
    stdio: 'inherit',
  })
  console.log('✅ PDF guide generated successfully:', pdfPath)
} catch (err) {
  console.error('Failed to generate PDF:', err)
}
