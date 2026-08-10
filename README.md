# Lunar Calendar ICS Subscription Generator

> 把「庙会 / 节日」等阴历日期逐年换算成公历，一键生成可被日历 App 订阅的 `.ics` 文件。
> Turn your lunar (or solar) festivals and temple-fair dates into a subscribe-able `.ics` calendar, with every lunar date converted to its exact Gregorian date year by year.

A lunar date falls on a different Gregorian date each year, and leap months make manual calculation painful. This tool does the conversion for you and produces a standard RFC 5545 `.ics` file that you can subscribe to in Apple Calendar, Google Calendar, Outlook, and most mobile calendar apps.

---

## Features

- **Visual web editor** — no build step, no install. Just open `index.html` in a browser.
- **Two date types** — `lunar` (auto-converted to Gregorian every year) or `solar` (same month/day every year, e.g. New Year's Day).
- **Per-event options** — name, category, leap-month flag, reminder (1 / 2 / 3 days or 1 week before), color, and a note.
- **Safe delete** — two-step confirmation (click "Delete" then "Confirm?"), works even inside embedded/preview iframes where native `confirm()` dialogs are blocked.
- **Future-date preview** — see the next several Gregorian dates for each event at a glance, so you can verify before exporting.
- **Import / Export JSON** — back up or hand-edit the whole configuration as plain text; data is also auto-saved to `localStorage`.
- **Command-line generator** — edit `config.json` and run `node generate.js` for cron jobs / automation.
- **Accurate** — instead of approximating with a recurring `RRULE`, the tool expands a real `VEVENT` for **every single year** in the range, so leap months and short months are always correct.
- **Standards-compliant output** — emits `COLOR` / `X-APPLE-CALENDAR-COLOR`, `CATEGORIES`, and `VALARM` (reminders).

---

## Project structure

| File | Purpose |
|------|---------|
| `index.html` | Web editor (recommended). Must sit next to `lunar.js`. |
| `lunar.js` | Bundled `lunar-javascript` UMD build used by the web editor. |
| `generate.js` | Command-line generator (Node.js). Reads `config.json`. |
| `config.json` | Event configuration for the CLI generator. |
| `lunar_events.ics` | Sample output calendar (subscribe or import directly). |
| `WorkBuddy-使用说明.md` | Full Chinese usage guide. |
| `node_modules/`, `package.json`, `package-lock.json` | CLI dependency (`lunar-javascript`). Not needed by the web editor. |

> The web editor needs only `index.html` + `lunar.js`. The `node_modules/` folder is **only** required for the command-line `generate.js`.

---

## Quick start — Web (recommended)

1. Keep `index.html` and `lunar.js` in the **same folder**.
2. Double-click `index.html` to open it in a browser.
3. Set the calendar **name, description, and year range** (default 2024–2074, ~50 years).
4. Add / edit / delete events:
   - Pick a **date type** per event: `lunar` (converted every year) or `solar` (fixed each year).
   - Fill in name, category, month, day, leap-month flag (lunar only), reminder, color, and note.
   - Delete: click **Delete**, then click **Confirm?** a second time.
5. Preview the upcoming Gregorian dates, then click **Generate & Download .ics**.
6. Use **Export / Import JSON** to back up or move your configuration between devices.

Data is saved automatically in the browser's `localStorage`, so it persists across sessions on the same browser.

---

## Command line

```bash
# 1) Edit config.json (see schema below)
# 2) Generate
node generate.js                      # writes lunar_events.ics next to config.json
node generate.js config.json out.ics # custom input/output paths
```

`config.json` schema:

```json
{
  "calendar": {
    "name": "阴历庙会与节日",
    "description": "由 WorkBuddy 生成的阴历日期日历订阅",
    "startYear": 2024,
    "endYear": 2074
  },
  "events": [
    {
      "id": "miaohui-yuanxiao",
      "name": "元宵庙会",
      "type": "lunar",
      "month": 1, "day": 15, "leap": false,
      "description": "农历正月十五，元宵节庙会",
      "reminderDays": 1,
      "color": "#e74c3c",
      "category": "庙会"
    }
  ]
}
```

Field notes:

- `type` — `"lunar"` (default) or `"solar"`.
- `month` 1–12, `day` 1–30, `leap` `true` for a leap month (lunar only).
- `reminderDays` — `0` = no reminder; `1` / `2` / `3` / `7` = remind 1 / 2 / 3 days / 1 week before.
- `color` — hex color, shown by Apple Calendar and some Android calendars.

---

## Date types & edge cases

- **Lunar events** are converted year by year, because the Gregorian equivalent shifts every year.
- **Leap months** — if you mark an event as a leap month (e.g. "闰二月"), years that do **not** contain that leap month are skipped automatically. For example, 2024 has no leap second month, so no event is generated that year.
- **Short months** — some lunar months have only 29 days. If you enter day 30 but that year's month has 29 days, that year is skipped to avoid an impossible date.
- **Solar events** ignore the leap flag and repeat on the same `month`/`day` every year.

Conversion is powered by [`lunar-javascript`](https://github.com/6tail/lunar-javascript), which covers 1900–2100.

---

## Import / subscribe in calendar apps

A `.ics` file can be used two ways:

- **One-time import** — open/import the file into your calendar app. Updates require re-importing.
- **Subscription (recommended)** — host the `.ics` at a fixed public URL so the app refreshes it automatically.

### Add the subscription

- **iPhone / iPad** — open the `.ics` link in Safari → "Add Calendar Subscription", or in the Calendar app: *Calendars → Add Calendar Account → Other → Add Subscribed Calendar*, then paste the URL. Tip: subscribe into a dedicated calendar so you can toggle/delete it all at once.
- **Google Calendar (web)** — left panel *Other calendars ▾ → Add via URL*, paste the link.
- **Outlook / Huawei / Xiaomi** — usually under *Add account → Subscribe via link / Add by URL*.

### Self-hosting for a real subscription

The `.ics` must live at a stable, publicly reachable URL. Options:

1. **GitHub Pages** — push the folder to a repo, enable Pages, and use `https://<user>.github.io/<repo>/lunar_events.ics`. (GitHub serves `.ics` as `text/calendar`, the most compatible choice — recommended.)
2. **CloudStudio / any static host** — deploy the folder; subscribe at `https://<host>/lunar_events.ics`.
3. **Your own server / object storage** — upload `lunar_events.ics` and use its URL.

After editing events, regenerate and **overwrite** the file at the same URL; the app picks up changes on its next refresh.

---

## How it works

- The web editor loads `lunar.js` (a UMD build of `lunar-javascript`) directly in the browser — no network or server required.
- For each event and each year in the range, the tool computes the Gregorian date via `Lunar.fromYmd(year, month, day)` (negative month for leap months), then emits one `VEVENT` with `DTSTART;VALUE=DATE` and a `DTEND` on the following day.
- Year-by-year expansion (rather than a single `RRULE`) guarantees correctness across leap months and short months.

### Accuracy

The conversion was cross-validated against an independent library (`lunardate`): for the sample events across 2024–2074 (153 event-years plus leap-month cases) the two libraries agreed on **100%** of dates, and every `DTSTART` in the generated `.ics` round-trips back to the intended lunar date.

---

## Tech / dependencies

- `lunar-javascript` (^1.7.7) for lunar↔solar conversion.
- Web editor: plain HTML/CSS/JS, no framework, no build step.
- CLI: Node.js (tested on 14+).

---

## License

Released under the ISC License (see `package.json`).

---

## 中文说明

把「庙会 / 节日」等**阴历日期**逐年换算成公历，生成可被日历 App 订阅的 `.ics` 文件。每年对应的公历都不同，闰月也会自动处理，无需手动计算。

**特性**
- 网页版编辑器（双击 `index.html` 即可用，无需安装），数据自动存浏览器 `localStorage`。
- 每条事件可选「阴历」（每年单独换算公历）或「公历」（每年同月同日）。
- 支持名称、分类、闰月、提前提醒（1/2/3 天/1 周）、颜色、备注。
- 删除采用两步确认，在内嵌/预览环境也能正常工作。
- 未来日期预览、导入/导出 JSON 备份。
- 命令行 `generate.js`（读取 `config.json`）便于定时自动生成。
- 对起止年份内**每一年**单独生成 `VEVENT`（而非用 `RRULE` 近似），闰月、小月都准确。

**快速开始**
1. 保持 `index.html` 与 `lunar.js` 同目录，双击打开。
2. 设置日历名称、描述、起止年份。
3. 新增/编辑/删除事件（删除需点两次确认）。
4. 预览公历日期后，点击「生成并下载 .ics」。

**命令行**
```bash
node generate.js                 # 输出 lunar_events.ics
node generate.js config.json out.ics
```

**边缘情况**
- 闰月事件：该年若无此闰月则自动跳过（如 2024 年无闰二月）。
- 小月：阴历某月仅 29 天时，填了 30 日则该年跳过。
- 换算基于 `lunar-javascript`（1900–2100）。

**导入日历**
iPhone：Safari 打开 `.ics` 链接 → 添加订阅；或日历 App 内「添加日历账户 → 其他 → 添加订阅日历」填 URL。Google / Outlook / 华为 / 小米同理通过链接添加。真正「订阅」需把 `.ics` 放到固定公网地址（推荐 GitHub Pages，兼容性最好），日历 App 会自动刷新。
