Campaign = {
    web3Provider: null,
    contracts: {},

    init: function () {
        var campUsername = document.getElementById("campaign-username");
        if (campUsername) {
            campUsername.value = web3.toAscii(window.App.account.username);
        }
        Date.prototype.toDateInputValue = (function() {
            var local = new Date(this);
            local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
            return local.toJSON().slice(0,10);
        });
        document.getElementById('datePicker').value = new Date().toDateInputValue();
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

};

$(function () {
    $(window).load(function () {
        Campaign.init();
    });
});