import { ReactElement } from "react";

import BigNumber from "bignumber.js";
export interface Token {
  id?: number;
  address: string;
  name: string;
  symbol: string;
  currentValue?: number | string;
  tokenInfo?: TokenInfo;
  balance?: string | BigNumber;
  totalSupply?: BigNumber;
  decimals?: number;
  isTransactional?: boolean;
}

export interface TokenInfo extends Partial<Token> {
    icon: string | ReactElement;
    prices: TokenPrice
}

export interface TokenPrice {
  [key: string]: number;
}