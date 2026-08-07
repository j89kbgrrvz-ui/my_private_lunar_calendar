#!/usr/bin/env node
/**
 * 阴历日历 ICS 生成器（命令行 / 自动化用）
 *
 * 读取 config.json，把其中的阴历事件转换到公历，逐年展开为 VEVENT，
 * 输出一个可被日历应用订阅的 .ics 文件。
 *
 * 用法：
 *   node generate.js                 # 使用同目录 config.json，输出 lunar_events.ics
 *   node generate.js config.json out.ics
 */
const fs = require('fs');
const path = require('path');
const { Lunar, LunarYear, LunarMonth } = require('lunar-javascript');

const DEFAULT_CONFIG = path.join(__dirname, 'config.json');
const DEFAULT_OUT = path.join(__dirname, 'lunar_events.ics');

function loadConfig(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

// 阴历(月,日,是否闰月) -> 公历日期；该年不存在则返回 null
function lunarToSolar(year, month, day, leap) {
  const m = leap ? -month : month;
  const lm = LunarMonth.fromYm(year, m);
  if (!lm) return null;                 // 该年没有这个闰月
  if (day > lm.getDayCount()) return null; // 小月(29天)没有第30天
  const l = Lunar.fromYmd(year, m, day);
  const s = l.getSolar();
  return { y: s.getYear(), m: s.getMonth(), d: s.getDay() };
}
function solarToDate(year, month, day) { return { y: year, m: month, d: day }; }

function pad(n, w = 2) { return String(n).padStart(w, '0'); }
function dateStamp(d) {
  return pad(d.getUTCFullYear(), 4) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
    'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}
function dateValue(dt) { return pad(dt.y, 4) + pad(dt.m) + pad(dt.d); }

// 转义文本值中的特殊字符
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// 按 UTF-8 字节折行（每行 <=75 字节，续行以空格开头）
function fold(line) {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line;
  const out = [];
  let first = true;
  let remaining = line;
  while (remaining.length > 0) {
    const limit = first ? 75 : 74;
    let i = 0, len = 0;
    while (i < remaining.length) {
      const cb = Buffer.byteLength(remaining[i], 'utf8');
      if (len + cb > limit) break;
      len += cb; i++;
    }
    out.push((first ? '' : ' ') + remaining.slice(0, i));
    remaining = remaining.slice(i);
    first = false;
  }
  return out.join('\r\n');
}

function buildICS(config) {
  const cal = config.calendar || {};
  const name = cal.name || '阴历节日与庙会';
  const desc = cal.description || '';
  const startYear = cal.startYear || new Date().getFullYear();
  const endYear = cal.endYear || (startYear + 50);
  const now = new Date();
  const stamp = dateStamp(now);

  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//WorkBuddy//Lunar Calendar Generator//CN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push(fold('X-WR-CALNAME:' + name));
  if (desc) lines.push(fold('X-WR-CALDESC:' + desc));
  lines.push('X-WR-TIMEZONE:Asia/Shanghai');

  let count = 0;
  for (const ev of (config.events || [])) {
    const isLunar = (ev.type || 'lunar') === 'lunar';
    const leap = !!ev.leap;
    for (let y = startYear; y <= endYear; y++) {
      const sd = isLunar ? lunarToSolar(y, ev.month, ev.day, leap) : solarToDate(y, ev.month, ev.day);
      if (!sd) continue; // 该年无此闰月或日期不存在
      const lunarLabel = isLunar
        ? '农历' + (leap ? '闰' : '') + cnMonth(ev.month) + cnDay(ev.day)
        : '公历' + ev.month + '月' + ev.day + '日';
      const uid = (ev.id || ('evt-' + ev.name)) + '-' + y + '@workbuddy-lunar';
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + uid);
      lines.push('DTSTAMP:' + stamp);
      lines.push('DTSTART;VALUE=DATE:' + dateValue(sd));
      lines.push('DTEND;VALUE=DATE:' + dateValue(addDays(sd, 1))); // 含当天
      lines.push(fold('SUMMARY:' + esc(ev.name)));
      const fullDesc = [esc(ev.description || ''), esc(lunarLabel)].filter(Boolean).join('\\n');
      lines.push(fold('DESCRIPTION:' + fullDesc));
      if (ev.color) {
        lines.push('COLOR:' + ev.color);
        lines.push('X-APPLE-CALENDAR-COLOR:' + ev.color);
      }
      if (ev.category) lines.push(fold('CATEGORIES:' + esc(ev.category)));
      if (ev.reminderDays && ev.reminderDays > 0) {
        lines.push('BEGIN:VALARM');
        lines.push('ACTION:DISPLAY');
        lines.push(fold('DESCRIPTION:' + esc(ev.name)));
        lines.push('TRIGGER:-P' + ev.reminderDays + 'D');
        lines.push('END:VALARM');
      }
      lines.push('END:VEVENT');
      count++;
    }
  }
  lines.push('END:VCALENDAR');
  return { ics: lines.join('\r\n') + '\r\n', count };
}

function addDays(dt, n) {
  const d = new Date(dt.y, dt.m - 1, dt.d);
  d.setDate(d.getDate() + n);
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}
function cnMonth(m) {
  const map = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  return map[(m - 1) % 12] + '月';
}
function cnDay(n) {
  const d = ['日', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (n <= 10) return '初' + d[n];
  if (n < 20) return '十' + d[n - 10];
  if (n === 20) return '二十';
  if (n < 30) return '廿' + d[n - 20];
  return '三十';
}

function main() {
  const configPath = process.argv[2] || DEFAULT_CONFIG;
  const outPath = process.argv[3] || DEFAULT_OUT;
  const config = loadConfig(configPath);
  const { ics, count } = buildICS(config);
  fs.writeFileSync(outPath, ics, 'utf8');
  console.log('已生成 ' + outPath + '，共 ' + count + ' 个日程（年份范围 ' +
    (config.calendar && config.calendar.startYear) + '-' + (config.calendar && config.calendar.endYear) + '）');
}

if (require.main === module) main();

module.exports = { buildICS, lunarToSolar, cnMonth };
