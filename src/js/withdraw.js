Withdraw = {
    web3Provider: null,
    contracts: {},
    init: function () {
        return Withdraw.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            Withdraw.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            Withdraw.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(Withdraw.web3Provider);

        return Withdraw.initContract();
    },

    initContract: function () {
        $.getJSON('Funding.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FundingArtifact = data;
            Withdraw.contracts.Funding = TruffleContract(FundingArtifact);

            // Set the provider for our contract
            Withdraw.contracts.Funding.setProvider(Withdraw.web3Provider);

            return Withdraw.showWithdrawForm();
        });
        return Withdraw.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '#btn-withdraw', Withdraw.withdraw);
    },

    showWithdrawForm: function () {
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
        Withdraw.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            // Execute adopt as a transaction by sending account 
            return fundingInstance.getCampaign.call(idCampaign).then(function (campaign) {
                // returns (uint256 id ,bytes16 creatorUsername,int256 numOfToken,uint256 numberOfTrans,bytes ipfsHash)
                // numOfToken
                document.getElementById('numOfToken').value = campaign[2].toNumber();
                const node = new Ipfs();
                node.once('ready', () => {

                    node.cat(web3.toAscii(campaign[4]), function (err, data) {
                        if (err) {
                            console.error('Error - ipfs files cat', err, data)
                        }
                        localStorage.setItem("campaignInfo", data.toString());
                        var infoJson = JSON.parse(localStorage.getItem("campaignInfo"));
                        document.getElementById('campaign-name').value = infoJson.nameOfCampaign;
                    });
                })
            });
        });
    },

    withdraw: function (event) {
        event.preventDefault();
        document.getElementById("loader").classList.remove("d-none");
        const node = new Ipfs();
        node.once('ready', () => {


            // add exchangeJsonData to ipfs
            var exchangeJsonData = {
                "type": "IN",
                "date": document.getElementById('date').value,
                "numOfToken": document.getElementById('amount').value
            };
            node.add(new Ipfs.Buffer(JSON.stringify(exchangeJsonData)),
                function (error, filesAdded) {
                    if (error) {
                        console.log(error);
                    }
                    localStorage.setItem("withdrawExchangeLogDataToIpfs", filesAdded[0].hash.toString());
                });

            // add to withdrawJsonData ipfs
            var withdrawJsonData = {
                "fromIdCampaign": document.getElementById("idCampaign").value,
                "toUsername": web3.toAscii(window.App.account.username),
                "numOfTokens": document.getElementById("amount").value,
                "onDate": document.getElementById("date").value,
                "message": document.getElementById("message").value,
            };
            node.add(new Ipfs.Buffer(JSON.stringify(withdrawJsonData)),
                function (error, filesAdded) {
                    if (error) {
                        console.log(error);
                    }
                    localStorage.setItem("withdrawDataToIpfs", filesAdded[0].hash.toString());

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
                    console.log(localStorage.getItem("withdrawDataToIpfs"), "bytes");
                    console.log(localStorage.getItem("withdrawExchangeLogDataToIpfs"), "bytes");
                    Withdraw.contracts.Funding.deployed().then(function (instance) {
                        fundingInstance = instance;
                        // Execute adopt as a transaction by sending account 
                        return fundingInstance.withDraw(
                            window.App.account.username,
                            window.App.account.password,
                            idCampaign,
                            tokens,
                            window.App.hexToBytes(localStorage.getItem("withdrawDataToIpfs"), "bytes"),
                            window.App.hexToBytes(localStorage.getItem("withdrawExchangeLogDataToIpfs"), "bytes"),  {
                                from: account,
                                gas: 350000,
                                gasPrice: 100000,
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
                            success.innerHTML = "<strong>Thành công!</strong>Số token của chiến dịch đã được chuyển vào tài khoản!";
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
        Withdraw.init();
    });
});