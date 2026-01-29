use anchor_lang::prelude::*;

#[account]
pub struct Order {
    pub customer: Pubkey,
    pub order_id: u64,
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

impl Order {
    pub const INIT_SPACE: usize =
        32 + // customer
        8 + // order_id
        1 + 32 + // courier (Option)
        8 + // amount
        1 + // status enum
        16; // padding
}
