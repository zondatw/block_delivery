use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
pub struct CompleteOrder<'info> {
    #[account(
        mut,
        seeds = [
            b"order",
            order.customer.as_ref(),
            order.order_id.to_le_bytes().as_ref(),
        ],
        bump = order.bump,
        constraint = order.status == OrderStatus::Accepted @ OrderError::OrderNotAccepted,
        constraint = order.courier == Some(courier.key()) @ OrderError::UnauthorizedCourier,
    )]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub courier: Signer<'info>,
}

pub fn handler(ctx: Context<CompleteOrder>) -> Result<()> {
    let order = &mut ctx.accounts.order;
    let courier = &ctx.accounts.courier;

    // 狀態轉移
    order.status = OrderStatus::Delivered;

    emit!(OrderCompleted {
        order: order.key(),
        order_id: order.order_id,
        courier: courier.key(),
        amount: order.amount,
    });

    msg!(
        "Order {} completed by courier {}",
        order.order_id,
        courier.key()
    );

    Ok(())
}

#[event]
pub struct OrderCompleted {
    pub order: Pubkey,
    pub order_id: u64,
    pub courier: Pubkey,
    pub amount: u64,
}
