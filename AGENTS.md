# راهنمای Agent پروژه — Image Format Converter Pro

> این فایل قرارداد کاری agentهای هوش مصنوعی و توسعه‌دهندگان این مخزن است.
> هدف: تغییرات کوچک، قابل‌بررسی، امن و هماهنگ با رفتار واقعی افزونه.

## ۱. هویت و هدف پروژه

**Image Format Converter Pro** یک افزونه‌ی Chrome با Manifest V3 است که توسط **MrAOTP** ساخته شده است.

افزونه برای تبدیل تصاویر قابل‌دسترسی در صفحات وب طراحی شده و رابط آن فارسی و راست‌به‌چپ است. پردازش تصویر باید تا حد ممکن local انجام شود و تصویر نباید به سرویس شخص ثالث ارسال شود.

## ۲. قوانین غیرقابل‌مذاکره

- قبل از تغییر، فایل‌های مرتبط و مسیر واقعی اجرای کد را بخوان.
- ادعای قابلیت را بدون بررسی کد و تست، قطعی اعلام نکن.
- کمترین تغییر لازم را انجام بده؛ refactor گسترده بدون نیاز ممنوع.
- هیچ فایل یا تغییری را که متعلق به کاربر یا agent دیگری است حذف، overwrite یا stash نکن.
- بدون درخواست صریح کاربر commit، push، reset، rebase یا تغییر branch انجام نده.
- هرگز secret، token، cookie، داده‌ی خصوصی یا URL حساس را در کد، README یا log ذخیره نکن.
- از `sudo`، `doas`، `pkexec` و اجرای administrator command استفاده نکن.
- از خاموش‌کردن امنیت Chrome یا proxy عمومی برای دور زدن CORS استفاده نکن.
- قبل از پایان، validation متناسب با تغییر را اجرا کن.

## ۳. شناخت معماری

### `manifest.json`

مرجع اصلی پیکربندی افزونه است:

- Manifest V3
- service worker: `background.js`
- content script: `content.js`
- popup: `popup.html`
- options: `options.html`
- مجوزهای context menu، downloads، storage و notifications
- host permissions برای دسترسی به منابع مجاز وب

هر تغییر در permission باید ضرورت مشخص، اثر امنیتی و اثر روی نصب افزونه را بررسی کند.

### `background.js`

مسئولیت‌ها:

- ساخت منوی راست‌کلیک
- دریافت پیام از content script
- دریافت منابع تصویر از context مناسب extension
- شروع دانلود فایل‌های تکی
- ساخت ZIP خروجی گروهی
- ذخیره و خواندن history
- اعلان خطاها

Service worker نباید به DOM، `window` یا APIهای مخصوص صفحه وابسته باشد.

### `content.js`

مسئولیت‌ها:

- دریافت پیام‌های صفحه
- کشف تصاویر `<img>`، lazy source، `<picture>/<source>` و برخی `background-image`ها
- ساخت داشبورد داخل صفحه
- ساخت editor و preview
- تبدیل تصویر با Canvas و encoderهای داخلی
- اعمال rotate، flip و crop
- گزارش وضعیت و حجم خروجی

کد injected است؛ بنابراین باید از تداخل با CSS و JavaScript سایت میزبان جلوگیری کند:

- همه‌ی selectorها باید namespace پروژه داشته باشند.
- از نام‌های عمومی مانند `.button`، `header` یا `footer` بدون scope استفاده نکن.
- CSS داشبورد باید زیر `#image-converter-pro-dashboard` محدود شود.
- از نمایش متن‌های طولانی مثل `data:image/...;base64,...` در UI خودداری کن.

### `popup.*`

Popup باید سبک و سریع بماند:

- باز کردن داشبورد تب فعال
- باز کردن options
- نمایش وضعیت local processing
- مدیریت خطای صفحه‌های غیرقابل‌دسترسی

### `options.*`

صفحه‌ی تنظیمات مسئول خواندن و ذخیره‌ی تنظیمات زیر است:

- کیفیت WebP، JPG و AVIF
- حداکثر عرض و ارتفاع
- حجم هدف
- رنگ پس‌زمینه‌ی JPG
- روش نام‌گذاری فایل

مقادیر storage باید با مقدار پیش‌فرض، وجود عنصر DOM و مقدار نامعتبر مقاوم باشند.

### `fonts/` و `icons/`

