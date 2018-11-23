SignUp = {
    web3Provider: null,
    contracts: {},

    init: function () {
        // const node = new Ipfs({
        //     repo: 'ipfs-' + Math.random()
        // })
        // node.once('ready', () => {
        //     console.log('Online status: ', node.isOnline() ? 'online' : 'offline')
        //     // You can write more code here to use it. Use methods like 
        //     // node.files.add, node.files.get. See the API docs here:
        //     // https://github.com/ipfs/interface-ipfs-core
        //     var obj = {
        //         "id": 3,
        //         "name": "ryan"
        //     };
        //     node.files.add(new node.types.Buffer(JSON.stringify(obj)), (err, filesAdded) => {
        //         if (err) {
        //             return console.error('Error - ipfs add', err, res)
        //         }

        //         console.log(filesAdded);
        //         filesAdded.forEach((file) => {
        //             console.log('successfully stored', file.hash)
        //         })
        //     })

        //     // node.files.cat('Qmak2PftRvJYyZJkWH5ud9J48RXvD46DUJeH2ovbD95qNm', function (err, data) {
        //     //     if (err) {
        //     //         return console.error('Error - ipfs files cat', err, res)
        //     //     }
        //     //     var jsondata = data.toString();
        //     //     jsondata = JSON.parse(jsondata);
        //     //     console.log(jsondata)
        //     // })
        // })
        // //        
        return SignUp.initWeb3();
    },

    initWeb3: function () {
        // Is there an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            SignUp.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            SignUp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(SignUp.web3Provider);

        return SignUp.initContract();
    },

    initContract: function () {
        $.getJSON('Funding.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var FundingArtifact = data;
            SignUp.contracts.Funding = TruffleContract(FundingArtifact);

            // Set the provider for our contract
            SignUp.contracts.Funding.setProvider(SignUp.web3Provider);

        });

        return SignUp.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', '#btn-sign-up', SignUp.createAccount);
    },

    createAccount: function (event) {
        //get input
        var inputFullname = document.getElementById("fullname").value;
        var inputEmail = document.getElementById("email").value;
        var inputUsername = document.getElementById("username").value;
        var inputPassword = document.getElementById("pwd").value;
        var inputConfirmPassword = document.getElementById("confirm-pwd").value;

        // is validated
        if (SignUp.validateForm(inputUsername, inputPassword, inputConfirmPassword)) {
            var signUpSection = document.getElementById("sign-up-section");
            var signUpForm = document.getElementById("sign-up-form");

            signUpForm.remove();

            //showLoader()
            var loader = document.createElement("div");

            loader.className = "loader-sign-up mx-auto mt-5";
            signUpSection.appendChild(loader);

            //save to ipfs
            var jsonData = {
                "username": inputUsername,
                "fullname": inputFullname,
                "email": inputEmail,
            };
            window.App.addDataToIpfs(jsonData);
            var ipfsHash = localStorage.getItem("ipfsHash");

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
            SignUp.contracts.Funding.deployed().then(function (instance) {
                    fundingInstance = instance;
                    console.log(window.App.hexToBytes(inputUsername, 16));
                    console.log(window.App.hexToBytes(web3.sha3(inputPassword), 32));
                    console.log(window.App.hexToBytes(ipfsHash, "bytes"));
                    return fundingInstance.createAccount(
                        window.App.hexToBytes(inputUsername, 16), //bytes16 username
                        window.App.hexToBytes(web3.sha3(inputPassword), 32), //bytes32 password
                        window.App.hexToBytes(ipfsHash, "bytes"), { //bytes ipfshHash
                            from: account,
                            gas: 3500000,
                            gasPrice: 100,
                        });
                }).then(function (result) {
                    console.log(result);
                    loader.remove();
                    if (result.receipt.status === "0x0") {
                        SignUp.showAlert("fail", signUpSection);
                    } else {
                        SignUp.showAlert("success", signUpSection);

                    }
                })
                .catch(function (err) {
                    loader.remove();
                    SignUp.showAlert("fail", signUpSection);
                    console.log(err);
                });

        }
    },

    validateForm: function (username, password, confirmPassword) {

        // Reset errors
        errorsArray = document.getElementsByClassName("errors");
        for (var i = 0; i < errorsArray.length; i++) {
            errorsArray[i].innerText = "";
        }

        //validate
        if (username.length < 4) {
            document.getElementById("error_username").innerText = "Username has at least 4 characters";
            return false;
        } else if (password.length < 3) {
            document.getElementById("error_password").innerText = "Password has at least 3 characters";
            return false;
        } else if (confirmPassword !== password) {
            document.getElementById("error_confirm_password").innerText = "Confirm password is not matched";
            return false;
        } else {
            document.getElementsByClassName("errors").innerText = "";
            return true;
        }
    },
    showAlert: function (type, element) {
        var strong = document.createElement("strong");
        var message = "";
        var div = document.createElement("div");

        var backBtn = document.createElement("a");
        backBtn.className = "btn btn-primary btn-block";

        if (type === "success") {
            div.className = "alert alert-success";
            message = document.createTextNode("Your account is registed. Now you can log in with it!");

            backBtn.textContent = "Log In";
            backBtn.href = "/log-in.html";

            strong.textContent = "Succeeded! ";
        } else if (type === "fail") {

            div.className = "alert alert-danger";
            message = document.createTextNode("There was an error occurred during the process.");

            backBtn.textContent = "Home Page";
            backBtn.href = "/";

            strong.textContent = "Failed! ";
        }

        div.appendChild(strong);
        div.appendChild(message);

        element.appendChild(div);
        element.appendChild(backBtn);
    }

};

$(function () {
    $(window).load(function () {
        SignUp.init();
    });
});