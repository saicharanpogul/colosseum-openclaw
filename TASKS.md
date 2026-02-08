# Vapor - Production Tasks Tracker

## ✅ COMPLETED

### Today (Feb 8, 2026)
- [x] Toast notification system (production-ready)
- [x] MoltBook agent presence (posting every 3h, engaging hourly)
- [x] Agent-friendly API (GET /api/positions + SKILL.md)
- [x] Market detail pages (/market/[id])
- [x] Market count corrected (155 markets)
- [x] Success modals after trades
- [x] Social sharing buttons

### Earlier
- [x] Real SOL transfers on devnet
- [x] Oracle resolution system
- [x] Portfolio page
- [x] Build fix (moved imports)
- [x] Web Analytics (Vercel)

---

## 🔄 IN PROGRESS - PENDING TASKS

### 1. Error Handling Integration (HIGH PRIORITY - 1-2 hours)
**Status:** Toast system ready, needs integration

**Todo:**
- [ ] Add toasts to wallet connection errors
- [ ] Add toasts to transaction failures with retry button
- [ ] Add toasts to insufficient balance warnings
- [ ] Add toasts to network errors
- [ ] Better loading states everywhere
- [ ] Add "Copying..." feedback for copy buttons

**Files to update:**
- `components/MarketCard.tsx` - trade error handling
- `hooks/useVapor.ts` - error propagation
- `components/ShareButton.tsx` - copy feedback

---

### 2. Market Detail Pages - Phase 2 (MEDIUM - 3-4 hours)
**Status:** Basic structure done, needs data features

**Completed:**
- [x] Basic page layout
- [x] Market stats display
- [x] Trading integration
- [x] Market info section
- [x] Share functionality

**Todo:**
- [ ] Price history charts (Recharts)
- [ ] Create Supabase `price_history` table
- [ ] Add cron job to capture prices every 15min
- [ ] Top traders leaderboard for each market
- [ ] Related markets suggestions
- [ ] Trade history table

**New files needed:**
- `lib/price-history.ts` - price capture logic
- `components/PriceHistoryChart.tsx` - chart component

---

### 3. UI Polish (MEDIUM - 2-3 hours)
**Todo:**
- [ ] Review homepage spacing/alignment
- [ ] Check mobile responsiveness on all pages
- [ ] Fix any layout shifts
- [ ] Add proper empty states
- [ ] Consistent button styles
- [ ] Loading skeleton screens
- [ ] Smooth page transitions
- [ ] Accessibility: focus states, keyboard nav

**Pages to review:**
- `/` - Homepage
- `/profile` - Portfolio
- `/updates` - Timeline
- `/market/[id]` - Market details

---

### 4. Leaderboard Page (MEDIUM - 2 hours)
**Status:** Not started

**Todo:**
- [ ] Create `/leaderboard` page
- [ ] Calculate P&L from on-chain data
- [ ] Show: Rank, Wallet, Volume, Trades, Win Rate, P&L
- [ ] Time filters: 24h, 7d, 30d, All Time
- [ ] Highlight current user
- [ ] Pagination (50 per page)
- [ ] Mobile-optimized table
- [ ] Real-time updates

**New files:**
- `app/leaderboard/page.tsx`
- `lib/leaderboard.ts` - P&L calculation

---

### 5. Production Hardening (HIGH - 2-3 hours)
**Todo:**
- [ ] Remove all console.logs
- [ ] Add error boundaries
- [ ] Security audit (XSS, input validation)
- [ ] Optimize bundle size
- [ ] Image optimization
- [ ] Rate limiting on API routes
- [ ] Add retry logic for failed requests
- [ ] Transaction timeout handling

---

## 🎯 NICE TO HAVE (Lower Priority)

### Marketing & Growth
- [ ] Add OG image generation (fix Next.js 16 issue)
- [ ] Create demo video
- [ ] Write detailed README
- [ ] Add CONTRIBUTING.md

### Technical Debt
- [ ] TypeScript strict mode everywhere
- [ ] Add unit tests
- [ ] E2E testing
- [ ] Performance optimization
- [ ] Code documentation

### Future Features
- [ ] WebSocket real-time price updates
- [ ] Historical price data export
- [ ] Batch trading API
- [ ] Python SDK for agents
- [ ] Mobile app (React Native)

---

## 📋 PRIORITY ORDER (Recommended)

1. **Error Handling** (1-2h) - Critical UX improvement
2. **UI Polish** (2-3h) - Demo-ready appearance
3. **Market Detail Phase 2** (3-4h) - Price charts, leaderboard per market
4. **Leaderboard Page** (2h) - Social proof, engagement
5. **Production Hardening** (2-3h) - Security, performance

**Total estimated:** 10-14 hours to production-ready

---

## 🚀 DEPLOYMENT STATUS

**Production URL:** https://app-rosy-mu.vercel.app

**Latest Deployed Features:**
- Market detail pages
- Agent API
- Toast notifications
- MoltBook integration

**Next Deploy:** After Error Handling integration

---

## 📝 NOTES

- Market detail pages have placeholders for charts/leaderboard
- Agent API is functional but needs docs update with examples
- MoltBook is auto-posting every 3 hours
- 155 markets live on devnet
- All core trading functionality works

**Questions/Blockers:** None currently

Last updated: 2026-02-08 15:53 IST
