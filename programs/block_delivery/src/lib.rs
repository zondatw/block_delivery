use anchor_lang::prelude::*;

declare_id!("AdScDF7jTLCmb3iP4ZPugb6kxDtix1U7pVRu99VDJwdy");

#[program]
pub mod block_delivery {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
