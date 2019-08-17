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
Firstly, open the terminal and run the below command to install dependencies:

```
npm install
```

If you had any errors while running above command about **node-gyp**, **python** and **Windows Build Tool**, then run these following commands:

* To install **node-gyp**
```
npm install -g node-gyp
```

* To install **Windows Build Tool**
```
npm install --global --production windows-build-tools
```

# MetaMask and the network
To get this project run , you must have an account (or a wallet) on the ethereum network to make transactions. There are two types of networks for you to choose:
1. For local network (like Ganache)
2. Ropsten (a testnet on Ethereum platform)

With MetaMask, when you first access it , you should insert the **MNEMONIC** which you can get from **Ganache** or inside the **truffle-config.js** / **truffle.js** which I created (for Ropsten).

# Deployment
When you got a wallet, then type these command which provided by **Truffle** to compile and migrate the **Smart Contract (SC)**  to the network:

* To compile the **SC**
```
truffle compile
```
* To migrate the **SC** to blockchain network
```
truffle migrate
```
** If you use Ropsten network**
```
truffle migrate --network ropsten
```
(you can put an option "--reset" to override the exist SC on the network with same address)

When you fisnished to migrate the SC, run this command to open the Lite Server:
```
npm run dev
```

# Gas
Whenever a transaction was made, it includes a transaction fee (gas) which was seen as rewards for those miners in the blockchain network. There might be problems about the gas when migrating the **Smart Contract**. In this case, adjust the value of gas in **truffle-config.js** / **truffle.js** to deploy the **SC** to the network.

___
