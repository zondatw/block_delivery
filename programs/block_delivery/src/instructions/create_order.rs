use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(order_id: u64)]
pub struct CreateOrder<'info> {
    #[account(
        init,
        payer = customer,
        space = 8 + Order::INIT_SPACE,
        seeds = [
            b"order",
            customer.key().as_ref(),
            order_id.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub customer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateOrder>,
    order_id: u64,
    amount: u64,
) -> Result<()> {
    let order = &mut ctx.accounts.order;

    order.customer = ctx.accounts.customer.key();
    order.order_id = order_id;
    order.courier = None;
    order.amount = amount;
    order.status = OrderStatus::Created;
    order.bump = ctx.bumps.order;

    msg!("Order {} created", order_id);

    emit!(OrderCreated {
        order: order.key(),
        order_id: order.order_id,
        customer: order.customer,
        amount: order.amount,
    });

    Ok(())
}

#[event]
pub struct OrderCreated {
    pub order: Pubkey,
    pub order_id: u64,
    pub customer: Pubkey,
    pub amount: u64,
}
