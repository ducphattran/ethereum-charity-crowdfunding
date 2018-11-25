Index = {
    web3Provider: null,
    contracts: {},

    init: function () {
        return Index.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            Index.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            Index.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(Index.web3Provider);

        return Index.initContract();
    },

    initContract: function () {
        $.getJSON('Funding.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FundingArtifact = data;
            Index.contracts.Funding = TruffleContract(FundingArtifact);

            // Set the provider for our contract
            Index.contracts.Funding.setProvider(Index.web3Provider);

            return Index.showCampaigns();
        });

    },

    showCampaigns: function () {
        var fundingInstance;

        Index.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            return fundingInstance.getCampaignCount.call();

        }).then(function (length) {
            console.log("length: " + length.toString());
            document.getElementById("numOfCamps").innerText = length;
            return lengthOfCampaigns = length.toString();

        }).then(function () {
            Index.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;
                // display all except the 1st campaign in SC
                for (var i = 1; i < lengthOfCampaigns; i++) {

                    fundingInstance.getCampaign.call(i).then(function (campaign) {
                        // SC returns [id, creator's address, numOfToken, numOfTrans, ipfsHash]
                        Index.display(campaign);
                    });

                }
            });
        });

    },
    display: function (campaign) {
        // Get jsonData from ipfsHash
        const node = new Ipfs({
            repo: 'ipfs-' + Math.random()
        })
        node.once('ready', () => {

            node.files.cat(web3.toAscii(campaign[4]), function (err, data) {
                if (err) {
                    return console.error('Error - ipfs files cat', err, res)
                }

                var row = document.createElement("tr");
                var col1 = document.createElement("td");
                var col2 = document.createElement("td");
                var col3 = document.createElement("td");
                var col4 = document.createElement("td");
                var col5 = document.createElement("td");
                var col6 = document.createElement("td");
                // donate button
                var donateBtn = document.createElement("a");
                donateBtn.className = "btn btn-primary text-light btnDonate";
                donateBtn.innerText = "Donate";
                donateBtn.href = "/donate.html?id=" + campaign[0].toNumber();
                // append to col
                // id
                col1.appendChild(document.createTextNode(campaign[0].toNumber()));
                // tokens - numOfTokens
                col4.appendChild(document.createTextNode(campaign[3].toNumber()));
                // donations - numOfTrans
                col5.appendChild(document.createTextNode(campaign[3].toNumber()));
                // donateBtn
                col6.appendChild(donateBtn);
                // data from ipfs hash
                var jsonData = JSON.parse(data.toString());
                console.log(jsonData);

                // name of campaign
                var nameOfCampaign = document.createElement("a");
                nameOfCampaign.href = "/campaign-in-details.html?id=" + campaign[0].toNumber();
                nameOfCampaign.innerText = jsonData.nameOfCampaign;
                col2.appendChild(nameOfCampaign);

                // created date
                col3.appendChild(document.createTextNode(jsonData.dateCreated));

                // append to row
                row.appendChild(col1);
                row.appendChild(col2);
                row.appendChild(col3);
                row.appendChild(col4);
                row.appendChild(col5);
                row.appendChild(col6);
                document.getElementById("campaigns-tbody").appendChild(row);
            })
        })
    },

};

$(function () {
    $(window).load(function () {
        Index.init();
    });
});