Campaign = {
    web3Provider: null,
    contracts: {},

    init: function () {
        var campUsername = document.getElementById("campaign-username");
        if (campUsername) {
            campUsername.value = web3.toAscii(window.App.account.username);
        }

        //
        const node = new Ipfs({
            repo: 'ipfs-' + Math.random()
        })
        node.once('ready', () => {
            console.log('Online status: ', node.isOnline() ? 'online' : 'offline')
            // You can write more code here to use it. Use methods like 
            // node.files.add, node.files.get. See the API docs here:
            // https://github.com/ipfs/interface-ipfs-core
            var obj = {
                "id" : 3,
                "name": "ryan"
            };
            node.files.add(new node.types.Buffer(JSON.stringify(obj)), (err, filesAdded) => {
                if (err) {
                    return console.error('Error - ipfs add', err, res)
                }

                filesAdded.forEach((file) => console.log('successfully stored', file.hash))
            })

            node.files.cat('Qmak2PftRvJYyZJkWH5ud9J48RXvD46DUJeH2ovbD95qNm', function (err, data) {
                if (err) {
                    return console.error('Error - ipfs files cat', err, res)
                }
                var jsondata = data.toString();
                jsondata = JSON.parse(jsondata);
                console.log(jsondata)
            })
        })

        return Campaign.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            Campaign.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            Campaign.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(Campaign.web3Provider);

        return Campaign.initContract();
    },

    initContract: function () {
        $.getJSON('Funding.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FundingArtifact = data;
            Campaign.contracts.Funding = TruffleContract(FundingArtifact);

            // Set the provider for our contract
            Campaign.contracts.Funding.setProvider(Campaign.web3Provider);

            return Campaign.showCampaigns();
        });

        return Campaign.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '#btn-create', Campaign.create);
    },

    create: function (event) {
        event.preventDefault();
        var fundingInstance;
        var account;

        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }
            account = accounts[0];
        });
        Campaign.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            // Execute adopt as a transaction by sending account 
            return fundingInstance.createCampaign(window.App.account.username, {
                from: account,
                gas: 3000000,
                gasPrice: 100,
            });
        }).then(function (result) {
            console.log(result);

            if (result.receipt.status === "0x0") {
                alert("Transaction failed!");
            } else {
                alert("Transaction succeeded!");
            }
        }).catch(function (error) {
            console.log(error.message);
        });
    },

    showCampaigns: function () {
        var fundingInstance;

        Campaign.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            return fundingInstance.getCampaignCount.call();

        }).then(function (length) {
            console.log("length: " + length.toString());
            return lengthOfCampaigns = length.toString();

        }).then(function () {
            Campaign.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;
                for (var i = 0; i < lengthOfCampaigns; i++) {

                    fundingInstance.getCampaign.call(i).then(function (campaign) {
                        var row = document.createElement("tr");
                        var col1 = document.createElement("td");
                        var col2 = document.createElement("td");
                        var col3 = document.createElement("td");
                        var col4 = document.createElement("td");
                        var col5 = document.createElement("td");
                        var donateBtn = document.createElement("a");
                        donateBtn.className = "btn btn-primary text-light";
                        donateBtn.innerText = "Donate";
                        donateBtn.href = "/donate.html?id=" + campaign[0].toNumber();

                        col1.appendChild(document.createTextNode(campaign[0].toNumber()));
                        col2.appendChild(document.createTextNode(campaign[1]));
                        col3.appendChild(document.createTextNode(campaign[2].toNumber()));
                        col4.appendChild(document.createTextNode(campaign[3].toNumber()));
                        col5.appendChild(donateBtn);

                        row.appendChild(col1);
                        row.appendChild(col2);
                        row.appendChild(col3);
                        row.appendChild(col4);
                        row.appendChild(col5);
                        document.getElementById("campaigns-tbody").appendChild(row);
                        console.log(campaign);
                    });

                }
            });
        });

    }

};

$(function () {
    $(window).load(function () {
        Campaign.init();
    });
});