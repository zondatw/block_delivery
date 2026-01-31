use anchor_lang::prelude::*;

#[error_code]
pub enum OrderError {
    #[msg("Order is not open")]
    OrderNotOpen,

    #[msg("Order already accepted")]
    AlreadyAccepted,

    #[msg("Customer cannot accept own order")]
    CannotAcceptOwnOrder,

    #[msg("Order is not accepted yet")]
    OrderNotAccepted,

    #[msg("Only the assigned courier can complete this order")]
    UnauthorizedCourier,
}
