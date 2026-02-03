import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";
import { expect } from "chai";

describe("block_delivery", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .BlockDelivery as Program<BlockDelivery>;

  it("Create order", async () => {
    const customer = provider.wallet;
    const amount = new anchor.BN(1_000_000) // 1 USDC (6 decimals)

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

    console.log("Create order tx:", tx);

    const orderAccount = await program.account.order.fetch(orderPda);

    console.log("Order:", orderAccount);

    expect(orderAccount.orderId.eq(orderId)).to.be.true;
    expect(orderAccount.amount.eq(amount)).to.be.true;
    expect(orderAccount.customer.toBase58()).to.equal(
      customer.publicKey.toBase58()
    );

  });
});
