import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";

describe("block_delivery", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .BlockDelivery as Program<BlockDelivery>;

  it("Create order", async () => {
    const customer = provider.wallet;
    const orderId = new anchor.BN(Date.now());
    const amount = new anchor.BN(1_000_000) // 1 USDC (6 decimals)

    const [orderPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("order"),
        customer.publicKey.toBuffer(),
        orderId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx = await program.methods
      .createOrder(
        orderId,
        amount,
      )
      .accountsPartial({
        order: orderPda,
        customer: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create order tx:", tx);
  });
});
