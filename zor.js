<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AX Panel | سیستم مدیریت هوشمند</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <style>
    body { font-family: 'Vazirmatn', sans-serif; background-color: #fcfcfc; }
    .custom-shadow { box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02); }
  </style>
</head>
<body class="text-slate-800 min-h-screen flex flex-col antialiased">

  <!-- هدر پنل (تم کاملا سفید مینیمال) -->
  <header class="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 sticky top-0 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">AX</div>
        <div>
          <h1 class="text-lg font-black text-slate-900 tracking-tight">AX Panel</h1>
          <p class="text-[10px] text-slate-400 font-extrabold">سامانه مدیریت اتصالات کلودفلر</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span id="systemStatus" class="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          هسته لبه شبکه فعال
        </span>
      </div>
    </div>
  </header>

  <!-- محتوای اصلی پنل -->
  <main class="flex-grow max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
    
    <!-- راه انداز اولیه هوشمند (Setup Wizard) -->
    <section id="setupWizard" class="hidden bg-white border border-slate-100 rounded-3xl p-6 md:p-8 custom-shadow">
      <div class="max-w-2xl">
        <span class="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1.5 rounded-xl">پیکربندی هوشمند</span>
        <h2 class="text-2xl font-black text-slate-950 mt-3 mb-2">اتصال مستقیم به لبه شبکه کلودفلر</h2>
        <p class="text-sm text-slate-500 mb-6 leading-relaxed">جهت دریافت خودکار آمار درخواست‌ها و ایجاد ایمن اتصالات، اطلاعات زیر را تکمیل نمایید. این اطلاعات در پایگاه داده امن شما ذخیره می‌شود.</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label class="block text-xs font-bold text-slate-400 mb-2">Cloudflare API Token</label>
            <input id="wizardToken" type="password" placeholder="توکن اختصاصی کلودفلر" class="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 mb-2">Cloudflare Zone ID</label>
            <input id="wizardZoneId" type="text" placeholder="شناسه دامنه فعال (Zone ID)" class="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
          </div>
        </div>
        <button onclick="saveSetup()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-100">دخیره و اتصال نهایی</button>
      </div>
    </section>

    <!-- آمار و ارقام وضعیت پنل -->
    <section class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white border border-slate-100 p-6 rounded-3xl custom-shadow">
        <p class="text-xs text-slate-400 font-bold">کل اتصالات ساخته شده</p>
        <p id="statTotalConfigs" class="text-4xl font-black text-slate-900 mt-2">0</p>
      </div>
      <div class="bg-white border border-slate-100 p-6 rounded-3xl custom-shadow">
        <p class="text-xs text-slate-400 font-bold">درخواست‌های امروز کلودفلر</p>
        <p id="statTodayRequests" class="text-4xl font-black text-indigo-600 mt-2">--</p>
      </div>
      <div class="bg-white border border-slate-100 p-6 rounded-3xl custom-shadow">
        <p class="text-xs text-slate-400 font-bold">آی‌پی‌های تمیز شناسایی شده</p>
        <p id="statCleanIps" class="text-4xl font-black text-emerald-500 mt-2">۰</p>
      </div>
      <div class="bg-white border border-slate-100 p-6 rounded-3xl custom-shadow">
        <p class="text-xs text-slate-400 font-bold">سرعت لود پنل (پینگ)</p>
        <p id="statPing" class="text-4xl font-black text-sky-500 mt-2">-- ms</p>
      </div>
    </section>

    <!-- ساختار دو ستونه -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- ستون راست: ایجاد کاربر جدید و پینگ لایو -->
      <div class="lg:col-span-1 space-y-8">
        
        <!-- کارت ایجاد کاربر -->
        <section class="bg-white border border-slate-100 rounded-3xl p-6 custom-shadow">
          <h2 class="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <span class="w-3 h-3 rounded-lg bg-indigo-600"></span>
            ساخت اشتراک کاربری
          </h2>
          <form id="createForm" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2">نام کامل کاربر</label>
              <input id="userName" type="text" required placeholder="مثال: Pixonal Developer" class="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2">زمان انقضا (روز)</label>
              <input id="userDays" type="number" value="30" class="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2">آی‌پی تمیز کلودفلر</label>
              <input id="userCleanIp" type="text" value="engage.cloudflareclient.com" class="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50/50">
              <p class="text-[10px] text-slate-400 mt-1.5">می‌توانید آی‌پی‌های پرسرعت اسکن شده زیر را کپی کرده و اینجا قرار دهید.</p>
            </div>
            <button type="submit" class="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-2xl font-bold py-4 text-sm transition-all shadow-md">ایجاد و ثبت اشتراک</button>
          </form>
        </section>

        <!-- ابزار تست زنده پینگ آی‌پی‌های تمیز -->
        <section class="bg-white border border-slate-100 rounded-3xl p-6 custom-shadow">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-base font-black text-slate-950">تست لایو آی‌پی تمیز</h2>
            <button onclick="scanIps()" class="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-100 transition-all">اسکن زنده پینگ</button>
          </div>
          <p class="text-xs text-slate-400 mb-4 leading-relaxed">پینگ‌ها به طور کاملاً واقعی و لحظه‌ای از سمت اینترنت شما به رِنج آی‌پی‌های کلودفلر بررسی می‌شوند.</p>
          <div class="space-y-3" id="ipListContainer">
            <div class="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span class="text-xs font-mono font-bold text-slate-700">172.67.14.12</span>
              <span class="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-md font-bold">همراه اول</span>
              <span class="text-xs font-bold text-slate-400" id="ping-1">-- ms</span>
            </div>
            <div class="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span class="text-xs font-mono font-bold text-slate-700">104.18.2.2</span>
              <span class="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-md font-bold">ایرانسل</span>
              <span class="text-xs font-bold text-slate-400" id="ping-2">-- ms</span>
            </div>
            <div class="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span class="text-xs font-mono font-bold text-slate-700">104.21.90.1</span>
              <span class="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-md font-bold">مخابرات</span>
              <span class="text-xs font-bold text-slate-400" id="ping-3">-- ms</span>
            </div>
          </div>
        </section>

      </div>

      <!-- ستون چپ: جدول مدیریت کاربران -->
      <div class="lg:col-span-2">
        <section class="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 custom-shadow">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-black text-slate-900">لیست کاربران فعال و لینک‌ها</h2>
            <button onclick="loadUsers()" class="p-2.5 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100">
              <svg class="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H19" /></svg>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-right text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-slate-400 font-bold">
                  <th class="pb-4">نام کامل کاربر</th>
                  <th class="pb-4">آی‌پی تمیز فعال</th>
                  <th class="pb-4">مدت باقیمانده</th>
                  <th class="pb-4">لینک ساب‌اسکریپشن</th>
                  <th class="pb-4">عملیات</th>
                </tr>
              </thead>
              <tbody id="usersList" class="divide-y divide-slate-50">
                <!-- دیتای داینامیک کاربران در اینجا رندر می‌شود -->
              </tbody>
            </table>
          </div>
        </section>
      </div>

    </div>
  </main>

  <footer class="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-12">
    AX Panel • قدرت گرفته از سرویس‌های لبه شبکه کلودفلر
  </footer>

  <script>
    const dbUrl = window.location.origin;

    document.addEventListener('DOMContentLoaded', () => {
      checkSetupStatus();
      loadUsers();
      measureServerPing();
    });

    async function measureServerPing() {
      const start = Date.now();
      try {
        await fetch(`${dbUrl}/api/configs`);
        const duration = Date.now() - start;
        document.getElementById('statPing').innerText = `${duration} ms`;
      } catch {
        document.getElementById('statPing').innerText = 'خطا';
      }
    }

    async function checkSetupStatus() {
      try {
        const res = await fetch(`${dbUrl}/api/setup-status`);
        const data = await res.json();
        if (!data.hasConfig) {
          document.getElementById('setupWizard').classList.remove('hidden');
        } else {
          document.getElementById('setupWizard').classList.add('hidden');
          fetchCFStats();
        }
      } catch (e) {
        console.error("خطا در واکشی تنظیمات اولیه کلودفلر", e);
      }
    }

    async function saveSetup() {
      const token = document.getElementById('wizardToken').value;
      const zoneId = document.getElementById('wizardZoneId').value;

      if (!token || !zoneId) return alert('کامل کردن فیلدها الزامی است.');

      try {
        const res = await fetch(`${dbUrl}/api/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, zoneId })
        });
        const data = await res.json();
        if (data.success) {
          alert('اتصال هوشمند به کلودفلر با موفقیت انجام شد!');
          document.getElementById('setupWizard').classList.add('hidden');
          fetchCFStats();
        }
      } catch {
        alert('خطایی در هنگام فرستادن اطلاعات رخ داد.');
      }
    }

    async function fetchCFStats() {
      try {
        const res = await fetch(`${dbUrl}/api/stats`);
        const data = await res.json();
        if (data.todayRequests !== undefined) {
          document.getElementById('statTodayRequests').innerText = Number(data.todayRequests).toLocaleString('fa-IR');
        }
      } catch (e) {
        document.getElementById('statTodayRequests').innerText = 'خطای اتصال API';
      }
    }

    async function loadUsers() {
      try {
        const res = await fetch(`${dbUrl}/api/configs`);
        const users = await res.json();
        document.getElementById('statTotalConfigs').innerText = users.length.toLocaleString('fa-IR');

        const tbody = document.getElementById('usersList');
        tbody.innerHTML = '';

        if(users.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-slate-400 font-medium">هنوز هیچ اشتراکی ثبت نشده است. از ستون کنار اقدام کنید.</td></tr>`;
          return;
        }

        users.forEach(user => {
          const now = Date.now();
          const isExpired = user.expiry && now > user.expiry;
          const expiryText = user.expiry ? new Date(user.expiry).toLocaleDateString('fa-IR') : 'نامحدود';
          const subLink = `${dbUrl}/sub/${user.id}`;
          
          tbody.innerHTML += `
            <tr class="hover:bg-slate-50/50 transition-all">
              <td class="py-4.5 font-bold text-slate-900">${user.name}</td>
              <td class="py-4.5 text-slate-500 font-mono text-xs">${user.cleanIp}</td>
              <td class="py-4.5">
                ${isExpired ? 
                  `<span class="bg-rose-50 text-rose-600 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-rose-100">منقضی شده</span>` : 
                  `<span class="bg-emerald-50 text-emerald-600 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-emerald-100">${expiryText}</span>`
                }
              </td>
              <td class="py-4.5">
                <div class="flex items-center gap-2">
                  <input readonly value="${subLink}" class="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-indigo-600 font-mono w-48 focus:outline-none">
                  <button onclick="navigator.clipboard.writeText('${subLink}'); alert('ساب با موفقیت کپی شد!')" class="text-xs bg-indigo-50 text-indigo-600 px-3.5 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all">کپی</button>
                </div>
              </td>
              <td class="py-4.5">
                <button onclick="deleteUser('${user.id}')" class="text-rose-500 hover:text-rose-700 font-bold text-xs transition-all">حذف</button>
              </td>
            </tr>
          `;
        });
      } catch (e) {
        console.error("خطا در بارگذاری جدول کاربران", e);
      }
    }

    document.getElementById('createForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('userName').value;
      const days = parseInt(document.getElementById('userDays').value);
      const cleanIp = document.getElementById('userCleanIp').value;

      try {
        const res = await fetch(`${dbUrl}/api/config/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, days, cleanIp })
        });
        if(res.ok) {
          document.getElementById('userName').value = '';
          loadUsers();
          alert('اشتراک جدید با موفقیت صادر شد.');
        }
      } catch {
        alert('خطا در صدور اشتراک جدید.');
      }
    });

    async function deleteUser(id) {
      if(!confirm('آیا از حذف کامل دسترسی کاربر و مسدود کردن اشتراک اطمینان دارید؟')) return;
      try {
        await fetch(`${dbUrl}/api/config/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        loadUsers();
      } catch {
        alert('خطا در حذف کاربر.');
      }
    }

    async function scanIps() {
      const ips = [
        { id: "ping-1", ip: "172.67.14.12" },
        { id: "ping-2", ip: "104.18.2.2" },
        { id: "ping-3", ip: "104.21.90.1" }
      ];

      document.getElementById('statCleanIps').innerText = '...';

      let successCount = 0;
      for (const item of ips) {
        const el = document.getElementById(item.id);
        el.innerText = 'درحال تست...';
        el.className = 'text-xs font-bold text-indigo-500';

        const startTime = Date.now();
        try {
          await fetch(`https://${item.ip}/cdn-cgi/trace`, { mode: 'no-cors', cache: 'no-cache', signal: AbortSignal.timeout(1500) });
          const pingTime = Date.now() - startTime;
          el.innerText = `${pingTime} ms`;
          el.className = 'text-xs font-bold text-emerald-500';
          successCount++;
        } catch {
          el.innerText = 'قطع شد';
          el.className = 'text-xs font-bold text-rose-500';
        }
      }
      document.getElementById('statCleanIps').innerText = successCount.toLocaleString('fa-IR');
    }
  </script>
</body>
</html>
