import { BigNumberish, BytesLike } from "ethers";

enum TokenType {
  NIL,
  ERC20,
  ERC721,
}

enum GenericAssets {
  Cheese,
  Milk,
  Bread,
  Apple,
  Banana,
  Orange,
  Grape,
  Watermelon,
}

enum Identifiers {
  General,
  Major,
  Colonel,
  Lieutenant,
  Captain,
  Private,
}

type TrustedToken = {
  addr: string;
  tokenType: TokenType;
};

interface IData {
  dataType: BigNumberish;
  data: BytesLike;
  key: string;
}

enum DataType {
  NIL,
  ADDRESS,
  UINT256,
  INT64,
  BOOL,
  BYTES32,
  BYTES,
  STRING,
}

export { TokenType, GenericAssets, IData, TrustedToken, DataType, Identifiers };
