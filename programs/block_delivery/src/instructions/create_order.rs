use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct CreateOrder<'info> {
    #[account(
        init,
        payer = customer,
        space = 8 + 32 + 33 + 8 + 1 + 1,
        seeds = [b"order", customer.key().as_ref()],
        bump
    )]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub customer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateOrder>,
    amount: u64,
) -> Result<()> {
    let order = &mut ctx.accounts.order;

    order.customer = ctx.accounts.customer.key();
    order.courier = None;
    order.amount = amount;
    order.status = OrderStatus::Created;
    order.bump = ctx.bumps.order;

    emit!(OrderCreated {
        order: order.key(),
        amount,
    });

    Ok(())
}

#[event]
pub struct OrderCreated {
    pub order: Pubkey,
    pub amount: u64,
}