- فونت Vazirmatn به‌صورت local استفاده می‌شود.
- از Google Fonts یا CDN برای فونت استفاده نکن.
- مجوز `fonts/OFL.txt` باید حفظ شود.
- مسیرهای آیکن در manifest باید به فایل واقعی اشاره کنند.

## ۴. قرارداد داده و storage

کلیدهای فعلی تنظیمات:

```js
{
  webpQuality: 0.92,
  jpgQuality: 0.90,
  avifQuality: 0.80,
  filenameMode: 'original',
  maxWidth: 0,
  maxHeight: 0,
  jpegBackground: '#ffffff',
  targetKB: 0
}
```

کلید history:

```text
conversionHistory
```

در history فقط داده‌ی خلاصه ذخیره کن:

- format
- filename
- bytes
- width
- height
- timestamp
- settings لازم برای تکرار

هرگز `dataUrl` کامل یا تصویر Base64 را در storage ذخیره نکن.

## ۵. رفتار تبدیل تصویر

### فرمت‌ها

- PNG: از Canvas native استفاده می‌شود.
- JPG: شفافیت باید با رنگ پس‌زمینه جایگزین شود.
- WebP: quality قابل تنظیم است.
- AVIF: فقط در صورت پشتیبانی encoder مرورگر مجاز است.
- BMP و TIFF: encoder داخلی ساده دارند و نباید به‌صورت بی‌صدا PNG تولید کنند.

اگر browser فرمت requested را پشتیبانی نمی‌کند:

- fallback خاموش به PNG ممنوع
- خطای واضح و قابل‌فهم نمایش بده
- وضعیت دکمه و progress را به حالت سالم برگردان

### حجم هدف

برای فرمت‌های lossy تلاش برای رسیدن به حجم هدف مجاز است، اما نباید ادعا شود که همیشه دقیقاً زیر هدف قرار می‌گیرد. اگر با پایین‌ترین کیفیت هم به هدف نرسید، نتیجه باید شفاف گزارش شود.

### اندازه و transform

- نسبت تصویر حفظ شود.
- rotateهای ۹۰ درجه باید width و height را جابه‌جا کنند.
- flip نباید باعث تغییر ابعاد شود.
- preview باید با `object-fit: contain` کل تصویر را نشان دهد.
- transform نمایشی و transform واقعی خروجی باید همسان باشند.
- منابع تصویر پس از استفاده، در صورت امکان release شوند.

## ۶. دریافت تصویر و CORS

CORS یک محدودیت امنیتی مرورگر/سرور است، نه چیزی که باید با روش ناامن دور زده شود.

ترتیب ترجیحی:

1. `data:` و `blob:` محلی در context صفحه
2. دریافت از service worker با مجوز host مناسب
3. نمایش خطای دقیق برای منابع غیرقابل‌دسترسی
4. پیشنهاد ذخیره‌ی دستی تصویر به‌عنوان fallback کاربر

نباید:

- Chrome security را خاموش کرد.
- از CORS proxy عمومی استفاده کرد.
- token یا cookie را log کرد.
- خطای CORS را به موفقیت یا PNG جعلی تبدیل کرد.

## ۷. قرارداد UI/UX

زبان اصلی UI فارسی است:

- `lang="fa"`
- `dir="rtl"`
- فونت Vazirmatn local
- متن‌ها کوتاه، روشن و بدون URL طولانی
- دکمه‌ها دارای حالت hover و disabled باشند.
- عملیات طولانی status یا progress قابل‌مشاهده داشته باشد.
- پنل اصلی ارتفاع محدود داشته باشد.
- شبکه‌ی تصاویر باید داخل خودش `overflow-y: auto` داشته باشد.
- هدر، toolbar و footer نباید با افزایش تعداد تصاویر از پنل خارج شوند.
- تصاویر کارت با نسبت واقعی و `contain` نمایش داده شوند.
- modal فقط یک دکمه‌ی بستن داشته باشد.
- Escape و کلیک روی backdrop برای بستن modal پشتیبانی شود.
- focus و `aria-label` برای کنترل‌های مهم حفظ شود.

## ۸. کشف تصاویر

منابع زیر باید با احتیاط بررسی شوند:

- `img.currentSrc`
- `img.src`
- `data-src`
- `data-lazy-src`
- `data-original`
- `picture source srcset`
- computed `background-image`

قواعد:

- از duplicate با Set جلوگیری کن.
- URLهای `data:` را در UI کامل نشان نده.
- gradientهای CSS را به‌عنوان تصویر ثبت نکن.
- URLهای نسبی باید با `new URL(value, document.baseURI)` resolve شوند، اگر این تغییر در scope کار است.
- منابع `blob:` ممکن است خارج از context صفحه معتبر نباشند؛ این محدودیت را گزارش کن.

