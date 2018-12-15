Profile = {
    web3Provider: null,
    contracts: {},

    init: function () {
        // Set datePicker to today
        // MM-DD-YYYY
        Date.prototype.toDateInputValue = (function () {
            var local = new Date(this);
            local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
            return local.toJSON().slice(0, 10);
        });
        document.getElementById('f-birthdate').value = new Date().toDateInputValue();
        document.getElementById('to-token-date').value = new Date().toDateInputValue();
        document.getElementById('to-ether-date').value = new Date().toDateInputValue();
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
        $(document).on('click', '#update-btn', Profile.updateProfile);
        $(document).on('click', '#change-password-btn', Profile.changePassword);
        $(document).on('click', '#transfer-to-token-btn', Profile.transferToToken);
        $(document).on('click', '#transfer-to-ether-btn', Profile.transferToEther);
        $(document).on('click', '#transfer-history-btn', Profile.showTransferHistory);
        $(document).on('click', '#created-campaign-list-btn', Profile.showCreatedCampaignList);
        $(document).on('click', '#donated-campaign-list-btn', Profile.showDonatedCampaignList);
    },

    getProfile: function () {
        const node = new Ipfs();
        node.once('ready', () => {
            console.log('Online status: ', node.isOnline() ? 'online' : 'offline');
            node.files.cat(web3.toAscii(window.App.account.ipfsHash), function (err, data) {
                if (err) {
                    return console.error('Error - ipfs files cat', err, data)
                }
                var jsondata = data.toString();
                console.log(jsondata);
                localStorage.setItem("profileFromIpfs", jsondata);

                // get data from App.account
                var username = web3.toAscii(window.App.account.username);
                var address = window.App.account.address;
                var token = window.App.account.token;
                var infoJson = JSON.parse(localStorage.getItem("profileFromIpfs"));
                // Display 

                // account information
                document.getElementById("account-owner").innerText = infoJson.fullname;
                document.getElementById("account-username").innerText = username;
                document.getElementById("account-address").innerText = address;
                document.getElementById("account-tokens").innerText = token;
                //profile
                document.getElementById("f-fullname").value = infoJson.fullname;
                document.getElementById("f-phone").value = infoJson.phone;
                document.getElementById("f-email").value = infoJson.email;
                if (document.getElementById('f-birthdate') !== null) {
                    document.getElementById('f-birthdate').value = infoJson.birthdate;
                }
                if (infoJson.gender === 'male') {
                    document.getElementById('f-male').checked = "checked";
                } else if (infoJson.gender === 'female') {
                    document.getElementById('f-female').checked = "checked";
                }

                // transfer
                // show remaining token
                document.getElementById('transfer-token').innerText = document.getElementById("account-tokens").innerText;
            })
        })
    },

    updateProfile: function () {
        document.getElementById("profile-loader").classList.remove("d-none");
        var infoJson = JSON.parse(localStorage.getItem("profileFromIpfs"));
        var fullname = document.getElementById('f-fullname').value;
        var birthdate = document.getElementById('f-birthdate').value;
        var gender = null;
        if (document.getElementById('f-male').checked === true) {
            gender = 'male';
        } else if (document.getElementById('f-female').checked === true) {
            gender = 'female';
        }
        var email = document.getElementById('f-email').value;
        var phone = document.getElementById('f-phone').value;

        infoJson.fullname = fullname;
        infoJson.birthdate = birthdate;
        infoJson.gender = gender;
        infoJson.email = email;
        infoJson.phone = phone;

        const node = new Ipfs();
        node.once('ready', () => {
            console.log('Online status: ', node.isOnline() ? 'online' : 'offline');

            //save to ipfs
            node.files.add(new node.types.Buffer(JSON.stringify(infoJson)),
                function (error, filesAdded) {
                    if (error) {
                        console.log(error);
                    }
                    localStorage.setItem("updateIpfsHash", filesAdded[0].hash.toString());

                    // ipfsHash
                    var ipfsHash = localStorage.getItem("updateIpfsHash");
                    console.log(ipfsHash);
                    var fundingInstance;
                    var account;
                    // Get account
                    web3.eth.getAccounts(function (error, accounts) {
                        if (error) {
                            console.log(error);
                        }
                        account = accounts[0];
                    });

                    //Call to contract
                    Profile.contracts.Funding.deployed().then(function (instance) {
                        fundingInstance = instance;
                        return fundingInstance.updateAccount(
                            window.App.account.username, //bytes16 username
                            window.App.account.password, //bytes32 password
                            window.App.hexToBytes(ipfsHash, "bytes"), { //bytes ipfshHash
                                from: account,
                                gas: 4500000,
                                gasPrice: 1000000000,
                            });
                    }).then(function (result) {
                        console.log(result);
                        document.getElementById("profile-loader").classList.add("d-none");
                        if (result.receipt.status === "0x0") {
                            var error = document.getElementById("profile-error_txt");
                            error.className = "alert alert-danger my-3";
                            error.innerHTML = "<strong>Thất bại!</strong> Đã xảy ra sự cố trong quá trình thực thi!";
                        } else {
                            var success = document.getElementById("profile-error_txt");
                            success.className = "alert alert-success my-3";
                            success.innerHTML = "<strong>Thành công!</strong>Thay đổi thông tin cá nhân thành công!";
                        }
                    }).catch(function (error) {
                        console.log(error.message);
                        alert('Transaction failed!');
                        document.getElementById("profile-loader").classList.add("d-none");
                    });

                });
        });
    },

    changePassword: function () {
        document.getElementById("change-password-loader").classList.add("d-none");
        if (Profile.validatePassword()) {
            document.getElementById("change-password-loader").classList.remove("d-none");
            var newPwd = window.App.hexToBytes(web3.sha3(document.getElementById('f-new-password').value), 32);
            var fundingInstance;
            var account;
            // Get account
            web3.eth.getAccounts(function (error, accounts) {
                if (error) {
                    console.log(error);
                }
                account = accounts[0];
            });

            //Call to contract
            Profile.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;
                return fundingInstance.changePassword(
                    window.App.account.username, //bytes16 username
                    window.App.account.password, //bytes32 password
                    newPwd, { //bytes ipfshHash
                        from: account,
                        gas: 4500000,
                        gasPrice: 1000000000,
                    });
            }).then(function (result) {
                console.log(result);
                document.getElementById("change-password-loader").classList.add("d-none");
                if (result.receipt.status === "0x0") {
                    var error = document.getElementById("change-password-error_txt");
                    error.className = "alert alert-danger my-3";
                    error.innerHTML = "<strong>Thất bại!</strong> Đã xảy ra sự cố trong quá trình thực thi!";
                } else {
                    var success = document.getElementById("change-password-error_txt");
                    success.className = "alert alert-success my-3";
                    success.innerHTML = "<strong>Thành công!</strong>Mật khẩu đã được thay đổi thành công";
                }
            }).catch(function (error) {
                console.log(error.message);
                alert('Transaction failed!');
                document.getElementById("change-password-loader").classList.add("d-none");
            });
        }
    },

    validatePassword: function () {
        var oldPwd = document.getElementById('f-old-password').value;
        var newPwd = document.getElementById('f-new-password').value;
        var confirmPwd = document.getElementById('f-confirm-new-password').value;

        document.getElementById('change-pwd-error').innerText = '';
        if (window.App.hexToBytes(web3.sha3(oldPwd), 32) != window.App.account.password) {
            document.getElementById('change-pwd-error').innerText = 'Mật khẩu hiện tại không đúng!';
        } else if (newPwd.length < 3) {
            document.getElementById('change-pwd-error').innerText = 'Mật khẩu mới phải ít nhất 3 ký tự!';
            return false;
        } else if (confirmPwd !== newPwd) {
            document.getElementById('change-pwd-error').innerText = 'Mật khẩu mới và xác nhận không trùng khớp!';
            return false;
        } else {
            document.getElementById('change-pwd-error').innerText = '';
            return true;
        }
    },

    transferToToken: function () {
        event.preventDefault();
        document.getElementById("to-token-loader").classList.remove("d-none");

        //add to ipfs
        var jsonData = {
            "type": "IN",
            "date": document.getElementById('to-token-date').value,
            "numOfToken": document.getElementById('to-token-amount').value
        };
        const node = new Ipfs();
        node.once('ready', () => {
            //save to ipfs
            node.files.add(new node.types.Buffer(JSON.stringify(jsonData)),
                function (error, filesAdded) {
                    if (error) {
                        console.log(error);
                    }
                    localStorage.setItem("toTokenIpfsHash", filesAdded[0].hash.toString());

                    // ipfsHash
                    var ipfsHash = localStorage.getItem("toTokenIpfsHash");
                    console.log(ipfsHash);


                    var fundingInstance;
                    var account;
                    var amount = document.getElementById("to-token-amount").value;
                    var sendingAmount = amount * 1000000000;

                    web3.eth.getAccounts(function (error, accounts) {
                        if (error) {
                            console.log(error);
                        }
                        account = accounts[0];
                    });
                    Profile.contracts.Funding.deployed().then(function (instance) {
                        fundingInstance = instance;
                        // Execute adopt as a transaction by sending account 
                        return fundingInstance.exchangeToToken(
                            ipfsHash, {
                                from: account,
                                gas: 4500000,
                                gasPrice: 1000000000,
                                value: sendingAmount,
                            });
                    }).then(function (result) {
                        console.log(result);
                        document.getElementById("to-token-loader").classList.add("d-none");
                        if (result.receipt.status === "0x0") {
                            var error = document.getElementById("to-token-error_txt");
                            error.className = "alert alert-danger my-3";
                            error.innerHTML = "<strong>Thất bại!</strong> Đã xảy ra sự cố trong quá trình thực thi!";
                        } else {
                            var success = document.getElementById("to-token-error_txt");
                            success.className = "alert alert-success my-3";
                            success.innerHTML = "<strong>Thành công!</strong>Nạp token thành công!";
                        }
                    }).catch(function (error) {
                        console.log(error.message);
                        alert('Transaction failed!');
                        document.getElementById("to-token-loader").classList.add("d-none");
                    });
                })
        });
    },

    transferToEther: function () {
        event.preventDefault();
        document.getElementById("to-ether-loader").classList.remove("d-none");
        //add to ipfs
        var jsonData = {
            "type": "OUT",
            "date": document.getElementById('to-ether-date').value,
            "numOfToken": document.getElementById('to-ether-amount').value * -1
        };
        const node = new Ipfs();
        node.once('ready', () => {
            //save to ipfs
            node.files.add(new node.types.Buffer(JSON.stringify(jsonData)),
                function (error, filesAdded) {
                    if (error) {
                        console.log(error);
                    }
                    localStorage.setItem("toEtherIpfsHash", filesAdded[0].hash.toString());

                    // ipfsHash
                    var ipfsHash = localStorage.getItem("toEtherIpfsHash");
                    console.log(ipfsHash);

                    var fundingInstance;
                    var account;
                    var amount = document.getElementById("to-ether-amount").value;

                    web3.eth.getAccounts(function (error, accounts) {
                        if (error) {
                            console.log(error);
                        }
                        account = accounts[0];
                    });
                    Profile.contracts.Funding.deployed().then(function (instance) {
                        fundingInstance = instance;
                        // Execute adopt as a transaction by sending account 
                        return fundingInstance.exchangeToEther(
                            amount,
                            window.App.account.username,
                            window.App.account.password,
                            ipfsHash, {
                                from: account,
                                gas: 4500000,
                                gasPrice: 1000000000,
                            });
                    }).then(function (result) {
                        console.log(result);
                        document.getElementById("to-ether-loader").classList.add("d-none");
                        if (result.receipt.status === "0x0") {
                            var error = document.getElementById("to-ether-error_txt");
                            error.className = "alert alert-danger my-3";
                            error.innerHTML = "<strong>Thất bại!</strong> Đã xảy ra sự cố trong quá trình thực thi!";
                        } else {
                            var success = document.getElementById("to-ether-error_txt");
                            success.className = "alert alert-success my-3";
                            success.innerHTML = "<strong>Thành công!</strong>Đổi token thành công!";
                        }
                    }).catch(function (error) {
                        console.log(error.message);
                        alert('Transaction failed!');
                        document.getElementById("to-ether-loader").classList.add("d-none");
                    });
                })
        });
    },

    showTransferHistory: function () {
        // display the table
        $("#profile").hide();
        $("#account-information").hide();
        $("#change-password").hide();
        $("#transfer").hide();
        $("#created-campaign-list").hide();
        $("#donated-campaign-list").hide();
        $("#transfer-history").fadeIn();
        document.getElementById("change-password-link").classList.remove("active");
        document.getElementById("profile-link").classList.remove("active");
        document.getElementById("account-information-link").classList.remove("active");
        document.getElementById("transfer-link").classList.remove("active");
        document.getElementById("created-campaign-list-link").classList.remove("active");
        document.getElementById("donated-campaign-list-link").classList.remove("active");
        document.getElementById("transfer-history-link").classList.add("active");

        // remove tbody
        document.getElementById('tbl-transfer-tbody').innerHTML = '';

        //call to contract
        var fundingInstance;
        Profile.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;
                return fundingInstance.getListOfTokenExchangeLog.call(window.App.account.username);
            }).then(function (result) {
                console.log(result.length);
                for (var i = 1; i < result.length; i++) {
                    console.log(result[i]);
                    fundingInstance.getTokenExchangeLog.call(result[i]).then(function (tokenExchangeLog) {
                        // return (exLog.id,exLog.ownerUsername,exLog.numOfToken,exLog.ipfsHash);
                        Profile.addToTransferTable(tokenExchangeLog);
                    });
                }
            })
            .catch(function (err) {
                console.log(err);
            });
    },

    addToTransferTable: function (tokenExchangeLog) {
        var tbody = document.getElementById('tbl-transfer-tbody');
        var tr = document.createElement("tr");
        var tdIndex = document.createElement("td");
        var tdType = document.createElement("td");
        var tdNumOfToken = document.createElement("td");
        var tdDate = document.createElement("td");

        const node = new Ipfs();
        node.once('ready', () => {
            // tokenExchangeLog (exLog.id,exLog.ownerUsername,exLog.numOfToken,exLog.ipfsHash);
            node.files.cat(web3.toAscii(tokenExchangeLog[3]),
                function (err, data) {
                    if (err) {
                        return console.error('Error - ipfs files cat', err, data)
                    }
                    localStorage.setItem("transferHistoryToTblIpfs", data.toString());
                    var exchangeJsonInfo = JSON.parse(localStorage.getItem("transferHistoryToTblIpfs"));
                    console.log(exchangeJsonInfo);
                    // exchangeJsonInfo
                    // "type": "OUT",
                    // "date": document.getElementById('date').value,
                    // "numOfToken": document.getElementById('amount').value * -1
                    tdDate.innerText = exchangeJsonInfo.date;
                    tdNumOfToken.innerText = tokenExchangeLog[2].toNumber();
                    tdIndex.innerText = tokenExchangeLog[0].toNumber();
                    tdType.innerText = exchangeJsonInfo.type;
                    if (tokenExchangeLog[2].toNumber() > 0) {
                        tr.classList.add("input");
                        tdNumOfToken.innerText = '+' + tokenExchangeLog[2].toNumber().toString();
                    } else if (tokenExchangeLog[2].toNumber() < 0) {
                        tr.classList.add("output");
                        tdNumOfToken.innerText = tokenExchangeLog[2].toNumber().toString();
                    }
                    tr.appendChild(tdIndex);
                    tr.appendChild(tdDate);
                    tr.appendChild(tdType);
                    tr.appendChild(tdNumOfToken);
                    tbody.appendChild(tr);
                })
        });

    },

    showCreatedCampaignList: function () {
        // display the table
        $("#profile").hide();
        $("#account-information").hide();
        $("#change-password").hide();
        $("#transfer").hide();
        $("#transfer-history").hide();
        $("#donated-campaign-list").hide();
        $("#created-campaign-list").fadeIn();
        document.getElementById("change-password-link").classList.remove("active");
        document.getElementById("profile-link").classList.remove("active");
        document.getElementById("account-information-link").classList.remove("active");
        document.getElementById("transfer-link").classList.remove("active");
        document.getElementById("transfer-history-link").classList.remove("active");
        document.getElementById("donated-campaign-list-link").classList.remove("active");
        document.getElementById("created-campaign-list-link").classList.add("active");

        // remove tbody
        document.getElementById('tbl-created-campaign-list-tbody').innerHTML = '';

        //call to contract
        var fundingInstance;
        // get created campaign
        Profile.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;
                return fundingInstance.getListCampaignByUsername.call(window.App.account.username);
            }).then(function (result) {
                for (var i = 1; i < result.length; i++) {
                    Profile.addCreatedCampaignToTbl(result[i]);
                }
            })
            .catch(function (err) {
                console.log(err);
            });

    },

    showDonatedCampaignList: function () {
        // display the table
        $("#profile").hide();
        $("#account-information").hide();
        $("#change-password").hide();
        $("#transfer").hide();
        $("#transfer-history").hide();
        $("#created-campaign-list").hide();
        $("#donated-campaign-list").fadeIn();
        document.getElementById("change-password-link").classList.remove("active");
        document.getElementById("profile-link").classList.remove("active");
        document.getElementById("account-information-link").classList.remove("active");
        document.getElementById("transfer-link").classList.remove("active");
        document.getElementById("transfer-history-link").classList.remove("active");
        document.getElementById("created-campaign-list-link").classList.remove("active");
        document.getElementById("donated-campaign-list-link").classList.add("active");

        // remove tbody
        document.getElementById('tbl-donated-campaign-list-tbody').innerHTML = '';

        //call to contract
        var fundingInstance;
        // get donated campaign
        Profile.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            return fundingInstance.getDonateLog.call(window.App.account.username)
                .then(function (donateLogs) {
                    for (var i = 1; i < donateLogs.length; i++) {
                        fundingInstance.getTransactionById.call(donateLogs[i]).then(function (transaction) {

                            Profile.addDonatedCampaignToTbl(transaction);
                        })
                    }
                });
        }).catch(function (err) {
            console.log(err);
        });

    },

    addCreatedCampaignToTbl: function (idCampaign) {
        var tbody = document.getElementById('tbl-created-campaign-list-tbody');
        var tr = document.createElement("tr");
        var tdIndex = document.createElement("td");
        var tdName = document.createElement("td");
        var tdNumOfToken = document.createElement("td");
        var tdNumOfTrans = document.createElement("td");
        var tdWithDraw = document.createElement("td");
        var withdrawBtn = document.createElement("a");
        withdrawBtn.classList.add("tbl-btn");

        var fundingInstance;
        Profile.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            return fundingInstance.getCampaign.call(idCampaign.toNumber())
                .then(function (campaign) {
                    const node = new Ipfs();
                    node.once('ready', () => {
                        // returns (uint256 id ,bytes16 creatorUsername,int256 numOfToken,uint256 numberOfTrans,bytes ipfsHash)
                        node.files.cat(web3.toAscii(campaign[4]),
                            function (err, data) {
                                if (err) {
                                    return console.error('Error - ipfs files cat', err, data)
                                }
                                localStorage.setItem("createdCampaignToTblIpfs", data.toString());
                            })
                    });
                    var jsonInfo;
                    jsonInfo = JSON.parse(localStorage.getItem("createdCampaignToTblIpfs"));
                    console.log(jsonInfo);
                    // var jsonData = {
                    //    nameOfCampaign,createdByUsername,createdDate,description
                    //};
                    tdIndex.innerText = campaign[0].toNumber() + 1;
                    var campLink = document.createElement("a");
                    campLink.href = "campaign.html?id=" + campaign[0].toNumber();
                    campLink.innerText = jsonInfo.nameOfCampaign;
                    tdName.appendChild(campLink);
                    tdNumOfToken.innerText = campaign[2].toNumber();
                    tdNumOfTrans.innerText = campaign[3].toNumber();
                    withdrawBtn.innerText = "Rút";
                    withdrawBtn.href = "withdraw.html?id=" + campaign[0].toNumber();

                    tdWithDraw.appendChild(withdrawBtn);

                    tr.appendChild(tdIndex);
                    tr.appendChild(tdName);
                    tr.appendChild(tdNumOfToken);
                    tr.appendChild(tdNumOfTrans);
                    tr.appendChild(tdWithDraw);
                    tbody.appendChild(tr);

                });
        });
    },

    addDonatedCampaignToTbl: function (transaction) {
        var tbody = document.getElementById('tbl-donated-campaign-list-tbody');
        var tr = document.createElement("tr");
        var tdDate = document.createElement("td");
        var tdNameOfCamp = document.createElement("td");
        var tdNumOfToken = document.createElement("td");
        var tdMessage = document.createElement("td");

        var fundingInstance;
        Profile.contracts.Funding.deployed().then(function (instance) {
            fundingInstance = instance;
            return fundingInstance.getCampaign.call(transaction[2])
                .then(function (campaign) {
                    const node = new Ipfs();
                    node.once('ready', () => {
                        // transaction (trans.id,trans.fromUsername,trans.toIdCamp,trans.numOfToken,trans.ipfsHash)
                        node.files.cat(web3.toAscii(transaction[4]),
                            function (err, data) {
                                if (err) {
                                    return console.error('Error - ipfs files cat', err, data)
                                }
                                localStorage.setItem("donatedTransactionToTblIpfs", data.toString());
                            })
                        // returns (uint256 id ,bytes16 creatorUsername,int256 numOfToken,uint256 numberOfTrans,bytes ipfsHash)
                        node.files.cat(web3.toAscii(campaign[4]),
                            function (err, data) {
                                if (err) {
                                    return console.error('Error - ipfs files cat', err, data)
                                }
                                localStorage.setItem("donatedCampaignToTblIpfs", data.toString());
                            })
                    });
                    var campJsonInfo = JSON.parse(localStorage.getItem("donatedCampaignToTblIpfs"));
                    var tranJsonInfo = JSON.parse(localStorage.getItem("donatedTransactionToTblIpfs"));
                    console.log(tranJsonInfo);
                    // var jsonData = {
                    //    nameOfCampaign,createdByUsername,createdDate,description
                    //};
                    tdDate.innerText = tranJsonInfo.onDate;
                    var campLink = document.createElement("a");
                    campLink.href = "campaign.html?id=" + campaign[0].toNumber();
                    campLink.innerText = campJsonInfo.nameOfCampaign;
                    tdNameOfCamp.append(campLink);
                    tdNumOfToken.innerText = tranJsonInfo.numOfTokens;
                    tdMessage.innerText = tranJsonInfo.message;

                    tr.appendChild(tdDate);
                    tr.appendChild(tdNameOfCamp);
                    tr.appendChild(tdNumOfToken);
                    tr.appendChild(tdMessage);
                    tbody.appendChild(tr);

                });
        });
    },

};

$(function () {
    $(window).load(function () {
        Profile.init();
    });
});