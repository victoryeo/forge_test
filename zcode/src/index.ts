import { createPublicClient, createWalletClient, http } from "viem";
import { localhost, mainnet, anvil } from "viem/chains";
import { MetaMaskSDK, MetaMaskSDKOptions } from "@metamask/sdk"
import { createTestClient, Address } from 'viem'
import { foundry } from 'viem/chains'
import { getContract, defineChain, decodeErrorResult } from 'viem'
import { usdeAbi } from "./usdeAbi";
import { stakingVaultAbi, bytecode as stakingVaultBytecode } from "./stakingVault";
import { privateKeyToAccount } from "viem/accounts";
import { type GetBlockNumberErrorType } from 'viem'
import { erc4626Abi } from "viem";
import { myerc4626Abi } from "./erc4626";

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
if (ethereum != undefined) {
  const res1 = ethereum.request({ method: "eth_requestAccounts", params: [] })
  console.log("res1", res1)
}

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
      http: ['http://localhost:8545'],
    },
  },
})

const clientPublic = createPublicClient({chain: customChain, transport: http()})

const accountMe = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')

const accountStaker = privateKeyToAccount
('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')

const clientWallet = createWalletClient({
  account: accountMe,
  chain: customChain,
  transport: http('http://localhost:8545')
})
const clientWalletStaker = createWalletClient({
  account: accountStaker,
  chain: customChain,
  transport: http('http://localhost:8545')
})
const clientTest = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport: http(), 
})

// deployed USDE contract address
const USDE_CONT_ADDR = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
// staker account adress
const STAKER_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"

const contractUsde = getContract({
  address: USDE_CONT_ADDR,
  abi: usdeAbi,
  // 1a. Insert a single client
  // 1b. Or public and/or wallet clients
  client: { public: clientPublic, wallet: clientWallet }
})
const contractUsdeStaker = getContract({
  address: USDE_CONT_ADDR,
  abi: usdeAbi,
  // 1a. Insert a single client
  // 1b. Or public and/or wallet clients
  client: { public: clientPublic, wallet: clientWalletStaker }
})

