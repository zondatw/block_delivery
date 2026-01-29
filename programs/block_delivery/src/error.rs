use anchor_lang::prelude::*;

#[error_code]
pub enum OrderError {
    #[msg("Order is not open")]
    OrderNotOpen,

    #[msg("Order already accepted")]
    AlreadyAccepted,

    #[msg("Customer cannot accept own order")]
    CannotAcceptOwnOrder,
}
