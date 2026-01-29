import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";

describe("accept_order", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .BlockDelivery as Program<BlockDelivery>;

  it("Courier accepts an order", async () => {
    const customer = provider.wallet;
    const courier = anchor.web3.Keypair.generate();

    // 1️⃣ Airdrop SOL to courier
    const sig = await provider.connection.requestAirdrop(
      courier.publicKey,
      1_000_000_000
    );
    await provider.connection.confirmTransaction(sig);

    const orderId = new anchor.BN(Date.now());
    const amount = new anchor.BN(1_000_000);

    // 2️⃣ Create the order first
    const [orderPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("order"),
        customer.publicKey.toBuffer(),
        orderId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    await program.methods
      .createOrder(orderId, amount)
      .accountsPartial({
        order: orderPda,
        customer: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Order created for accept test:", orderPda.toBase58());

    // 3️⃣ Call accept_order
    const tx = await program.methods
      .acceptOrder()
      .accountsPartial({
        order: orderPda,
        courier: courier.publicKey,
      })
      .signers([courier])
      .rpc();

    console.log("Accept order tx:", tx);

    // 4️⃣ Fetch order account
    const orderAccount = await program.account.order.fetch(orderPda);
    console.log("Order status:", orderAccount.status);
    console.log("Courier:", orderAccount.courier?.toBase58());
  });

});
