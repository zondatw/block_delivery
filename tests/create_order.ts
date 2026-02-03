// tests/create_order.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";
import { expect } from "chai";

import { airdrop, createOrder } from "./helpers";

describe("create_order", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BlockDelivery as Program<BlockDelivery>;

  it("Create order", async () => {
    const customer = provider.wallet;
    const amount = new anchor.BN(1_000_000); // 1 USDC (6 decimals)

    await airdrop(provider, customer.publicKey);

    // 使用 helper 創建 order
    const { orderPda, orderId } = await createOrder(program, customer, amount);

    console.log("Order PDA:", orderPda.toBase58());

    // 讀取 account
    const orderAccount = await program.account.order.fetch(orderPda);
    console.log("Order account:", orderAccount);

    // ✅ 驗證
    expect(orderAccount.orderId.eq(orderId)).to.be.true;
    expect(orderAccount.amount.eq(amount)).to.be.true;
    expect(orderAccount.customer.toBase58()).to.equal(customer.publicKey.toBase58());
  });
});
