Transaction = {
	web3Provider: null,
	contracts: {},

	init: function () {
		localStorage.setItem("idCampaignToDisplay", window.location.href.split("?id=")[1]);

		return Transaction.initWeb3();
	},

	initWeb3: function () {
		// Is there an injected web3 instance?
		if (typeof web3 !== 'undefined') {
			Transaction.web3Provider = web3.currentProvider;
		} else {
			// If no injected web3 instance is detected, fall back to Ganache
			Transaction.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
		}
		web3 = new Web3(Transaction.web3Provider);

		return Transaction.initContract();
	},

	initContract: function () {
		$.getJSON('Funding.json', function (data) {
			// Get the necessary contract artifact file and instantiate it with truffle-contract
			var FundingArtifact = data;
			Transaction.contracts.Funding = TruffleContract(FundingArtifact);

			// Set the provider for our contract
			Transaction.contracts.Funding.setProvider(Transaction.web3Provider);
			return Transaction.displayCampaign();
		});

	},

	displayCampaign: function () {
		var idCampaign = localStorage.getItem("idCampaignToDisplay");
		var fundingInstance;
		// get length of array transactions
		Transaction.contracts.Funding.deployed().then(function (instance) {
			fundingInstance = instance;
			// get Array of transaction
			return fundingInstance.getTransactionListOfCamp.call(idCampaign)
				.then(function (arrTransaction) {
					// return localStorage.setItem("lengOfTrans", arrTransaction.length);
					return arrTransaction.length;
				}).then(function (lengOfTrans) {
					console.log(lengOfTrans);
					// display each transaction
					Transaction.contracts.Funding.deployed().then(function (instance) {
						fundingInstance = instance;
						for (var i = 0; i < lengOfTrans; i++) {
							fundingInstance.getTransactionById.call(i).then(function (transaction) {
								// SC returns [ id, fromUsername, toIdCamp, numOfToken, ipfsHash ]
								console.log(transaction[0].toNumber());
								const node = new Ipfs({
									repo: 'ipfs-' + Math.random()
								})
								node.once('ready', () => {
									console.log('Online status: ', node.isOnline() ? 'online' : 'offline');
									node.cat(web3.toAscii(transaction[4]), function (err, data) {
										if (err) {
											console.error('Error - ipfs files cat', err, data);
										}
										localStorage.setItem("transactionDataById", data.toString());
						
										var row = document.createElement("tr");
										var col1 = document.createElement("td");
										var col2 = document.createElement("td");
										var col3 = document.createElement("td");
										var col4 = document.createElement("td");
										var col5 = document.createElement("td");
										// append to col
										// id
										col1.appendChild(document.createTextNode(transaction[0].toNumber()));
										// fromUsername 
										col2.appendChild(document.createTextNode(web3.toAscii(transaction[1])));
										// numOfToken
										col3.appendChild(document.createTextNode(transaction[3].toNumber()));
						
										// data from ipfs hash
										var jsonInfo = JSON.parse(localStorage.getItem("transactionDataById"));
										console.log(jsonInfo);
										// date
										col4.appendChild(document.createTextNode(jsonInfo.onDate));
										// message
										col5.appendChild(document.createTextNode(jsonInfo.message));
						
										// append to row
										row.appendChild(col1);
										row.appendChild(col2);
										row.appendChild(col3);
										row.appendChild(col4);
										row.appendChild(col5);
										document.getElementById("campaigns-tbody").appendChild(row);
									})
									// CampaignDetails.catDataFromIpfs(web3.toAscii(transaction[4]), "transactionDataById");
								})

							})
						}
					})
				}).catch(function (error) {
					console.log(error);
				});
		});

		
	},

};
$(function () {
	$(window).load(function () {

		Transaction.init();
	});
});