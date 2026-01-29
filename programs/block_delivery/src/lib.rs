use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod error;

use instructions::*;

declare_id!("AdScDF7jTLCmb3iP4ZPugb6kxDtix1U7pVRu99VDJwdy");

#[program]
pub mod block_delivery {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn create_order(
        ctx: Context<CreateOrder>,
        order_id: u64,
        amount: u64,
    ) -> Result<()> {
        instructions::create_order::handler(ctx, order_id, amount)
    }

    pub fn accept_order(ctx: Context<AcceptOrder>) -> Result<()> {
        instructions::accept_order::handler(ctx)
    }
}
