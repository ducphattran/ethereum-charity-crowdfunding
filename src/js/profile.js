Profile = {
    web3Provider: null,
    contracts: {},

    init: function () {
        return Profile.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            Profile.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            Profile.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(Profile.web3Provider);

        return Profile.initContract();
    },

    initContract: function () {
        $.getJSON('Funding.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FundingArtifact = data;
            Profile.contracts.Funding = TruffleContract(FundingArtifact);

            // Set the provider for our contract
            Profile.contracts.Funding.setProvider(Profile.web3Provider);

            return Profile.getProfile();
        });

        return Profile.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '#btn-profile', Profile.getProfile);
        $(document).on('click', '#btn-sign-out', Profile.signOut);
    },

    getProfile: function () {
        const node = new Ipfs({
            repo: 'ipfs-' + Math.random()
        })
        node.once('ready', () => {
            node.files.cat(web3.toAscii(window.App.account.ipfsHash), function (err, data) {
                if (err) {
                    return console.error('Error - ipfs files cat', err, res)
                }
                var jsondata = data.toString();
                console.log(jsondata);
                localStorage.setItem("profileFromIpfs", jsondata);
            })

            // get data from App.account
            var username = web3.toAscii(window.App.account.username);
            var address = window.App.account.address;
            var token = window.App.account.token;
            var infoJson = JSON.parse(localStorage.getItem("profileFromIpfs"));
            // Display 
            document.getElementById("fullname").innerText = infoJson.fullname;
            document.getElementById("email").innerText = infoJson.email;
            document.getElementById("address").innerText = address;
            document.getElementById("username").innerText = username;
            document.getElementById("token").innerText = token;

        })
        return Profile.bindEvents();
    },

    signOut: function (event) {
        event.preventDefault();
        sessionStorage.clear();
        return window.location.href = "/log-in.html";
    },

};

$(function () {
    $(window).load(function () {
        Profile.init();
    });
});