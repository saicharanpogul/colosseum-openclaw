use anchor_lang::prelude::*;

declare_id!("HsdG697s3bvayLkKZgK1M3F34susRMjF3KphrFdd6qRH");

#[program]
pub mod vapor {
    use super::*;

    /// Initialize a new prediction market for a Colosseum project
    pub fn create_market(
        ctx: Context<CreateMarket>,
        project_id: u64,
        project_name: String,
        resolution_timestamp: i64,
        bump: u8,
    ) -> Result<()> {
        require!(project_name.len() <= 64, VaporError::NameTooLong);
        
        // Transfer initial liquidity from user to market (optional: can be 0 or small)
        // For now, we assume initial pools are virtual/math-only unless funded.
        // But to make buys work with real SOL, we need a base.
        // Let's keep it simple: Market starts with 0 SOL balance but logical pools.
        
        let market = &mut ctx.accounts.market;
        // Set authority to the hardcoded oracle key, not the creator
        // OR allow creator to be authority but only Faahh can deploy?
        // Let's set it to the specific Oracle key provided.
        market.authority = ORACLE_KEY;
        
        market.project_id = project_id;
        market.project_name = project_name;
        market.yes_pool = INITIAL_LIQUIDITY;
        market.no_pool = INITIAL_LIQUIDITY;
        market.total_volume = 0;
        market.net_sol_deposited = 0;
        market.resolved_pot_size = 0;
        market.status = MarketStatus::Open;
        market.resolution = None;
        market.resolution_timestamp = resolution_timestamp;
        market.created_at = Clock::get()?.unix_timestamp;
        market.bump = bump;
        
        emit!(MarketCreated {
            market: market.key(),
            project_id,
            authority: market.authority,
        });
        
        Ok(())
    }

    /// Buy shares in a market
    pub fn buy_shares(
        ctx: Context<BuyShares>,
        side: Side,
        amount: u64,
        position_bump: u8,
    ) -> Result<()> {
        require!(amount > 0, VaporError::InvalidAmount);
        
        let market = &mut ctx.accounts.market;
        require!(market.status == MarketStatus::Open, VaporError::MarketClosed);
        
        // Transfer SOL from user to market PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: market.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        // Calculate shares using CPMM
        let shares = match side {
            Side::Yes => {
                let shares = calculate_shares(market.yes_pool, market.no_pool, amount);
                market.no_pool = market.no_pool.checked_add(amount).ok_or(VaporError::Overflow)?;
                market.yes_pool = market.yes_pool.checked_sub(shares).ok_or(VaporError::Overflow)?;
                shares
            }
            Side::No => {
                let shares = calculate_shares(market.no_pool, market.yes_pool, amount);
                market.yes_pool = market.yes_pool.checked_add(amount).ok_or(VaporError::Overflow)?;
                market.no_pool = market.no_pool.checked_sub(shares).ok_or(VaporError::Overflow)?;
                shares
            }
        };
        
        market.total_volume = market.total_volume.checked_add(amount).ok_or(VaporError::Overflow)?;
        market.net_sol_deposited = market.net_sol_deposited.checked_add(amount).ok_or(VaporError::Overflow)?;
        
        // Update or create position
        let position = &mut ctx.accounts.position;
        if position.shares == 0 {
            // New position
            position.owner = ctx.accounts.user.key();
            position.market = market.key();
            position.side = side;
            position.shares = shares;
            position.avg_price = calculate_price(amount, shares);
            position.bump = position_bump;
        } else {
            // Accumulate position (same side guaranteed by PDA seeds)
            let total_cost = position.avg_price
                .checked_mul(position.shares).ok_or(VaporError::Overflow)?
                .checked_add(amount).ok_or(VaporError::Overflow)?;
            position.shares = position.shares.checked_add(shares).ok_or(VaporError::Overflow)?;
            position.avg_price = total_cost.checked_div(position.shares).unwrap_or(0);
        }
        
        emit!(SharesBought {
            market: market.key(),
            user: ctx.accounts.user.key(),
            side,
            amount,
            shares,
        });
        
        Ok(())
    }

