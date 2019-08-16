# Description
This school project is created for people to fund for charity campaigns on the ethereum blockchain network. 
This project also uses IPFS to store data to local storage and session for transactions.
People can transfer **Ether** to **Token** into their account for donation and it can be reverse.

# Before the installation
This project is bulit along with other sources, so please make sure to install these platforms / sources:
* Npm and Nodejs
* Truffle Framework
* Ganache (for local test)
* MetaMask (An Extension on Chrome)
* Web3
* truffle-hdwallet-provider
* IPFS
* Lite Server

# Installation
After finishing to pull the project, run this command to install dependencies:

```
npm install
```

If you had any error while running above command about **node-gyp**, **python** and **Windows Build Tool**, then run these following commands:

* To install **node-gyp**
```
npm install -g node-gyp
```

* To install **Windows Build Tool**
```
npm install --global --production windows-build-tools
```

# MetaMask and the network
To get this project run , you must have an account (or a wallet) on the ethereum network to make transactions. There are two types of network for you to choose:
1. Local ( Ganache)
2. Ropsten (Ethereum testnet)

With MetaMask, when you first access it , you should insert the **MNEMONIC** which you can get from Ganache or inside the **truffle-config.js** / **truffle.js** (if you use Ropsten).

# Deployment
When you got a wallet, then type these command which provided by **Truffle** to compile and migrate the **Smart Contract (SC)**  to blockchain network:

* To compile the **SC**
```
truffle compile
```
* To migrate the **SC** to network
```
truffle migrate
```

When you fisnished to migrate the SC, run this command to open the Lite Server:
```
npm run dev
```

___
