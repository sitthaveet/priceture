import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { useState, useEffect } from "react";
export default function GetWalletData({ pageCount, setPageCount }) {
  const [walletError, setWalletError] = useState(false);
  const { address, chainId, isConnected } = useWeb3ModalAccount();

  console.log(
    "user wallet address:",
    address,
    " chainID: ",
    chainId,
    "isConnected: ",
    isConnected
  );
  const handleClick = () => {
    if (!isConnected) {
      setWalletError(true);
      return;
    } else setPageCount(pageCount + 1);
  };
  return (
    <div>
      <div className="mainContent__header">
        <div className="mainContent__header-stepname">
          Step 1: Connect Wallet
        </div>
        <div className="mainContent__header-explain">
          Connect Your Wallet with Wallet Connect. You will receive the dynamic
          NFT in this wallet
        </div>
      </div>
      <div className="mainContent__body">
        <w3m-button size="md" balance="hide" />

        {walletError ? <div>Connect wallet first!</div> : null}
      </div>
      <div className="mainContent__footer">
        <button
          className={isConnected ? "confirmBtn" : "confirmBtn-ghost"}
          onClick={handleClick}
        >
          Next
        </button>
      </div>
    </div>
  );
}