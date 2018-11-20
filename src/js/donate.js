Donate = {
    web3Provider: null,
    contracts: {},
    init: function () {
        var idCampaign = window.location.href.split("?id=")[1];
        document.getElementById("id-campaign").value = idCampaign;
        return Donate.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            Donate.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            Donate.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(Donate.web3Provider);

        return Donate.initContract();
    },

    initContract: function () {
        $.getJSON('Funding.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FundingArtifact = data;
            Donate.contracts.Funding = TruffleContract(FundingArtifact);

            // Set the provider for our contract
            Donate.contracts.Funding.setProvider(Donate.web3Provider);

            // return App.showLogInForm();
        });

        return Donate.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '#btn-donate', Donate.donate);
    },

    donate: function(){
        var fundingInstance;
        var account;
        var tokens = document.getElementById("amount").value;
        var idCampaign = window.location.href.split("?id=")[1];
        
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }
            account = accounts[0];
        });
        App.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            // Execute adopt as a transaction by sending account web3.padRight(web3.fromAscii("123"), 34)
            return fundingInstance.donate(
                tokens, idCampaign,window.App.account.username, window.App.account.password,
                {
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
        Donate.init();
    });
});