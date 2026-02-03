import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";
import { expect } from "chai";

import { airdrop, createOrder, acceptOrder, getCounterPda } from "./helpers";

describe("accept order", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockDelivery as Program<BlockDelivery>;

  it("Courier can accept an order and handle failure cases", async () => {
    const customer = provider.wallet;

    // 新 courier
    const courier = anchor.web3.Keypair.generate();

    // 1️⃣ Airdrop SOL to courier
    await airdrop(provider, courier.publicKey);

    const amount = new anchor.BN(1_000_000);

    // ---- Create first order ----
    const { orderPda, orderId } = await createOrder(program, customer, amount);

    // ---- accept order ----
    await acceptOrder(program, orderPda, courier);

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
    console.log("should be Accepted passed");

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
    console.log("same order again passed");

    // ---- failure: customer tries to accept own order ----
    const { orderPda: newOrderPda } = await createOrder(program, customer, amount);

    try {
      await program.methods
        .acceptOrder()
        .accounts({
          order: newOrderPda,
          courier: customer.publicKey, // ❌ customer trying to accept
        })
        .rpc();
      expect.fail("Customer should not accept own order");
    } catch (err: any) {
      expect(err.toString()).to.include("CannotAcceptOwnOrder");
    }
    console.log("customer tries to accept own order passed");
  });
});
