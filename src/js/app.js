App = {
    web3Provider: null,
    contracts: {},
    account: {},
    ipfsHash: null,
    init: function () {
        if (typeof (Storage) !== "undefined") {
            // Store
            App.account.address = sessionStorage.getItem("address");
            App.account.username = sessionStorage.getItem("username");
            App.account.password = sessionStorage.getItem("password");
            App.account.token = sessionStorage.getItem("token");
            App.account.ipfsHash = sessionStorage.getItem("ipfsHash");
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

    hexToBytes: function (str_data, bytes) {
        var hexData = web3.toHex(str_data);
        var length = hexData.length;
        if (length > 66 && bytes === "bytes") {
            return hexData;
        } else {
            return web3.padRight(hexData, bytes * 2 + 2);
        }
    },

    bindSession: function () {
        if (App.account.username !== null && App.account.password !== null) {
            // Add welcome
            document.getElementById("welcome-user").innerHTML =
                '<li class="nav-item mr-2">' +
                '<a href="/profile.html" id="btn-profile" class="btn btn-info text-light">Welcome, ' +
                web3.toAscii(App.account.username) +
                '</a>' +
                '</li>' +
                '<li class="nav-item mr-2">' +
                '<a href="/profile.html" id="btn-sign-out" class="btn btn-info text-light">Log Out' +
                '</a>' ;
            var nav = document.getElementById("nav");
            // add campaign nav-link    
            var campaignLiTag = document.createElement("li");
            campaignLiTag.className = "nav-item active";
            var campaignATag = document.createElement("a");
            campaignATag.className = "nav-link";
            campaignATag.href = "/campaign.html";
            campaignATag.innerText = "Create Campaign";
            campaignLiTag.appendChild(campaignATag);
            nav.appendChild(campaignLiTag);
            // add transfer nav-link    
            var transferLiTag = document.createElement("li");
            transferLiTag.className = "nav-item active";
            var transferATag = document.createElement("a");
            transferATag.className = "nav-link";
            transferATag.href = "/transfer.html";
            transferATag.innerText = "Exchange Token";
            transferLiTag.appendChild(transferATag);
            nav.appendChild(transferLiTag);
        }else{
            
        }
    },

    addDataToIpfs: function (jsonData) {
        const node = new Ipfs({
            repo: 'ipfs-' + Math.random()
        })
        node.once('ready', () => {
            node.files.add(new node.types.Buffer(JSON.stringify(jsonData)), function (error, filesAdded) {
                localStorage.setItem("ipfsHash", filesAdded[0].hash.toString());
            });

        })
    },

    catDataFromIpfs: function (ipfsHash) {
        const node = new Ipfs({
            repo: 'ipfs-' + Math.random()
        })
        node.once('ready', () => {
            node.files.cat(ipfsHash, function (err, data) {
                if (err) {
                    return console.error('Error - ipfs files cat', err, res)
                }
                var jsondata = data.toString();
                localStorage.setItem("dataFromIpfs", jsondata);
            })
        })
    },

};

$(function () {
    $(window).load(function () {
        App.init();
    });
});