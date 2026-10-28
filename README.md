# Marco familiar

A family dashboard for an iPad hung on the wall or sitting on the kitchen counter: clock and weather, everyone's Google Calendar, a countdown, your football team, the cheapest hours for electricity, petrol prices and, optionally, the kids' points in [Talentos](https://lostalentos.vercel.app).

It needs no server at home or Home Assistant: it runs on a free Vercel account, and the first time you open it a setup wizard asks for everything it needs.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmanueldiezb%2Fmarco-familiar-web&env=MARCO_CLAVE&envDescription=Una%20clave%20que%20te%20inventes%3A%20la%20pedir%C3%A1%20el%20asistente%20del%20iPad&project-name=marco-familiar&repository-name=marco-familiar)

## Setting it up

1. **Click "Deploy with Vercel"** (above). Vercel makes a copy of the repo in your GitHub and asks for a single setting:
   - `MARCO_CLAVE`: a key you make up (for example, three words). It stops anyone else from using your copy.
2. When it's done, Vercel gives you an address like `https://marco-familiar-xxxx.vercel.app`. **Open it in Safari on the iPad.**
3. **Add it to the Home Screen** (Share → "Add to Home Screen") and open it from there. It then runs full screen, with no Safari bars.
   > Do it in this order: on iPad, the Home Screen app doesn't share data with Safari, so the wizard has to be filled in from the app.
4. **Follow the wizard.** It takes a few minutes:
   - The key from step 1.
   - Location: for the weather and the nearby petrol stations.
   - Google calendars (see below).
   - Optional cards: countdown, football, petrol, electricity and Talentos.
5. On the iPad: **Settings → Display & Brightness → Auto-Lock → Never**, and leave it on charge.

To change something later, tap **⚙︎** in the bottom-right corner.
To set up a second iPad the same way, the wizard's last step gives you a code to paste into the other one.

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

- **Settings live only on the iPad** (in the browser's local storage): calendar addresses, location (rounded to ~1 km) and the key. They are never written to the repo or to Vercel.
- The only server-side function, `api/proxy.js`, reads the calendars and the Talentos board on the iPad's behalf, because browsers don't allow reading them directly. It requires your key, only talks to Google Calendar, Talentos and ESPN, and stores nothing.

## Development

```sh
npm install
npm test          # calendar (repeats, exceptions, clock change) and electricity logic
vercel dev        # with MARCO_CLAVE in .env.local
```

There is no build step: `index.html` is the whole page, `logica.js` holds the calculations that have tests, and `api/` holds the function.

## Credits

The design comes from the Android app [marco-familiar-dashboard](https://github.com/leontdi/marco-familiar-dashboard) by leontdi (based on eusonlito's work), under the MIT licence. Weather icons are [Meteocons](https://github.com/basmilius/weather-icons) by Bas Milius.
