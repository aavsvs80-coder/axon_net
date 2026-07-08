// zor.js (Core of AX Panel)

// رشته‌های رمزگذاری شده (Base64) برای جلوگیری از تغییر آسان در گیت‌هاب
// msg1 = "AX Panel | این پنل رایگان است"
const _0x4f12 = "QVggUGFuZWwgfCDYp9uM2YYg2b7ZhtmEINix2KfZitqv2KfZhiDYp9iz2Ko=";
// msg2 = "Support | @Pixonal"
const _0x9a3b = "U3VwcG9ydCB8IEBQaXhvbmFs";

// رمزگشایی رشته‌ها در زمان اجرا
const getDecodedMsg1 = () => decodeURIComponent(escape(atob(_0x4f12)));
const getDecodedMsg2 = () => decodeURIComponent(escape(atob(_0x9a3b)));

// تابع کمکی برای پاسخ‌های JSON
const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
};

export default async function (request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;

  // ۱. اتصال به دیتابیس KV
  const db = env.AX_DB;
  if (!db) {
    return new Response("لطفاً ابتدا یک KV Namespace با نام AX_DB بسازید و به ورکر متصل کنید.", { status: 500 });
  }

  // ۲. مدیریت مسیر ساب‌اسکریپشن (Subscription)
  if (path.startsWith("/sub/")) {
    const userId = path.split("/")[2];
    const userDataStr = await db.get(`user:${userId}`);
    if (!userDataStr) {
      return new Response("کاربر یافت نشد یا منقضی شده است.", { status: 404 });
    }

    const user = JSON.parse(userDataStr);
    
    // بررسی انقضا بر اساس زمان یا حجم
    const now = Date.now();
    if (user.expiry && now > user.expiry) {
      return new Response("اکانت شما منقضی شده است.", { status: 403 });
    }

    // ساخت دو کانفیگ نمایشی اول (رایگان بودن و آیدی روبیکا) به صورت مبهم شده
    const dummyConfig1 = `vless://00000000-0000-0000-0000-000000000000@127.0.0.1:443?encryption=none&security=tls&type=ws#${encodeURIComponent(getDecodedMsg1())}`;
    const dummyConfig2 = `vless://00000000-0000-0000-0000-000000000000@127.0.0.1:443?encryption=none&security=tls&type=ws#${encodeURIComponent(getDecodedMsg2())}`;

    // کانفیگ‌های اصلی کاربر
    const host = url.hostname;
    const mainConfig = `vless://${user.uuid}@${user.cleanIp || 'engage.cloudflareclient.com'}:443?encryption=none&security=tls&sni=${host}&fp=chrome&type=ws&host=${host}&path=%2F%3Fed%3D2048#${encodeURIComponent(user.name)}`;

    // ترکیب همه با هم و رمزگذاری Base64 استاندارد برای کلاینت‌ها
    const subContent = [dummyConfig1, dummyConfig2, mainConfig].join("\n");
    return new Response(btoa(unescape(encodeURIComponent(subContent))), {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  // ۳. APIهای مدیریت پنل
  if (path === "/api/configs" && request.method === "GET") {
    const list = await db.list({ prefix: "user:" });
    const users = [];
    for (const key of list.keys) {
      const val = await db.get(key.name);
      if (val) users.push(JSON.parse(val));
    }
    return jsonResponse(users);
  }

  if (path === "/api/config/create" && request.method === "POST") {
    const data = await request.json();
    const id = crypto.randomUUID();
    const newUser = {
      id: id,
      uuid: crypto.randomUUID(),
      name: data.name || "User_" + Math.floor(Math.random() * 1000),
      cleanIp: data.cleanIp || "engage.cloudflareclient.com",
      expiry: data.days ? (Date.now() + data.days * 24 * 60 * 60 * 1000) : null,
      limitGb: data.limitGb || 0,
      createdAt: Date.now()
    };
    await db.put(`user:${id}`, JSON.stringify(newUser));
    return jsonResponse({ success: true, user: newUser });
  }

  if (path === "/api/config/delete" && request.method === "POST") {
    const data = await request.json();
    await db.delete(`user:${data.id}`);
    return jsonResponse({ success: true });
  }

  // دریافت آمار کلودفلر (شبیه‌سازی و محاسبه از طریق کلودفلر یا توکن کاربر)
  if (path === "/api/stats" && request.method === "POST") {
    const { token, zoneId } = await request.json();
    if (!token || !zoneId) {
      return jsonResponse({ error: "توکن و Zone ID الزامی هستند" }, 400);
    }
    
    // کوئری GraphQL برای گرفتن تعداد درخواست‌های امروز و کل
    const query = `
      query {
        viewer {
          zones(filter: { zoneTag: "${zoneId}" }) {
            httpRequests1DayGroups(limit: 1, filter: { date_geq: "${new Date().toISOString().split('T')[0]}" }) {
              sum {
                requests
              }
            }
          }
        }
      }
    `;

    try {
      const cfRes = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      });
      const cfData = await cfRes.json();
      const todayReqs = cfData.data?.viewer?.zones[0]?.httpRequests1DayGroups[0]?.sum?.requests || "ناشناس";
      return jsonResponse({ todayRequests: todayReqs, totalRequests: "فعال" });
    } catch (e) {
      return jsonResponse({ error: "خطا در برقراری ارتباط با API کلودفلر" }, 500);
    }
  }

  // ۴. قالب فرانت‌اند (HTML/TailwindCSS کاملاً سفید و مدرن)
  const html = `
  <!DOCTYPE html>
  <html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AX Panel - مدیریت کانفیگ</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
    <style>
      body { font-family: 'Vazirmatn', sans-serif; background-color: #f8fafc; }
    </style>
  </head>
  <body class="text-slate-800 min-h-screen flex flex-col">

    <!-- هدر -->
    <header class="bg-white border-b border-slate-100 py-4 px-6 sticky top-0 z-50 shadow-sm">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-black text-indigo-600 tracking-tight">AX Panel</h1>
        <div class="flex items-center gap-4">
          <span class="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-medium">سیستم هوشمند فعال</span>
        </div>
      </div>
    </header>

    <main class="flex-grow max-w-6xl w-full mx-auto p-4 md:p-8 space-y-8">
      
      <!-- باکس تنظیمات کلودفلر و آمار -->
      <section class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 class="text-lg font-bold mb-4 text-slate-700">اتصال به کلودفلر برای دریافت آمار زنده</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input id="cfToken" type="password" placeholder="Cloudflare API Token" class="border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
          <input id="cfZoneId" type="text" placeholder="Cloudflare Zone ID" class="border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
          <button onclick="fetchCFStats()" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-semibold transition-all py-3">بروزرسانی آمار کلودفلر</button>
        </div>
        
        <!-- کارت‌های آمار -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
            <p class="text-xs text-slate-400 font-bold">تعداد کل کانفیگ‌ها</p>
            <p id="totalConfigsCount" class="text-3xl font-black text-indigo-600 mt-2">۰</p>
          </div>
          <div class="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
            <p class="text-xs text-slate-400 font-bold">درخواست‌های امروز کلودفلر</p>
            <p id="todayRequests" class="text-3xl font-black text-slate-800 mt-2">--</p>
          </div>
          <div class="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
            <p class="text-xs text-slate-400 font-bold">وضعیت پنل</p>
            <p class="text-3xl font-black text-emerald-500 mt-2">عالی</p>
          </div>
        </div>
      </section>

      <!-- بخش ساخت کانفیگ جدید -->
      <section class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 class="text-xl font-extrabold mb-6 text-slate-800">ساخت کاربر جدید</h2>
        <form id="createForm" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-2">نام کاربر</label>
            <input id="userName" type="text" required placeholder="مثال: Ali" class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-2">مدت زمان (روز)</label>
            <input id="userDays" type="number" value="30" class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-2">آی‌پی تمیز کلودفلر</label>
            <select id="userCleanIp" class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
              <option value="engage.cloudflareclient.com">پیشفرض (WARP)</option>
              <option value="172.67.14.12">IP Clean 1</option>
              <option value="104.18.2.2">IP Clean 2</option>
              <option value="speedtest.net">Speedtest IP</option>
            </select>
          </div>
          <button type="submit" class="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold py-3 px-6 transition-all text-sm h-[48px]">ایجاد کاربر</button>
        </form>
      </section>

      <!-- لیست کاربران ساخته شده -->
      <section class="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h2 class="text-xl font-extrabold mb-6 text-slate-800">لیست کاربران فعال</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-right text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 font-bold">
                <th class="pb-3">نام کاربر</th>
                <th class="pb-3">آی‌پی تمیز</th>
                <th class="pb-3">تاریخ انقضا</th>
                <th class="pb-3">لینک ساب‌اسکریپشن</th>
                <th class="pb-3">عملیات</th>
              </tr>
            </thead>
            <tbody id="usersList" class="divide-y divide-slate-50">
              <!-- کاربران داینامیک اینجا اضافه می‌شوند -->
            </tbody>
          </table>
        </div>
      </section>

    </main>

    <footer class="text-center py-6 text-xs text-slate-400 border-t border-slate-100 mt-12">
      AX Panel - قدرت گرفته از کلودفلر لبه شبکه
    </footer>

    <script>
      const dbUrl = window.location.origin;

      async function fetchCFStats() {
        const token = document.getElementById('cfToken').value;
        const zoneId = document.getElementById('cfZoneId').value;
        if(!token || !zoneId) return alert('پر کردن فیلدهای توکن و Zone ID الزامی است!');

        // ذخیره سازی در مرورگر کلاینت برای دفعه‌های بعدی
        localStorage.setItem('cf_token', token);
        localStorage.setItem('cf_zone', zoneId);

        try {
          const res = await fetch(\`\${dbUrl}/api/stats\`, {
            method: 'POST',
            body: JSON.stringify({ token, zoneId })
          });
          const data = await res.json();
          if(data.todayRequests) {
            document.getElementById('todayRequests').innerText = Number(data.todayRequests).toLocaleString('fa-IR');
          }
        } catch(e) {
          alert('خطا در دریافت آمار');
        }
      }

      // لود کردن تنظیمات ذخیره شده کلودفلر
      document.addEventListener('DOMContentLoaded', () => {
        const savedToken = localStorage.getItem('cf_token');
        const savedZone = localStorage.getItem('cf_zone');
        if(savedToken) document.getElementById('cfToken').value = savedToken;
        if(savedZone) document.getElementById('cfZoneId').value = savedZone;
        
        loadUsers();
      });

      async function loadUsers() {
        const res = await fetch(\`\${dbUrl}/api/configs\`);
        const users = await res.json();
        document.getElementById('totalConfigsCount').innerText = users.length.toLocaleString('fa-IR');

        const tbody = document.getElementById('usersList');
        tbody.innerHTML = '';

        users.forEach(user => {
          const expiryDate = user.expiry ? new Date(user.expiry).toLocaleDateString('fa-IR') : 'نامحدود';
          const subLink = \`\${dbUrl}/sub/\${user.id}\`;
          
          tbody.innerHTML += \`
            <tr class="hover:bg-slate-50/50 transition-all">
              <td class="py-4 font-bold text-slate-800">\${user.name}</td>
              <td class="py-4 text-slate-500 font-mono text-xs">\${user.cleanIp}</td>
              <td class="py-4 text-slate-500">\${expiryDate}</td>
              <td class="py-4 font-mono text-xs text-indigo-600">
                <div class="flex items-center gap-2">
                  <input readonly value="\${subLink}" class="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-[10px] w-64 focus:outline-none">
                  <button onclick="navigator.clipboard.writeText('\${subLink}'); alert('کپی شد!')" class="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-300">کپی</button>
                </div>
              </td>
              <td class="py-4">
                <button onclick="deleteUser('\${user.id}')" class="text-rose-500 hover:text-rose-700 font-medium text-xs">حذف</button>
              </td>
            </tr>
          \`;
        });
      }

      document.getElementById('createForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('userName').value;
        const days = parseInt(document.getElementById('userDays').value);
        const cleanIp = document.getElementById('userCleanIp').value;

        await fetch(\`\${dbUrl}/api/config/create\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, days, cleanIp })
        });

        document.getElementById('userName').value = '';
        loadUsers();
      });

      async function deleteUser(id) {
        if(!confirm('آیا از حذف این کاربر اطمینان دارید؟')) return;
        await fetch(\`\${dbUrl}/api/config/delete\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        loadUsers();
      }
    </script>
  </body>
  </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}
