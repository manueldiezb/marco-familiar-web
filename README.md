# Marco familiar

A family dashboard for an iPad hung on the wall or sitting on the kitchen counter: clock and weather, everyone's Google Calendar, a countdown, your football team, the cheapest hours for electricity, petrol prices and, optionally, the kids' points in [Talentos](https://lostalentos.vercel.app).

It needs no server at home or Home Assistant: it runs on a free Vercel account, and the first time you open it a setup wizard asks for everything it needs.

## Setting it up

1. **Fork this repo**: [github.com/manueldiezb/marco-familiar-web/fork](https://github.com/manueldiezb/marco-familiar-web/fork) → "Create fork". A fork (not a copy) is what lets you get updates later.
2. **Publish it on Vercel**: [vercel.com/new](https://vercel.com/new) → import your fork → "Deploy". There's nothing to fill in.
3. When it's done, Vercel gives you an address like `https://marco-familiar-xxxx.vercel.app`. **Open it on your computer** and follow the wizard. It takes a few minutes:
   - Location: for the weather and the nearby petrol stations.
   - Google calendars (see below).
   - Optional cards: countdown, football, petrol, electricity and Talentos.
4. The last step shows a **QR code**. Scan it with the iPad's camera (or send yourself the link) and open it in Safari.
5. On the iPad: Share → **"Add to Home Screen"**, and open it from there. It runs full screen, with no Safari bars.
6. On the iPad: **Settings → Display & Brightness → Auto-Lock → Never**, and leave it on charge.

To change something later, tap **⚙︎** in the bottom-right corner: each card has its own section.
To set up a second iPad, open the same link (⚙︎ → "Abrir en otro iPad" shows the QR again).

### Updates

⚙︎ → **Actualizaciones** compares your fork with this repo and lists what's new. To install it, open your fork on GitHub and click **"Sync fork" → "Update branch"**; Vercel republishes it and the iPad reloads by itself within a few minutes.

To do it from the frame with one tap instead, give it a GitHub token:
1. GitHub → Settings → Developer settings → Fine-grained tokens → **Generate new token**, with access only to your fork and **Contents: Read and write**.
2. Vercel → your project → Settings → Environment Variables → add **`GITHUB_TOKEN`** with that token, and redeploy.

### Google Calendar's secret address

Each calendar is read through its **secret address in iCal format**, so you don't have to give anyone permissions:

1. Open [calendar.google.com](https://calendar.google.com) **on a computer** (it doesn't appear in the iPad app).
2. In the list on the left, hover over the calendar → **⋮** → **Settings and sharing**.
3. Scroll down to **Integrate calendar** → copy the **Secret address in iCal format** (it ends in `basic.ics`).

Treat it like a password: anyone who has it can see the calendar. If it leaks, Google lets you reset it from the same page.
New events can take a few minutes to show up, because Google takes a while to update that address.

## What each card shows

| Card | Data source |
|---|---|
| Clock and weather (tap for the hour-by-hour detail) | [Open-Meteo](https://open-meteo.com) |
| Today, the next 10 days and "Up next" | Your Google calendars |
| Countdown | Whatever you set in the wizard |
| Football: last result and next 3 matches (tap the result for goals and stats) | ESPN |
| Electricity: hourly price, and when to run each appliance | [Red Eléctrica](https://www.ree.es/es/apidatos) (PVPC) or the fixed time bands of the 2.0TD tariff |
| Petrol | [Ministerio para la Transición Ecológica](https://geoportalgasolineras.es) (Spain only) |
| Talentos: the kids' points (tap to open the board) | Your family's public board in Talentos |

## Privacy

- **Settings travel inside the link** (after `#`, a part browsers never send to the server) and are kept in the browser's local storage: calendar addresses and location (rounded to ~1 km). They are never written to the repo or to Vercel. The link contains your calendar addresses, so share it only with your family.
- The only server-side function, `api/proxy.js`, reads the calendars and the Talentos board on the iPad's behalf, because browsers don't allow reading them directly. It only talks to Google Calendar, Talentos, ESPN and (to update) GitHub, and stores nothing, so it doesn't need a password: anyone using it can only read what they already have the address or code for.

## Development

```sh
npm install
npm test          # calendar (repeats, exceptions, clock change) and electricity logic
vercel dev
```

There is no build step: `index.html` is the whole page, `logica.js` holds the calculations that have tests, and `api/` holds the function.

## Credits

The design comes from the Android app [marco-familiar-dashboard](https://github.com/leontdi/marco-familiar-dashboard) by leontdi (based on eusonlito's work), under the MIT licence. Weather icons are [Meteocons](https://github.com/basmilius/weather-icons) by Bas Milius.
