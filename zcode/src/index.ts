import { createPublicClient, createWalletClient, http } from "viem";
import { localhost, mainnet, anvil } from "viem/chains";
import { MetaMaskSDK, MetaMaskSDKOptions } from "@metamask/sdk"
import { createTestClient, Address } from 'viem'
import { foundry } from 'viem/chains'
import { getContract, defineChain } from 'viem'
import { usdeAbi } from "./abi";
import { privateKeyToAccount } from "viem/accounts";

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

const clientPublic = createPublicClient({chain: localhost, transport: http()})

const customChain = defineChain({
  id: 31337,
  name: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost'],
    },
  },
})

const accountMe = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')
const clientWallet = createWalletClient({
  account: accountMe,
  chain: customChain,
  transport: http('http://localhost:8545')
})
const clientTest = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http(), 
})

const contractme = getContract({
  address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  abi: usdeAbi,
  // 1a. Insert a single client
  // 1b. Or public and/or wallet clients
  client: { public: clientPublic, wallet: clientWallet }
})

const testme = async() => { 
    const blockNumber = await clientPublic.getBlockNumber() 
    console.log(blockNumber)

    //let address: string[] = []
    const address: string[] = await clientWallet.getAddresses()
    console.log(address[0], address[1])

    const mine = await clientTest.mine({ blocks: 1 })
    console.log(mine)

    const result = await contractme.read.totalSupply()
    console.log(result)

    try {
      await contractme.write.setMinter(["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"])

      const { request } = await clientPublic.simulateContract({
        account: address[0] as Address,
        address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
        abi: usdeAbi,
        functionName: 'mint',
        args: ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 1],
      })
      const hash = await clientWallet.writeContract(request)
      console.log(hash)
      const result = await contractme.read.totalSupply()
      console.log(result)
      
    } catch (error: any) {
      const revertData = error;
      console.log("Custom Error:", revertData);
    }
}

testme()

