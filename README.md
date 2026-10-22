# mohammed-hadi.vercel.app

My portfolio: a pixel-art night over Manipal, a Ferrari-red #44 on the grid, and a working terminal.

**Live:** https://mohammed-hadi.vercel.app

## What's in it

- **Interactive terminal** in the hero, running entirely in the browser:
  - a mini Redis with the same command set as my [redis-java](https://github.com/mhdhadi2005/redis-java), showing the raw RESP bytes on the wire (`SET`, `GET`, `INCR`, `EXPIRE`, `KEYS`…)
  - `backtest [fast] [slow]`: an SMA-crossover backtest on real BTC 4h candles from CoinGecko, signal on close *t*, fills on *t+1*, fees included
  - `price`, `git log` (my real latest commits), `lights`, `neofetch`, `help`
- **F1 layer:** a vector #44 that launches as you scroll, with its engineering lit (rain light, ERS deployment, brake heat, DRS), a start-lights reaction test, real lap timing per section, and an x-ray blueprint mapping car systems to my stack.
- **Projects** with real code excerpts and images pulled from the repos themselves.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Canvas 2D for the pixel scene · SVG for the car. No UI kit, no animation library.

## Run it

```bash
npm install
npm run dev
```

Pushes to `main` deploy automatically on Vercel.
