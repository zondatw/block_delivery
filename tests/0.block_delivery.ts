import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";

describe("block_delivery", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockDelivery as Program<BlockDelivery>;

  it("Initialize program / counter", async () => {
    // 如果你的合約需要一個 counter account 初始化
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("order_counter")],
      program.programId
    );

    try {
      const counter = await program.account.orderCounter.fetch(counterPda);
      console.log("Counter already exists:", counter.nextId.toNumber());
      return; // 已初始化就不用再 init
    } catch {
      try {
        const tx = await program.methods
          .initialize()
          .accounts({
            counter: counterPda,
            payer: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        console.log("✅ Program initialized, tx:", tx);

        const counterAccount = await program.account.orderCounter.fetch(counterPda);
        console.log("Counter nextId:", counterAccount.nextId.toNumber());
      } catch (err) {
        console.error("Initialization failed:", err);
        throw err;
      }
    }
  });
});
