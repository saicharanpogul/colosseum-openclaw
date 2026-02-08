# Vapor - Remaining Tasks

## ✅ Completed (Feb 8, 2026)
- [x] Fix modal layout (Project/Side in one row, Stats in second row)
- [x] Add WIP note for share card images
- [x] Update roadmap priorities

## 🔄 In Progress

### 4. UI Polish & Bug Fixes
**Status:** Starting now
**Tasks:**
- [ ] Review all pages (Home, Profile, Updates) for visual issues
- [ ] Fix any alignment/spacing issues
- [ ] Ensure consistent color scheme
- [ ] Check mobile responsiveness
- [ ] Test all buttons and interactions
- [ ] Fix any console errors

### 6. Price History + Dedicated Market Pages
**Priority:** High
**Tasks:**
- [ ] Create `/market/[id]` page route
- [ ] Design market detail page layout
- [ ] Add price history chart (Recharts)
- [ ] Store price snapshots in Supabase (new table)
- [ ] Add cron job to capture prices every 15min
- [ ] Show 24h/7d/30d price charts
- [ ] Display full market stats (volume, traders, odds history)
- [ ] Add "View Details" button on market cards

### 7. Error Messages & UX
**Priority:** High
**Tasks:**
- [ ] Add toast notifications for errors
- [ ] Better wallet connection errors
- [ ] Transaction failure messages
- [ ] Network error handling
- [ ] Loading states for all async operations
- [ ] Insufficient balance warnings
- [ ] Market not deployed warnings

### 8. Leaderboard
**Priority:** Medium
**Tasks:**
- [ ] Create `/leaderboard` page
- [ ] Calculate P&L for all users
- [ ] Show top 20 traders
- [ ] Display: Wallet, Total Volume, Win Rate, P&L
- [ ] Add filters (24h, 7d, All Time)
- [ ] Highlight current user position

### 9. MoltBook Marketing Agent
**Priority:** High (Marketing)
**Tasks:**
- [ ] Research MoltBook platform & API
- [ ] Create Vapor agent persona
- [ ] Draft initial post about Vapor
- [ ] Share Colosseum hackathon experience
- [ ] Invite other agents to contribute
- [ ] Promote agent participation in hackathon
- [ ] Share updates and milestones
- [ ] Engage with agent community

## 🎯 Priority Order
1. **UI Polish** (1-2 hours) - Make demo-ready
2. **Error Messages** (1 hour) - Better UX
3. **Market Pages** (2-3 hours) - Key feature
4. **Leaderboard** (1-2 hours) - Engagement
5. **MoltBook Agent** (1 hour setup + ongoing) - Marketing

## 📊 Estimated Timeline
- **Today:** UI Polish + Error Messages
- **Tomorrow:** Market Pages + Leaderboard
- **Ongoing:** MoltBook Marketing

## 🚀 Deployment Strategy
- Deploy after each major feature
- Test on production before moving to next
- Update timeline in README after each milestone
