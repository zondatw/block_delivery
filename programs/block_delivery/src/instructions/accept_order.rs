use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

#[derive(Accounts)]
pub struct AcceptOrder<'info> {
    #[account(
        mut,
        seeds = [
            b"order",
            order.order_id.to_le_bytes().as_ref(),
        ],
        bump = order.bump,
        constraint = order.status == OrderStatus::Created @ OrderError::OrderNotOpen,
        constraint = order.courier.is_none() @ OrderError::AlreadyAccepted,
        constraint = order.customer != courier.key() @ OrderError::CannotAcceptOwnOrder,
    )]
    pub order: Account<'info, Order>,

    #[account(mut)]
    pub courier: Signer<'info>,
}

pub fn handler(ctx: Context<AcceptOrder>) -> Result<()> {
    let order = &mut ctx.accounts.order;
    let courier = &ctx.accounts.courier;

    order.courier = Some(courier.key());
    order.status = OrderStatus::Accepted;

    emit!(OrderAccepted {
        order: order.key(),
        courier: ctx.accounts.courier.key(),
    });

    msg!(
        "Order {} accepted by {}",
        order.order_id,
        courier.key()
    );

    Ok(())
}

#[event]
pub struct OrderAccepted {
    pub order: Pubkey,
    pub courier: Pubkey,
}