const testme = async() => { 
    const blockNumber = await clientPublic.getBlockNumber() 
    console.log('blockNumber', blockNumber)

    //let address: string[] = []
    const address: string[] = await clientWallet.getAddresses()
    console.log(address[0], address[1])

    const mine = await clientTest.mine({ blocks: 1 })
    console.log(mine)

    const result = await contractUsde.read.totalSupply()
    console.log('supply', result)

    try {
      // set usde minter
      await contractUsde.write.setMinter([address[0]])

      // mint usde
      const { request } = await clientPublic.simulateContract({
        account: address[0] as Address,
        address: USDE_CONT_ADDR,
        abi: usdeAbi,
        functionName: 'mint',
        args: [address[0], 4],
      })
      const hash = await clientWallet.writeContract(request)

      //alternative implementation
      //const hash = await contractme.write.mint([STAKER_ADDR, 1])
      console.log('hash', hash)

      const result = await contractUsde.read.totalSupply()
      console.log("total supply", result)

      const result2 = await contractUsde.read.balanceOf([address[0]])
      console.log("address 0 balance", result2)
      
      // set allowances of the owner spender
      const hash2 = await contractUsde.write.approve([
        address[0], 2])
      console.log('hash', hash2)

      // transfer from the account that is minted with erc20 token 
      // to another account
      const hash3 = await contractUsde.write.transferFrom([
        address[0], 
        STAKER_ADDR, 1])
      console.log("hash", hash3)
      const result22 = await contractUsde.read.balanceOf([STAKER_ADDR])
      console.log("staker balance", result22)
      
      // get usde contract events
      const logs = await clientPublic.getContractEvents({ 
        abi: usdeAbi 
      })
      //console.log(logs)
      const logs2 = await clientPublic.getContractEvents({ 
        address: USDE_CONT_ADDR,
        abi: usdeAbi,
        eventName: 'Transfer',
        args: {
          from: address[0],
          to: STAKER_ADDR
        },
        fromBlock: BigInt(0),
        toBlock: BigInt(163350)
      })
      //console.log(logs2)

      const hash4 = await clientWallet.deployContract({
        abi: stakingVaultAbi,
        account: address[0] as Address,
        args: [USDE_CONT_ADDR, address[0], address[0]],
        bytecode: stakingVaultBytecode,
      })
      console.log("hash", hash4)
      
      const transactionReceipt = await clientPublic.waitForTransactionReceipt( 
        { hash: hash4 }
      )
      // print staked usde contract address
      console.log("contractAddress", transactionReceipt.contractAddress)
      const stakingVaultAddress = transactionReceipt.contractAddress

      const contractStakingVault = getContract({
        address: stakingVaultAddress as Address,
        abi: stakingVaultAbi,
        // 1a. Insert a single client
        // 1b. Or public and/or wallet clients
        client: { public: clientPublic, wallet: clientWallet }
      })
      // set usde minter
      await contractUsde.write.setMinter([address[0]])

      // set allowances of the staker spender
      const hash5 = await contractUsde.write.approve([stakingVaultAddress, 1])
      console.log("hash", hash5)
      const hash6 = await contractStakingVault.write.transferInRewards(["1"])
      console.log('hash', hash6)

      const result3 = await contractUsdeStaker.read.totalSupply()
      console.log('supply', result3)

      // mint usde tokens
      const hash7 = await contractUsde.write.mint([STAKER_ADDR, 2])
      console.log(hash7)
      const result23 = await contractUsde.read.balanceOf([STAKER_ADDR])
      console.log("balance staker", result23)
      let logs3 = await clientPublic.getContractEvents({ 
        abi: usdeAbi 
      })
      console.log('logs3', logs3)
      //required for staking vault deposit to work
      await contractUsde.write.approve([stakingVaultAddress, 2])
      
      //let hash11 = await contractStakingVault.write.approve([STAKER_ADDR, 1])
      //hash11 = await contractStakingVault.write.approve([stakingVaultAddress, 1])
      //hash11 = await contractStakingVault.write.approve([address[0], 1])

      const theallowance = await contractUsde.read.allowance([address[0], stakingVaultAddress])
      console.log('allowance' ,theallowance)

      console.log(await contractStakingVault.read.balanceOf([STAKER_ADDR]))
      console.log(await contractStakingVault.read.balanceOf([address[0]]))
      // deposit assets to vault and receive ownership of shares to staker
      const hash9 = await contractStakingVault.write.deposit([
        "1", STAKER_ADDR])
      console.log(hash9)

      const bal1 = await contractStakingVault.read.totalSupply()
      console.log("contract supply", bal1)
      const bal2 = await contractStakingVault.read.totalAssets()
      console.log("contract balance", bal2)
      const logs40 = await clientPublic.getContractEvents({ 
        abi: stakingVaultAbi,
        eventName: "EVTESTME",
      })
      console.log("logs40", logs40)

      await contractUsde.write.approve([stakingVaultAddress, 100])
      const theallowance2 = await contractUsde.read.allowance([address[0], stakingVaultAddress])
      console.log('allowance' ,theallowance2)

      const bal3 = await contractStakingVault.read.totalSupply()
      console.log("contract total supply", bal3)
      console.log("total assets ", await contractStakingVault.read.totalAssets())
      console.log("balance ", await contractStakingVault.read.balanceOf([STAKER_ADDR]))
      
      await contractUsde.write.mint([address[0], 1])
      console.log("balance ", await contractStakingVault.read.balanceOf([address[0]]))
      console.log("balance ", await contractUsde.read.balanceOf([address[0]]))

      // mint exactly shares of vault to staker
      const hash11 = await contractStakingVault.write.mint([
        "1", STAKER_ADDR])
      console.log('hash11', hash11)

      //console.log(transactionReceipt1)
      const logs41 = await clientPublic.getContractEvents({ 
        abi: stakingVaultAbi,
        eventName: "EVTESTME",
        /*fromBlock: BigInt(0),
        toBlock: BigInt(163350)*/
      })
      console.log("logs41", logs41)
      
      console.log(await contractStakingVault.read.balanceOf([STAKER_ADDR]))
      console.log(await contractStakingVault.read.balanceOf([address[0]]))

      await contractStakingVault.write.approve([address[0], 100])

      // withdraw asset tokens from vault and to staker and burns shares from staker in vault
      const bal4 = await contractStakingVault.read.totalSupply()
      console.log("contract total supply", bal4)
      const res = await clientPublic.simulateContract({
        account: STAKER_ADDR as Address,
        address: stakingVaultAddress as Address,
        abi: stakingVaultAbi,
        functionName: 'withdraw',
        args: [1, address[0], STAKER_ADDR],
      })
      console.log(res) 
      const hash25 = await clientWalletStaker.writeContract(res.request)

    } catch (error: any) {
      console.warn("errornow")
      const e = error as GetBlockNumberErrorType
      console.log(e)

      /*const decodedError = decodeErrorResult({
        abi: myerc4626Abi ,
        data: "0x6e553f65000000000000000000000000000000000000000000000000000000000000000100000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8",
      });
      console.log(decodedError)*/
      //console.log("Custom Error:", error);
    }
}

testme()