## ۹. Async و خطا

برای هر مسیر async:

- rejection را catch کن.
- دکمه‌ی disabled را در `finally` به حالت درست برگردان.
- پیام خطا را به کاربر قابل‌فهم کن.
- در batch، شکست یک فایل نباید باعث گیرکردن کل صف شود.
- تعداد موفق، ناموفق و کل را گزارش کن.
- برای صفر فایل ZIP نساز.
- پاسخ‌های message را قبل از استفاده بررسی کن.
- روی پاسخ `undefined` از `tabs.sendMessage` حساب نکن.

## ۱۰. تست و Validation

پس از تغییر JavaScript:

```bash
node --check background.js
node --check content.js
node --check popup.js
node --check options.js
```

پس از تغییر manifest:

```bash
python - <<'PY'
import json
with open('manifest.json', encoding='utf-8') as f:
    json.load(f)
print('manifest.json: valid JSON')
PY
```

برای تغییرات مستندات یا whitespace:

```bash
git diff --check
```

تست دستی Chrome:

1. `chrome://extensions`
2. فعال‌کردن Developer mode
3. Reload افزونه
4. Refresh صفحه‌ی هدف
5. آزمایش منوی راست‌کلیک
6. آزمایش داشبورد با ۰، ۱ و تعداد زیاد تصویر
7. آزمایش تصویر عریض، عمودی، شفاف و broken
8. آزمایش JPG، PNG، WebP، AVIF، BMP و TIFF
9. آزمایش خطای CORS و صفحه‌ی غیرقابل‌دسترسی
10. بررسی Console و Service Worker errors

در پروژه‌ی بدون dev server، `register_preview` کاربرد ندارد؛ رابط افزونه باید داخل Chrome واقعی بررسی شود.

## ۱۱. چک‌لیست بازبینی adversarial

قبل از اعلام پایان، این موارد را بپرس:

- آیا مقدار null یا undefined باعث crash می‌شود؟
- آیا آرایه‌ی خالی، انتخاب صفر یا فایل خراب مدیریت شده؟
- آیا progress در خطا یا cancel گیر می‌کند؟
- آیا خروجی format واقعاً همان فرمت requested است؟
- آیا پسوند فایل با MIME هماهنگ است؟
- آیا history حاوی داده‌ی حجیم یا حساس است؟
- آیا cardها با تعداد زیاد تصویر layout را خراب می‌کنند؟
- آیا modal دو close button دارد؟
- آیا preview تصویر را می‌کشد یا می‌بُرد؟
- آیا تغییرات UI در سایت میزبان تداخل ایجاد می‌کند؟
- آیا مسیر local font در popup، options و injected dashboard درست است؟
- آیا مجوز جدید واقعاً لازم است؟

## ۱۲. Git و همکاری

قبل از عملیات Git مهم:

```bash
git status --short --branch
git diff
```

- فقط فایل‌های متعلق به همین task را stage کن.
- `.freebuff/` هرگز نباید commit شود.
- commit و push فقط با درخواست صریح کاربر انجام شود.
- پیام commit کوتاه و توصیفی باشد.
- قبل از push، validation و diff نهایی را بررسی کن.
- تغییرات agentهای دیگر را دست‌کاری نکن.
- مستندات `README.md` باید با قابلیت‌های واقعی پروژه هماهنگ بماند.

## ۱۳. استاندارد گزارش پایان کار

گزارش نهایی باید کوتاه و دقیق باشد و شامل این موارد شود:

1. چه چیزی تغییر کرد؟
2. کدام فایل‌ها تغییر کردند؟
3. چه validationهایی اجرا شد؟
4. چه محدودیت‌هایی باقی مانده؟
5. آیا commit یا push انجام شده یا نه؟

هرگز بنویس «کامل و بدون محدودیت» مگر اینکه واقعاً با تست قابل‌اثبات باشد.

## ۱۴. اولویت تصمیم‌گیری

هنگام تعارض بین گزینه‌ها، این ترتیب را رعایت کن:

1. امنیت و حریم خصوصی
2. صحت خروجی و جلوگیری از data loss
3. حفظ رفتار فعلی
4. تجربه‌ی کاربری فارسی و RTL
5. سادگی و کمترین پیچیدگی
6. زیبایی و polish

</div>