    /// Sell shares back to the market
    pub fn sell_shares(
        ctx: Context<SellShares>,
        side: Side,
        shares_to_sell: u64,
        _position_bump: u8,
    ) -> Result<()> {
        require!(shares_to_sell > 0, VaporError::InvalidAmount);
        
        let market = &mut ctx.accounts.market;
        require!(market.status == MarketStatus::Open, VaporError::MarketClosed);
        
        let position = &mut ctx.accounts.position;
        require!(position.shares >= shares_to_sell, VaporError::InsufficientShares);
        
        // Calculate payout using reverse CPMM
        // When selling YES shares: add shares to yes_pool, remove from no_pool
        let payout = match side {
            Side::Yes => {
                let payout = calculate_sell_payout(market.yes_pool, market.no_pool, shares_to_sell);
                market.yes_pool = market.yes_pool.checked_add(shares_to_sell).ok_or(VaporError::Overflow)?;
                market.no_pool = market.no_pool.checked_sub(payout).ok_or(VaporError::Overflow)?;
                payout
            }
            Side::No => {
                let payout = calculate_sell_payout(market.no_pool, market.yes_pool, shares_to_sell);
                market.no_pool = market.no_pool.checked_add(shares_to_sell).ok_or(VaporError::Overflow)?;
                market.yes_pool = market.yes_pool.checked_sub(payout).ok_or(VaporError::Overflow)?;
                payout
            }
        };
        
        // Update net SOL deposited
        market.net_sol_deposited = market.net_sol_deposited.checked_sub(payout).ok_or(VaporError::Overflow)?;

        // Transfer SOL from market PDA to user
        let project_id_bytes = market.project_id.to_le_bytes();
        let seeds = &[
            MARKET_SEED,
            project_id_bytes.as_ref(),
            &[market.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: market.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            signer,
        );
        anchor_lang::system_program::transfer(cpi_context, payout)?;

        // Reduce position
        position.shares = position.shares.checked_sub(shares_to_sell).ok_or(VaporError::Overflow)?;
        
        emit!(SharesSold {
            market: market.key(),
            user: ctx.accounts.user.key(),
            side,
            shares: shares_to_sell,
            payout,
        });
        
        Ok(())
    }

    /// Resolve a market (authority only)
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        winner: Side,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        require!(market.status == MarketStatus::Open, VaporError::MarketClosed);
        require!(
            ctx.accounts.authority.key() == market.authority,
            VaporError::Unauthorized
        );
        
        market.status = MarketStatus::Resolved;
        market.resolution = Some(winner);
        // Snapshot the pot size for payouts
        market.resolved_pot_size = market.net_sol_deposited;
        
        emit!(MarketResolved {
            market: market.key(),
            winner,
        });
        
        Ok(())
    }

    /// Claim winnings from a resolved market
    pub fn claim_winnings(ctx: Context<ClaimWinnings>, side: Side) -> Result<()> {
        let market = &ctx.accounts.market;
        let position = &mut ctx.accounts.position;
        
        require!(market.status == MarketStatus::Resolved, VaporError::MarketNotResolved);
        require!(position.shares > 0, VaporError::NoPosition);
        
        let winner = market.resolution.ok_or(VaporError::MarketNotResolved)?;
        require!(position.side == winner, VaporError::PositionLost);
        
        // Calculate payout
        // Total shares outstanding for the winning side = Initial Liquidity - Current Liquidity
        let total_shares_outstanding = match winner {
            Side::Yes => INITIAL_LIQUIDITY.saturating_sub(market.yes_pool),
            Side::No => INITIAL_LIQUIDITY.saturating_sub(market.no_pool),
        };

        if total_shares_outstanding == 0 {
            // Should be impossible if user has > 0 shares
            return Err(VaporError::Overflow.into());
        }

        // Payout = (User Shares / Total Winning Shares) * Net SOL Deposited at Resolution
        // We use resolved_pot_size to ensure consistency even if market balance changes (rent, etc)
        let payout = (position.shares as u128)
            .checked_mul(market.resolved_pot_size as u128).ok_or(VaporError::Overflow)?
            .checked_div(total_shares_outstanding as u128).ok_or(VaporError::Overflow)? as u64;
            
        require!(payout > 0, VaporError::InvalidAmount);

        // Transfer SOL from market PDA to user
        let project_id_bytes = market.project_id.to_le_bytes();
        let seeds = &[
            MARKET_SEED,
            project_id_bytes.as_ref(),
            &[market.bump],
        ];
        let signer = &[&seeds[..]];

        // We use market.sub_lamports() logic via transfer instruction
        // Note: CpiContext transfer requires the account to be mutable and signed.
        // But market is a PDA, so we sign with seeds.
        
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: market.to_account_info(),
            to: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        anchor_lang::system_program::transfer(cpi_ctx, payout)?;
        
        // Mark position as claimed
        position.shares = 0;
        
        emit!(WinningsClaimed {
            market: market.key(),
            user: ctx.accounts.user.key(),
            payout,
        });
        
        Ok(())
    }
}

// === Constants ===

pub const INITIAL_LIQUIDITY: u64 = 1_000_000_000; // 1B lamports (1 SOL)
pub const MARKET_SEED: &[u8] = b"vapor-market";
pub const POSITION_SEED: &[u8] = b"vapor-position";
// Hardcoded authority (Faahh's wallet)
pub const ORACLE_KEY: Pubkey = Pubkey::new_from_array([
    248, 157, 189, 71, 37, 176, 34, 58,
    198, 161, 84, 159, 9, 200, 44, 133,
    207, 100, 130, 71, 34, 21, 105, 95,
    4, 8, 141, 201, 102, 122, 201, 45
]);

