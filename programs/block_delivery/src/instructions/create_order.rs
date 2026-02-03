use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct CreateOrder<'info> {
    #[account(
        mut,
        seeds = [b"order_counter"],
        bump
    )]
    pub counter: Account<'info, OrderCounter>,

    #[account(
        init,
        payer = customer,
        space = 8 + Order::INIT_SPACE,
        seeds = [
            b"order",
            counter.next_id.to_le_bytes().as_ref(),
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
    amount: u64,
) -> Result<()> {
    let counter = &mut ctx.accounts.counter;
    let order_id = counter.next_id;
    let order = &mut ctx.accounts.order;

    order.customer = ctx.accounts.customer.key();
    order.order_id = order_id;
    order.courier = None;
    order.amount = amount;
    order.status = OrderStatus::Created;
    order.bump = ctx.bumps.order;

    counter.next_id += 1;

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
