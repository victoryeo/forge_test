## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**


forge create --rpc-url localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 ./contracts/USDe.sol:USDe --constructor-args 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb9226

forge install OpenZeppelin/openzeppelin-contracts --no-commit

forge install OpenZeppelin/openzeppelin-contracts-upgradeable --no-commit

forge install openzeppelin-contracts-05=OpenZeppelin/openzeppelin-contracts@v2.5.0 openzeppelin-contracts-06=OpenZeppelin/openzeppelin-contracts@v3.4.0 openzeppelin-contracts-08=OpenZeppelin/openzeppelin-contracts@v4.8.3 --no-commit

forge remove OpenZeppelin/openzeppelin-contracts  -f

cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "mint(address, uint256)()" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 10 --rpc-url localhost:8545

cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "totalSupply()(uint256)" --rpc-url localhost:854