use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("AdScDF7jTLCmb3iP4ZPugb6kxDtix1U7pVRu99VDJwdy");

#[program]
pub mod block_delivery {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }
}
