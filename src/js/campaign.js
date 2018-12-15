CampaignDetails = {
    web3Provider: null,
    contracts: {},

    init: function () {
        localStorage.setItem("idCampaignToDisplay", window.location.href.split("?id=")[1]);

        return CampaignDetails.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            CampaignDetails.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            CampaignDetails.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(CampaignDetails.web3Provider);

        return CampaignDetails.initContract();
    },

    initContract: function () {
        $.getJSON('Funding.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FundingArtifact = data;
            CampaignDetails.contracts.Funding = TruffleContract(FundingArtifact);

            // Set the provider for our contract
            CampaignDetails.contracts.Funding.setProvider(CampaignDetails.web3Provider);
            return CampaignDetails.displayCampaign();
        });
        return CampaignDetails.displayTransaction();
    },
    bindEvents:function (){
        $(document).on('click', '#donate-btn', CampaignDetails.transferToDonate);
    },
    transferToDonate: function(){
        event.preventDefault();
        return window.location.href="donate.html?id=" + localStorage.getItem("idCampaignToDisplay");
    },

    displayCampaign: function () {
        const node = new Ipfs()
        node.once('ready', () => {
            var idCampaign = localStorage.getItem("idCampaignToDisplay");
            var fundingInstance;
            CampaignDetails.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;

                fundingInstance.getCampaign.call(idCampaign)
                    .then(function (campaign) {
                        // SC returns campaign[ id, creator's username, numOfToken, numOfTrans, ipfsHash]
                        // get data from cat ipfs
                        node.files.cat(web3.toAscii(campaign[4]), function (err, data) {
                            if (err) {
                                console.error('Error - ipfs files cat', err, data);
                            }
                            localStorage.setItem("campaignDetailsData", data.toString());

                            // creator username
                            var creatorUsername = document.getElementById("campaign-createdUsername");
                            creatorUsername.innerText += web3.toAscii(campaign[1]);
                            // number of tokens
                            var numOfTokens = document.getElementById("campaign-tokens");
                            numOfTokens.innerText += campaign[2].toNumber();
                            //number of transactions
                            document.getElementById("numOfTrans").innerHTML = campaign[3].toNumber();
                            // get data from ipfs hash
                            var jsonInfo = JSON.parse(localStorage.getItem("campaignDetailsData"));
                            //created date
                            var createdDate = document.getElementById("campaign-createdDate");
                            createdDate.innerText = jsonInfo.createdDate;
                            // nameOfCampaign 
                            var nameOfCampaign = document.getElementById("campaign-name");
                            nameOfCampaign.innerText = jsonInfo.nameOfCampaign;
                            //id campaign
                            var idCampaign = document.getElementById("campaign-name");
                            idCampaign.innerText += ' (#' + parseInt(campaign[0].toNumber()+1) + ')';
                            // description 
                            var description = document.getElementById("campaign-description");
                            description.innerText = jsonInfo.description;
                        })
                    })
            }).catch(function (error) {
                console.log(error);
            });

        });
        return CampaignDetails.bindEvents();
    },

    displayTransaction: function () {
        const node = new Ipfs()
        node.once('ready', () => {
            console.log('Online status: ', node.isOnline() ? 'online' : 'offline');
            var idCampaign = localStorage.getItem("idCampaignToDisplay");
            var fundingInstance;
            // Display transaction
            CampaignDetails.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;
                // get Array of transaction
                return fundingInstance.getTransactionListOfCamp.call(idCampaign)
                    .then(function (arrTransaction) {
                        return arrTransaction.length;
                    }).then(function (lengOfTrans) {
                        console.log(lengOfTrans);
                        // display each transaction
                        // start from index 1 
                        for (var i = 1; i < lengOfTrans; i++) {
                            fundingInstance.getTransactionById.call(i).then(function (transaction) {
                                // SC returns [ id, fromUsername, toIdCamp, numOfToken, ipfsHash ] 
                                node.files.cat(web3.toAscii(transaction[4]), function (err, data) {
                                    if (err) {
                                        return console.error('Error - ipfs files cat', err, data);
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
                                    if (transaction[3] > 0) {
                                        row.classList.add("input");
                                        col3.appendChild(document.createTextNode('+' + transaction[3].toNumber()));
                                    } else if (transaction[3] < 0) {
                                        row.classList.add("output");
                                        col3.appendChild(document.createTextNode(transaction[3].toNumber()));
                                    }

                                    // data from ipfs hash
                                    var jsonData = JSON.parse(localStorage.getItem("transactionDataById"));

                                    // date
                                    col4.appendChild(document.createTextNode(jsonData.onDate));
                                    // message
                                    col5.appendChild(document.createTextNode(jsonData.message));

                                    // append to row
                                    row.appendChild(col1);
                                    row.appendChild(col2);
                                    row.appendChild(col3);
                                    row.appendChild(col4);
                                    row.appendChild(col5);
                                    document.getElementById("campaigns-tbody").appendChild(row);
                                })
                            })
                        }

                    }).catch(function (error) {
                        console.log(error);
                    });
            })
        });
    },
};

$(function () {
    $(window).load(function () {
        CampaignDetails.init();
    });
});