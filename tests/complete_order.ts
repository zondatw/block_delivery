import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";
import assert from "assert";

import { airdrop, createOrder, acceptOrder } from "./helpers";

describe("complete order", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockDelivery as Program<BlockDelivery>;

  const customer = provider.wallet;
  const courier = anchor.web3.Keypair.generate();
  const attacker = anchor.web3.Keypair.generate();

  const amount = new anchor.BN(1_000_000);

  // -----------------------
  // Setup
  // -----------------------
  before(async () => {
    await airdrop(provider, courier.publicKey);
    await airdrop(provider, attacker.publicKey);
  });

  // -----------------------
  // Tests
  // -----------------------

  it("Courier completes the order successfully", async () => {
    const { orderPda, orderId } = await createOrder(program, customer, amount);
    await acceptOrder(program, orderPda, courier);

    await program.methods
      .completeOrder()
      .accounts({
        order: orderPda,
        courier: courier.publicKey
      })
      .signers([courier])
      .rpc();

    const order = await program.account.order.fetch(orderPda);
    const statusKey = Object.keys(order.status)[0];
    assert.strictEqual(statusKey, "delivered");
    assert.strictEqual(order.courier?.toBase58(), courier.publicKey.toBase58());
  });

  it("Courier cannot complete the same order twice", async () => {
    const { orderPda, orderId } = await createOrder(program, customer, amount);
    await acceptOrder(program, orderPda, courier);

    await program.methods
      .completeOrder()
      .accounts({
        order: orderPda,
        courier: courier.publicKey
      })
      .signers([courier])
      .rpc();

    try {
      await program.methods
        .completeOrder()
        .accounts({
          order: orderPda,
          courier: courier.publicKey
        })
        .signers([courier])
        .rpc();

      assert.fail("Should not allow completing twice");
    } catch (err: any) {
      assert.ok(err.toString().includes("OrderNotAccepted"));
    }
  });

  it("Non-assigned courier cannot complete the order", async () => {
    const { orderPda, orderId } = await createOrder(program, customer, amount);
    await acceptOrder(program, orderPda, courier);

    try {
      await program.methods
        .completeOrder()
        .accounts({
          order: orderPda,
          courier: attacker.publicKey
        })
        .signers([attacker])
        .rpc();

      assert.fail("Attacker should not complete order");
    } catch (err: any) {
      assert.ok(err.toString().includes("UnauthorizedCourier"));
    }
  });

  it("Customer cannot complete the order", async () => {
    const { orderPda, orderId } = await createOrder(program, customer, amount);
    await acceptOrder(program, orderPda, courier);

    try {
      await program.methods
        .completeOrder()
        .accounts({
          order: orderPda,
          courier: customer.publicKey
        })
        .rpc();

      assert.fail("Customer should not complete order");
    } catch (err: any) {
      assert.ok(err.toString().includes("UnauthorizedCourier"));
    }
  });

  it("Cannot complete order before accept", async () => {
    const { orderPda, orderId } = await createOrder(program, customer, amount);

    try {
      await program.methods
        .completeOrder()
        .accounts({
          order: orderPda,
          courier: courier.publicKey
        })
        .signers([courier])
        .rpc();

      assert.fail("Should not complete before accept");
    } catch (err: any) {
      assert.ok(err.toString().includes("OrderNotAccepted"));
    }
  });
});
