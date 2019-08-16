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
        var headerLink = document.getElementById("header-links");
        if (App.account.username !== null && App.account.password !== null) {
            // Add welcome
            headerLink.children[0].innerHTML =
                '<li class="has-submenu"><a href="profile.html" >Chào,' + ' ' +
                web3.toAscii(App.account.username)  + ' <i class="fas fa-angle-down"></i></a>' +
                '<ul class="submenu">' +
                '<li><a href="profile.html">Thông tin tài khoản</a></li>' +
                '<li><a href="create-campaign.html">Tạo chiến dịch</a></li>' +
                '</ul>' +
                '</li>'+
                '<li ><a class="logout-btn" href="#" >Đăng xuất</a></li>';
        } else {headerLink.children[0].innerHTML =
            '<li ><a href="sign-up.html" >Đăng ký</a></li>' +
            '<li ><a href="log-in.html" >Đăng nhập</a></li>';
        }
    },

};

$(function () {
    $(window).load(function () {
        App.init();

        $(".logout-btn").click(function(){
        event.preventDefault();
        sessionStorage.clear();
        return window.location.href = "/index.html";
        });
    });
});