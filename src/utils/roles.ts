// eslint-disable-next-line node/no-unpublished-import
import { ethers } from "hardhat";

export const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// 0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929
export const OPERATOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("OPERATOR_ROLE"));

// 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
export const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));

// 0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848
export const BURNER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("BURNER_ROLE"));

// 0x71f3d55856e4058ed06ee057d79ada615f65cdf5f9ee88181b914225088f834f
export const MODERATOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MODERATOR_ROLE"));

// 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a
export const PAUSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAUSER_ROLE"));
