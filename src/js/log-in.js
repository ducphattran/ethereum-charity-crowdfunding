LogIn = {
    web3Provider: null,
    contracts: {},

    init: function () {
        
        return LogIn.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            LogIn.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            LogIn.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(LogIn.web3Provider);

        return LogIn.initContract();
    },

    initContract: function () {
        $.getJSON('Funding.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FundingArtifact = data;
            LogIn.contracts.Funding = TruffleContract(FundingArtifact);

            // Set the provider for our contract
            LogIn.contracts.Funding.setProvider(LogIn.web3Provider);

        });

        return LogIn.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '#btn-log-in', LogIn.checkAuth);
    },

    checkAuth: function (event) {
        event.preventDefault();
        //get input value
        var username = document.getElementById("username").value;
        var password = document.getElementById("pwd").value;
        password = web3.sha3(password);
        //Convert to Bytes
        username = window.App.hexToBytes(username, 16);
        password = window.App.hexToBytes(password, 32);
        var fundingInstance;
        //validate
        LogIn.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;
                return fundingInstance.checkAuth.call(username, password);
            }).then(function (result) {
                if (result) {
                    if (typeof(Storage) !== "undefined") {
                        // Store
                        sessionStorage.setItem("username", username);
                        sessionStorage.setItem("password", password);
                        
                    } else {
                        document.write("Sorry, your browser does not support Web Storage...");
                    }
                } else {
                    var error_txt = document.getElementById("error_txt");
                    error_txt.innerHTML =
                        "<strong>Failed!</strong> Incorrect username or password";
                    error_txt.classList.remove("d-none");
                }
            })
            .catch(function (err) {
                console.log(err);
            });
        return LogIn.saveToSession(username,password);    
    },

    saveToSession: function (username,password) {
        //get profile
        LogIn.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;
                return fundingInstance.getUserProfile.call(username, password);
            }).then(function (result) {
                console.log(result);
                sessionStorage.setItem("address", result[0]);
                sessionStorage.setItem("username", result[1]);
                sessionStorage.setItem("password", result[2]);
                sessionStorage.setItem("token",result[3].toNumber());
            })
            .catch(function (err) {
                console.log(err);
            });
        return  window.location.href = "/profile.html";
    }

};

$(function () {
    $(window).load(function () {
        LogIn.init();
    });
});
