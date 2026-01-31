import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";
import assert from "assert";

describe("complete_order (clean)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockDelivery as Program<BlockDelivery>;

  const customer = provider.wallet;
  const courier = anchor.web3.Keypair.generate();
  const attacker = anchor.web3.Keypair.generate();

  const amount = new anchor.BN(1_000_000);

  // -----------------------
  // helpers
  // -----------------------
  async function airdrop(pubkey: anchor.web3.PublicKey) {
    const sig = await provider.connection.requestAirdrop(
      pubkey,
      1_000_000_000
    );
    await provider.connection.confirmTransaction(sig);
  }

  async function createOrder(orderId: anchor.BN) {
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

    return orderPda;
  }

  async function acceptOrder(orderPda: anchor.web3.PublicKey) {
    await program.methods
      .acceptOrder()
      .accountsPartial({
        order: orderPda,
        courier: courier.publicKey,
      })
      .signers([courier])
      .rpc();
  }

  // -----------------------
  // setup
  // -----------------------
  before(async () => {
    await airdrop(courier.publicKey);
    await airdrop(attacker.publicKey);
  });

  // -----------------------
  // tests
  // -----------------------

  it("Courier completes the order successfully", async () => {
    const orderId = new anchor.BN(Date.now());
    const orderPda = await createOrder(orderId);
    await acceptOrder(orderPda);

    await program.methods
      .completeOrder()
      .accountsPartial({
        order: orderPda,
        courier: courier.publicKey,
      })
      .signers([courier])
      .rpc();

    const order = await program.account.order.fetch(orderPda);
    assert.ok(order.status.delivered);
  });

  it("Courier cannot complete the same order twice", async () => {
    const orderId = new anchor.BN(Date.now());
    const orderPda = await createOrder(orderId);
    await acceptOrder(orderPda);

    await program.methods
      .completeOrder()
      .accountsPartial({
        order: orderPda,
        courier: courier.publicKey,
      })
      .signers([courier])
      .rpc();

    try {
      await program.methods
        .completeOrder()
        .accountsPartial({
          order: orderPda,
          courier: courier.publicKey,
        })
        .signers([courier])
        .rpc();

      assert.fail("Should not allow completing twice");
    } catch (err: any) {
      assert.strictEqual(
        err.error.errorCode.code,
        "OrderNotAccepted"
      );
    }
  });

  it("Non-assigned courier cannot complete the order", async () => {
    const orderId = new anchor.BN(Date.now());
    const orderPda = await createOrder(orderId);
    await acceptOrder(orderPda);

    try {
      await program.methods
        .completeOrder()
        .accountsPartial({
          order: orderPda,
          courier: attacker.publicKey,
        })
        .signers([attacker])
        .rpc();

      assert.fail("Attacker should not complete order");
    } catch (err: any) {
      assert.strictEqual(
        err.error.errorCode.code,
        "UnauthorizedCourier"
      );
    }
  });

  it("Customer cannot complete the order", async () => {
    const orderId = new anchor.BN(Date.now());
    const orderPda = await createOrder(orderId);
    await acceptOrder(orderPda);

    try {
      await program.methods
        .completeOrder()
        .accountsPartial({
          order: orderPda,
          courier: customer.publicKey,
        })
        .rpc();

      assert.fail("Customer should not complete order");
    } catch (err: any) {
      const code = "UnauthorizedCourier";
      if (err.error && err.error.errorCode) {
        assert.strictEqual(err.error.errorCode.code, code);
      } else {
        assert.fail(`Expected AnchorError ${code}, got ${err}`);
      }
    }
  });

  it("Cannot complete order before accept", async () => {
    const orderId = new anchor.BN(Date.now());
    const orderPda = await createOrder(orderId);

    try {
      await program.methods
        .completeOrder()
        .accountsPartial({
          order: orderPda,
          courier: courier.publicKey,
        })
        .signers([courier])
        .rpc();

      assert.fail("Should not complete before accept");
    } catch (err: any) {
      assert.strictEqual(
        err.error.errorCode.code,
        "OrderNotAccepted"
      );
    }
  });
});
