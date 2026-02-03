use anchor_lang::prelude::*;

#[account]
pub struct OrderCounter {
    pub next_id: u64,
}

impl OrderCounter {
    pub const INIT_SPACE: usize =
        8 + // next_id
        0; // padding
}