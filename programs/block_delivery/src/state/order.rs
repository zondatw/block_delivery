use anchor_lang::prelude::*;

#[account]
pub struct Order {
    pub customer: Pubkey,
    pub courier: Option<Pubkey>,
    pub amount: u64,
    pub status: OrderStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OrderStatus {
    Created,
    Accepted,
    PickedUp,
    Delivered,
    Cancelled,
}
