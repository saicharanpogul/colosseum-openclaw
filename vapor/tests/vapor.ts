import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vapor } from "../target/types/vapor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";

describe("vapor", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vapor as Program<Vapor>;
  const authority = provider.wallet;
  
  const projectId = new anchor.BN(Math.floor(Math.random() * 1000000));
  const projectName = "Test Project";
  const resolutionTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);
  
  let marketPDA: PublicKey;
  let marketBump: number;
  let positionPDA: PublicKey;
  let positionBump: number;

  before(async () => {
    // Derive PDAs
    [marketPDA, marketBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vapor-market"), projectId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    
    [positionPDA, positionBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vapor-position"), marketPDA.toBuffer(), authority.publicKey.toBuffer()],
      program.programId
    );
    
    console.log("Market PDA:", marketPDA.toBase58());
    console.log("Position PDA:", positionPDA.toBase58());
  });

  it("Creates a market", async () => {
    const tx = await program.methods
      .createMarket(projectId, projectName, resolutionTimestamp, marketBump)
      .accounts({
        authority: authority.publicKey,
        market: marketPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Create market tx:", tx);

    const market = await program.account.market.fetch(marketPDA);
    expect(market.projectId.toNumber()).to.equal(projectId.toNumber());
    expect(market.projectName).to.equal(projectName);
    expect(market.yesPool.toNumber()).to.equal(1_000_000);
    expect(market.noPool.toNumber()).to.equal(1_000_000);
    expect(market.totalVolume.toNumber()).to.equal(0);
    console.log("✅ Market created successfully");
  });

  it("Buys YES shares", async () => {
    const amount = new anchor.BN(100_000); // 0.0001 SOL in lamports
    
    const tx = await program.methods
      .buyShares({ yes: {} }, amount, positionBump)
      .accounts({
        user: authority.publicKey,
        market: marketPDA,
        position: positionPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Buy shares tx:", tx);

    const market = await program.account.market.fetch(marketPDA);
    expect(market.totalVolume.toNumber()).to.be.greaterThan(0);
    
    const position = await program.account.position.fetch(positionPDA);
    expect(position.shares.toNumber()).to.be.greaterThan(0);
    console.log("✅ Bought YES shares, position:", position.shares.toNumber());
  });

  it("Buys more YES shares", async () => {
    const amount = new anchor.BN(50_000);
    
    const marketBefore = await program.account.market.fetch(marketPDA);
    const positionBefore = await program.account.position.fetch(positionPDA);
    
    const tx = await program.methods
      .buyShares({ yes: {} }, amount, positionBump)
      .accounts({
        user: authority.publicKey,
        market: marketPDA,
        position: positionPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Buy more shares tx:", tx);

    const marketAfter = await program.account.market.fetch(marketPDA);
    const positionAfter = await program.account.position.fetch(positionPDA);
    
    expect(positionAfter.shares.toNumber()).to.be.greaterThan(positionBefore.shares.toNumber());
    expect(marketAfter.totalVolume.toNumber()).to.be.greaterThan(marketBefore.totalVolume.toNumber());
    console.log("✅ Accumulated more shares");
  });

  it("Resolves market to YES", async () => {
    const tx = await program.methods
      .resolveMarket({ yes: {} })
      .accounts({
        authority: authority.publicKey,
        market: marketPDA,
      })
      .rpc();

    console.log("Resolve market tx:", tx);

    const market = await program.account.market.fetch(marketPDA);
    expect(market.status).to.deep.equal({ resolved: {} });
    expect(market.resolution).to.deep.equal({ yes: {} });
    console.log("✅ Market resolved to YES");
  });

  it("Claims winnings", async () => {
    const tx = await program.methods
      .claimWinnings()
      .accounts({
        user: authority.publicKey,
        market: marketPDA,
        position: positionPDA,
      })
      .rpc();

    console.log("Claim winnings tx:", tx);

    const position = await program.account.position.fetch(positionPDA);
    expect(position.shares.toNumber()).to.equal(0);
    console.log("✅ Winnings claimed, position zeroed");
  });
});
