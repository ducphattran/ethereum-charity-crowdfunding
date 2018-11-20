App = {
    web3Provider: null,
    contracts: {},
    account: {} ,

    init: function () {
        if (typeof(Storage) !== "undefined") {
            // Store
            App.account.address = sessionStorage.getItem("address");
            App.account.username = sessionStorage.getItem("username");
            App.account.password = sessionStorage.getItem("password");
            App.account.token = sessionStorage.getItem("token");
        } else {
            App.account = {};
        }
        return App.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        return App.initContract();
    },

    initContract: function () {
        $.getJSON('Funding.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FundingArtifact = data;
            App.contracts.Funding = TruffleContract(FundingArtifact);

            // Set the provider for our contract
            App.contracts.Funding.setProvider(App.web3Provider);
            // return App.showListUsers();
        });
        return App.bindSession();
    },

    hexToBytes: function(str_data,bytes){
        var hexData = web3.toHex(str_data);
        var length = hexData.length;
        return web3.padRight(hexData, bytes*2 + 2);
    },

    bindSession: function(){
        if(App.account.username !== null && App.account.password !== null){
            console.log()
            document.getElementById("welcome-user").innerHTML = 
            '<li class="nav-item mr-2">' +
            '<a href="/profile.html" class="btn btn-info text-light">Welcome, ' +
            // '<strong>' +
            web3.toAscii(App.account.username) +
            // '</strong>'+
            '</a>' +
            '</li>';
        }
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});