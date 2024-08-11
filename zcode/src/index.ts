import { createPublicClient, createWalletClient, http } from "viem";
import { localhost, mainnet } from "viem/chains";
import { MetaMaskSDK, MetaMaskSDKOptions } from "@metamask/sdk"
import { createTestClient } from 'viem'
import { foundry } from 'viem/chains'
import { getContract } from 'viem'
import { usdeAbi } from "./abi";

const options: MetaMaskSDKOptions = {
  shouldShimWeb3: false,
  communicationServerUrl: 'http://localhost:8545',  //anvil testnet
  dappMetadata: {
    name: 'NodeJS example',
  },
  logging: {
    sdk: false,
  },
  checkInstallationImmediately: false,
  // Optional: customize modal text
  modals: {
    otp: () => {
      return {
        mount() {},
        updateOTPValue: (otpValue) => {
          if (otpValue !== '') {
            console.debug(
              `[CUSTOMIZE TEXT] Choose the following value on your metamask mobile wallet: ${otpValue}`,
            );
          }
        },
      };
    },
  },
};

const mmsdk = new MetaMaskSDK(options);
const ethereum = mmsdk.getProvider()
if (ethereum != undefined)
  ethereum.request({ method: "eth_requestAccounts", params: [] })

const client1 = createPublicClient({chain: localhost, transport: http()})
const client2 = createWalletClient({
  chain: localhost,
  transport: http()
})
const client3 = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http(), 
})

const contractme = getContract({
  address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  abi: usdeAbi,
  // 1a. Insert a single client
  // 1b. Or public and/or wallet clients
  client: { public: client1, wallet: client2 }
})

const testme = async() => { 
    const blockNumber = await client1.getBlockNumber() 
    console.log(blockNumber)

    //let address: string[] = []
    const address: string[] = await client2.getAddresses()
    console.log(address[0], address[1])

    const mine = await client3.mine({ blocks: 1 })
    console.log(mine)

    const result = await contractme.read.totalSupply()
    console.log(result)
}

testme()

