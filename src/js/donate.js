Donate = {
    web3Provider: null,
    contracts: {},
    init: function () {
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

            return Donate.showDonateForm();
        });
        return Donate.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '#btn-donate', Donate.donate);
    },

    showDonateForm: function () {
        // idCamp
        var idCampaign = window.location.href.split("?id=")[1];
        document.getElementById("idCampaign").value = idCampaign;
        // username
        document.getElementById("username").value = web3.toAscii(window.App.account.username);
        // set default date to today
        Date.prototype.toDateInputValue = (function () {
            var local = new Date(this);
            local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
            return local.toJSON().slice(0, 10);
        });
        document.getElementById('date').value = new Date().toDateInputValue();

        var fundingInstance;
        Donate.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            // Execute adopt as a transaction by sending account 
            return fundingInstance.getCampaign.call(idCampaign).then(function (campaign) {
                const node = new Ipfs();
                node.once('ready', () => {

                    console.log('Online status: ', node.isOnline() ? 'online' : 'offline')
                    node.cat(web3.toAscii(campaign[4]), function (err, data) {
                        if (err) {
                            console.error('Error - ipfs files cat', err, data);
                        }
                        localStorage.setItem("campaignInfo", data.toString());
                        var infoJson = JSON.parse(localStorage.getItem("campaignInfo"));
                        document.getElementById('campaign-name').value = infoJson.nameOfCampaign;
                    });
                })
            });
        });
    },

    donate: function (event) {
        event.preventDefault();
        document.getElementById("loader").classList.remove("d-none");
        const node = new Ipfs();
        node.once('ready', () => {
            console.log('Online status: ', node.isOnline() ? 'online' : 'offline')


            // add exchangeJsonData to ipfs
            var exchangeJsonData = {
                "type": "OUT",
                "date": document.getElementById('date').value,
                "numOfToken": document.getElementById('amount').value * -1
            };
            node.add(new Ipfs.Buffer(JSON.stringify(exchangeJsonData)),
                function (error, filesAdded) {
                    if (error) {
                        console.log(error);
                    }
                    localStorage.setItem("donateExchangeLogDataToIpfs", filesAdded[0].hash.toString());
                })


            // add to ipfs
            var transactionJsonData = {
                "fromUsername": web3.toAscii(window.App.account.username),
                "toIdCampaign": document.getElementById("idCampaign").value,
                "numOfTokens": document.getElementById("amount").value,
                "onDate": document.getElementById("date").value,
                "message": document.getElementById("message").value,
            };
            node.add(new Ipfs.Buffer(JSON.stringify(transactionJsonData)),
                function (error, filesAdded) {
                    if (error) {
                        console.log(error);
                    }
                    localStorage.setItem("transactionDataToIpfs", filesAdded[0].hash.toString());

                    var tokens = document.getElementById("amount").value;
                    var idCampaign = document.getElementById("idCampaign").value;
                    //get account for transaction
                    var account;
                    web3.eth.getAccounts(function (error, accounts) {
                        if (error) {
                            console.log(error);
                        }
                        account = accounts[0];
                    });

                    // send transaction to SC
                    var fundingInstance;
                    Donate.contracts.Funding.deployed().then(function (instance) {
                        fundingInstance = instance;
                        // Execute adopt as a transaction by sending account 
                        return fundingInstance.donate(
                            tokens,
                            idCampaign,
                            window.App.account.username,
                            window.App.account.password,
                            window.App.hexToBytes(localStorage.getItem("transactionDataToIpfs"), "bytes"),
                            window.App.hexToBytes(localStorage.getItem("donateExchangeLogDataToIpfs"), "bytes"), {
                                from: account,
                                gas: 5500000,
                                gasPrice: 1000000000,
                            });
                    }).then(function (result) {
                        console.log(result);
                        document.getElementById("loader").classList.add("d-none");
                        if (result.receipt.status === "0x0") {
                            var error = document.getElementById("error_txt");
                            error.className = "alert alert-danger my-3";
                            error.innerHTML = "<strong>Thất bại!</strong> Đã xảy ra sự cố trong quá trình thực thi!";
                        } else {
                            var success = document.getElementById("error_txt");
                            success.className = "alert alert-success my-3";
                            success.innerHTML = "<strong>Thành công!</strong>Số token được quyên góp đã chuyển cho chiến dịch";
                        }
                    }).catch(function (error) {
                        console.log(error.message);
                    });
                });
        })

    },

};

$(function () {
    $(window).load(function () {
        Donate.init();
    });
});