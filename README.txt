CRYPTO WALLET UI
================

Files
-----
index.html    Page structure
style.css     All styling (no Tailwind or other dependencies)
script.js     Assets/Accounts toggle and bottom nav active state
README.txt    This file

How to run
----------
Keep all files in the same folder and open index.html in a browser.
For best results on a phone, serve the folder (e.g. "npx serve") and use
"Add to Home Screen" to install it as an app.

What changed
------------
- Pure black (#000000) background; purple fade and dot pattern removed.
- All top header buttons removed.
- Layout rebuilt on a consistent spacing scale; every element resized
  to be smaller and evenly spaced.
- Balance uses DM Sans (a soft, PayPal-style typeface) with lighter weight.
- Bottom nav is now a compact, centered liquid-glass pill (blur, saturation,
  inner highlights) instead of a full-width bar.

Notes
-----
The DM Sans font loads from Google Fonts; offline it falls back to the
system font. The manifest uses an inline SVG icon; swap in your own PNG
icons (192x192 and 512x512) for production.

Update 2
--------
- Bottom nav rebuilt as a full-width dark glass bar (Home / Crypto / Pay Bill / Cards).
- All money amounts use the --font-money font (Instrument Sans) via the .money class.
  To change the font, edit --font-money in style.css and the Google Fonts link in index.html.
- Added in-app promotion card with a 2D cartoon illustration (inline SVG).

Update 3
--------
- Added a Vero splash screen shown for 10 seconds on every launch, then fading into the app.
  Animation: two capsule outlines draw themselves, slide together and lock into the mark,
  the wordmark letters fade in one by one, and a thin progress line runs underneath.
- To change the duration, edit 10000 in script.js and the 9s in ".load i" (style.css).

Update 4 - Telegram Mini App
----------------------------
- Loads telegram-web-app.js, calls ready()/expand(), sets header/background/bottom bar to black.
- manifest.json and the iOS "add to home screen" tags were removed (Telegram handles that).
- Inside Telegram the desktop phone frame is dropped and the app fills the webview;
  safe-area insets from Telegram are applied to the top padding and the glass nav.
- Vertical swipe-to-close is disabled so scrolling the screen doesn't close the app.
- Haptic feedback on tabs, nav, quick actions. Tap the splash to skip it. Splash now lasts 3.5s (edit 3500 in script.js). The progress line under the logo was removed.
- Outside Telegram everything still works as a normal web page.

Update 5
--------
- The "+7.87% Today" pill under the balance now reads "Accounts".
- Dashboard balance uses a thick, rounded font (Nunito 900, --font-balance in style.css).
  Other money amounts still use Instrument Sans.
- Bottom nav is shorter (smaller padding, icons and gaps); width unchanged.
- Bitcoin and Ethereum icons replaced with the real logos (inline SVG).

Update 6 - Markets
------------------
- "Accounts" tab renamed "Watchlist". Assets = coins you own (live value and 24h change);
  Watchlist = coins you star in All crypto (saved on the device).
- New "Crypto" box under the list: Bitcoin, Ethereum, Litecoin, TRON with live price + 24h change
  and an "All crypto" button that opens a full-screen list of 3,250 coins with search.
- Names, logos and prices come live from the CoinGecko API (market-wide averages, the same
  source most exchanges/trackers compare against). Prices refresh every 30s; list is cached
  on the device. Tapping a coin row does nothing yet (only the star works).
- Free CoinGecko limits are strict, so the full list loads in the background over ~40 seconds.

Deploy
------
1. Host these files over HTTPS (GitHub Pages, Netlify, Vercel, Cloudflare Pages).
2. In @BotFather: /newbot (if needed), then /newapp (or /mybots > Bot Settings >
   Menu Button) and paste your HTTPS URL.
3. Open the bot in Telegram and launch the app.
