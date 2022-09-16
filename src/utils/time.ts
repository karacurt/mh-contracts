interface ethers {
  provider: { getBlock: (arg0: any) => any; getBlockNumber: () => any };
}

export async function now(ethers: ethers): Promise<number> {
  const blockBefore = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
  const now = blockBefore.timestamp;
  return now;
}
