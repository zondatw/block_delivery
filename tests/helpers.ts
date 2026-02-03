import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";

export async function airdrop(provider: anchor.AnchorProvider, pubkey: anchor.web3.PublicKey, lamports = 1_000_000_000) {
  const sig = await provider.connection.requestAirdrop(pubkey, lamports);
  await provider.connection.confirmTransaction(sig);
}

export async function createOrder(
  program: Program<BlockDelivery>,
  provider: anchor.AnchorProvider,
  customer: anchor.Wallet,
  amount: anchor.BN
): Promise<anchor.web3.PublicKey> {
  const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("order_counter")],
    program.programId
  );

  const counterAccount = await program.account.orderCounter.fetch(counterPda);
  const orderId = new anchor.BN(counterAccount.nextId);

  const [orderPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("order"), orderId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  await program.methods
    .createOrder(amount)
    .accounts({
      counter: counterPda,
      order: orderPda,
      customer: customer.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  return orderPda;
}

export async function acceptOrder(
  program: Program<BlockDelivery>,
  orderPda: anchor.web3.PublicKey,
  courier: anchor.web3.Keypair
) {
  await program.methods
    .acceptOrder()
    .accounts({
      order: orderPda,
      courier: courier.publicKey,
    })
    .signers([courier])
    .rpc();
}
