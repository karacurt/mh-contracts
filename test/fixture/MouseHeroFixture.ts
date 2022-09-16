import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export class MouseHeroFixture {
  contract: Contract;
  owner: SignerWithAddress;

  constructor(contract: Contract, owner: SignerWithAddress) {
    this.contract = contract;
    this.owner = owner;
  }

  async mintMouseHeroTo(playerAddress: string): Promise<number> {
    const transaction = await this.contract
      .connect(this.owner)
      .mintSpecialMouseHero(playerAddress, "Special Mouse Hero");
    const tx = await transaction.wait();

    const event = tx.events![0];
    const value = event.args![2];
    const tokenId = value.toNumber();
    return tokenId;
  }
}
