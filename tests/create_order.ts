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

    const [orderPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("order"), customer.publicKey.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .createOrder(new anchor.BN(1_000_000)) // 1 USDC (6 decimals)
      .accounts({
        order: orderPda,
        customer: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("tx:", tx);
  });
});
