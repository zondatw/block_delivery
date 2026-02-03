import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BlockDelivery } from "../target/types/block_delivery";

export async function airdrop(provider: anchor.AnchorProvider, pubkey: anchor.web3.PublicKey, lamports = 1_000_000_000) {
  const sig = await provider.connection.requestAirdrop(pubkey, lamports);
  await provider.connection.confirmTransaction(sig);
}

export async function getCounterPda(
  program: Program<BlockDelivery>
): Promise<{ counterPda: anchor.web3.PublicKey; }> {
  const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("order_counter")],
    program.programId
  );

  return {counterPda};
}

export async function createOrder(
  program: Program<BlockDelivery>,
  provider: anchor.AnchorProvider,
  customer: anchor.Wallet,
  amount: anchor.BN
): Promise<{ orderPda: anchor.web3.PublicKey; orderId: number }> {
  // 1️⃣ derive counter PDA
  const {counterPda} = await getCounterPda(program);

  // 2️⃣ fetch counter to get nextId
  const counterAccount = await program.account.orderCounter.fetch(counterPda);
  const orderId = counterAccount.nextId;

  // 3️⃣ derive order PDA using same seeds as contract
  const [orderPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("order"),
      new anchor.BN(orderId).toArrayLike(Buffer, "le", 8),
    ],
    program.programId
  );

  // 4️⃣ call createOrder
  await program.methods
    .createOrder(amount)
    .accounts({
      counter: counterPda,
      order: orderPda,
      customer: customer.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  return { orderPda, orderId };
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
