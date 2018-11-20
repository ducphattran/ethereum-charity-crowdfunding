App = {
    web3Provider: null,
    contracts: {},

    init: function () {
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

            // return App.showLogInForm();
        });

        return App.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '.btn-log-in', App.verifyInfo);
        $(document).on('click', '.btn-transfer', App.transfer);
        $(document).on('click', '#btn-open-log-in', App.showLogInForm);
        $(document).on('click', '#btn-open-transfer', App.showTransferForm);
    },

    showProfile: function (address,username) {
        document.getElementById("profile-section").className ="";
        document.getElementById("transfer-section").className = "hidden";
        document.getElementById("log-in-section").className = "hidden";

        document.getElementById("profile_address").innerHTML += 
        "<strong>Address: </strong>" + address;
        document.getElementById("profile_username").innerHTML += 
        "<strong>Username: </strong>" + username;

        document.getElementById("btn-open-transfer").className = "btn btn-info";

        var fundingInstance;
        App.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            // Execute adopt as a transaction by sending account web3.padRight(web3.fromAscii("123"), 34)
            return fundingInstance.getTokenBalanceByAddress.call();
        }).then(function (result) {
            console.log(web3.fromWei(result.toNumber(), "finney" ));
            document.getElementById("profile_balance").innerHTML += 
            "<strong>Balance Token:</strong>" + web3.fromWei(result.toNumber(), "finney" )*1000000000000 + " Token (Ether)" ;
        });
    },

    transfer: function(){
        var fundingInstance;
        var account;
        var amount = document.getElementById("amount").value;
        
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }
            account = accounts[0];
        });
        App.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            // Execute adopt as a transaction by sending account web3.padRight(web3.fromAscii("123"), 34)
            return fundingInstance.toToken({
                from: account,
                gas: 3000000,
                gasPrice: 100,
                value: amount,
                // value: web3.toWei(amount.toNumber(), "finney" ),
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

    showLogInForm: function () {
        document.getElementById("log-in-section").className = "";
        document.getElementById("transfer-section").className = "hidden";
        document.getElementById("profile-section").className ="hidden";
    },

    showTransferForm: function () {
        document.getElementById("transfer-section").className = "";
        document.getElementById("log-in-section").className = "hidden";
        document.getElementById("profile-section").className ="hidden";
    },

    verifyInfo: function (event) {
        event.preventDefault();
        var fundingInstance;
        var inputUsername = document.getElementById("username").value.toString().toLowerCase();
        var inputPassword = document.getElementById("pwd").value.toString().toLowerCase();

        App.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            
            return fundingInstance.getUserByUsername.call(web3.fromAscii(inputUsername,34));
        }).then(function (user) {
            console.log(user);
            console.log(user[1]);

            console.log(user[2]);
            console.log(web3.fromAscii(inputPassword,34));
            if (user[2] === web3.padRight(web3.fromAscii(inputPassword), 34) ){
                return App.showProfile(user[1],inputUsername);
            }else{
                document.getElementById("log-in-error").innerText = "Username or Password is not correct";
            }
        });
    },

    createUser: function (username, password) {
        console.log("CREATING USER....");

        var fundingInstance;
        var account;
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }
            account = accounts[0];
        });

        App.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            // Execute adopt as a transaction by sending account web3.padRight(web3.fromAscii("123"), 34)
            return fundingInstance.createUser(web3.padRight(web3.fromAscii(username), 34), web3.padRight(web3.fromAscii(password), 34), {
                from: account,
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
    }

};

$(function () {
    $(window).load(function () {
        App.init();
    });
});