import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";
import { expect } from "chai";

describe("accept_order", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockDelivery as Program<BlockDelivery>;

  it("Courier can accept an order and handle failure cases", async () => {
    const customer = provider.wallet;

    // 新 courier
    const courier = anchor.web3.Keypair.generate();

    // 1️⃣ Airdrop SOL to courier
    const sig = await provider.connection.requestAirdrop(
      courier.publicKey,
      1_000_000_000
    );
    await provider.connection.confirmTransaction(sig);

    const amount = new anchor.BN(1_000_000);

    // ---- Create order ----
    const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("order_counter"),
      ],
      program.programId
    );


    const counterAccount = await program.account.orderCounter.fetch(
      counterPda
    );

    const orderId = counterAccount.nextId;

    const [orderPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("order"),
        new anchor.BN(orderId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const tx = await program.methods
      .createOrder(
        amount,
      )
      .accountsPartial({
        counter: counterPda,
        order: orderPda,
        customer: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Order created for accept test:", orderPda.toBase58());

    // ---- accept order ----
    const accept_tx = await program.methods
      .acceptOrder()
      .accounts({
        order: orderPda,
        courier: courier.publicKey,
      })
      .signers([courier])
      .rpc();

    console.log("Accept order tx:", accept_tx);

    // ---- fetch order and assert ----
    const orderAccount = await program.account.order.fetch(orderPda);
    console.log("Order status:", orderAccount.status);
    console.log("Courier:", orderAccount.courier?.toBase58());


    // ✅ status should be Accepted
    const statusKey = Object.keys(orderAccount.status)[0];
    expect(statusKey).to.equal("accepted");

    // ✅ courier should be set
    expect(orderAccount.courier).to.not.be.null;
    expect(orderAccount.courier?.toBase58()).to.equal(courier.publicKey.toBase58());

    // ---- failure: accept same order again ----
    try {
      await program.methods
        .acceptOrder()
        .accounts({
          order: orderPda,
          courier: courier.publicKey
        })
        .signers([courier])
        .rpc();
      expect.fail("Should not allow accepting already accepted order");
    } catch (err: any) {
      expect(err.toString()).to.include("OrderNotOpen");
    }

    const orderIdBN = new anchor.BN(counterAccount.nextId);
    const nextOrderIdBN = orderIdBN.add(new anchor.BN(1));

    const [newOrderPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("order"), nextOrderIdBN.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createOrder(amount)
      .accounts({
        counter: counterPda,
        order: newOrderPda,
        customer: customer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      })
      .rpc();

    try {
      await program.methods
        .acceptOrder()
        .accounts({
          order: newOrderPda,
          courier: customer.publicKey
        })
        .rpc();
      expect.fail("Customer should not accept own order");
    } catch (err: any) {
      expect(err.toString()).to.include("CannotAcceptOwnOrder");
    }
  });
});