// === Helper Functions ===

fn calculate_shares(pool: u64, opposite_pool: u64, amount: u64) -> u64 {
    // CPMM: shares = pool - (pool * opposite_pool) / (opposite_pool + amount)
    let k = (pool as u128).checked_mul(opposite_pool as u128).unwrap_or(0);
    let new_opposite = (opposite_pool as u128).checked_add(amount as u128).unwrap_or(u128::MAX);
    let new_pool = k.checked_div(new_opposite).unwrap_or(0);
    pool.saturating_sub(new_pool as u64)
}

fn calculate_sell_payout(pool: u64, opposite_pool: u64, shares: u64) -> u64 {
    // Reverse CPMM: payout = opposite_pool - (pool * opposite_pool) / (pool + shares)
    let k = (pool as u128).checked_mul(opposite_pool as u128).unwrap_or(0);
    let new_pool = (pool as u128).checked_add(shares as u128).unwrap_or(u128::MAX);
    let new_opposite = k.checked_div(new_pool).unwrap_or(0);
    opposite_pool.saturating_sub(new_opposite as u64)
}

fn calculate_price(amount: u64, shares: u64) -> u64 {
    if shares == 0 { return 0; }
    amount.checked_div(shares).unwrap_or(0)
}

// === Account Structures ===

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub project_id: u64,
    pub project_name: String, // max 64 chars
    pub yes_pool: u64,
    pub no_pool: u64,
    pub total_volume: u64,
    pub net_sol_deposited: u64,
    pub resolved_pot_size: u64, // Snapshot of pot at resolution
    pub status: MarketStatus,
    pub resolution: Option<Side>,
    pub resolution_timestamp: i64,
    pub created_at: i64,
    pub bump: u8,
}

impl Market {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 + // project_id
        (4 + 64) + // project_name (len prefix + max chars)
        8 + // yes_pool
        8 + // no_pool
        8 + // total_volume
        8 + // net_sol_deposited
        8 + // resolved_pot_size
        1 + // status
        2 + // resolution (Option<Side>)
        8 + // resolution_timestamp
        8 + // created_at
        1 + // bump
        64; // padding
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub market: Pubkey,
    pub side: Side,
    pub shares: u64,
    pub avg_price: u64,
    pub bump: u8,
}

impl Position {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        32 + // market
        1 + // side
        8 + // shares
        8 + // avg_price
        1 + // bump
        16; // padding
}

// === Enums ===

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketStatus {
    Open,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum Side {
    Yes,
    No,
}

// === Contexts ===

#[derive(Accounts)]
#[instruction(project_id: u64, project_name: String, resolution_timestamp: i64, bump: u8)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = Market::LEN,
        seeds = [MARKET_SEED, project_id.to_le_bytes().as_ref()],
        bump
    )]
    pub market: Account<'info, Market>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(side: Side, amount: u64, position_bump: u8)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = Position::LEN,
        seeds = [POSITION_SEED, market.key().as_ref(), user.key().as_ref(), &[side as u8]],
        bump
    )]
    pub position: Account<'info, Position>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(side: Side, shares_to_sell: u64, position_bump: u8)]
pub struct SellShares<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [POSITION_SEED, market.key().as_ref(), user.key().as_ref(), &[side as u8]],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        address = ORACLE_KEY @ VaporError::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub market: Account<'info, Market>,
}

#[derive(Accounts)]
#[instruction(side: Side)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub market: Account<'info, Market>,
    
    #[account(
        mut,
        seeds = [POSITION_SEED, market.key().as_ref(), user.key().as_ref(), &[side as u8]],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,

    pub system_program: Program<'info, System>,
}

// === Events ===

#[event]
pub struct MarketCreated {
    pub market: Pubkey,
    pub project_id: u64,
    pub authority: Pubkey,
}

#[event]
pub struct SharesBought {
    pub market: Pubkey,
    pub user: Pubkey,
    pub side: Side,
    pub amount: u64,
    pub shares: u64,
}

#[event]
pub struct SharesSold {
    pub market: Pubkey,
    pub user: Pubkey,
    pub side: Side,
    pub shares: u64,
    pub payout: u64,
}

#[event]
pub struct MarketResolved {
    pub market: Pubkey,
    pub winner: Side,
}

#[event]
pub struct WinningsClaimed {
    pub market: Pubkey,
    pub user: Pubkey,
    pub payout: u64,
}

// === Errors ===

#[error_code]
pub enum VaporError {
    #[msg("Name exceeds 64 characters")]
    NameTooLong,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Market is closed")]
    MarketClosed,
    #[msg("Market not yet resolved")]
    MarketNotResolved,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Position is on wrong side")]
    WrongSide,
    #[msg("No position to claim")]
    NoPosition,
    #[msg("Position did not win")]
    PositionLost,
    #[msg("Insufficient shares to sell")]
    InsufficientShares,
}
