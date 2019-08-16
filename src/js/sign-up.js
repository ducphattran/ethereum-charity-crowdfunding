SignUp = {
    web3Provider: null,
    contracts: {},
    init: function () {
        
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
        event.preventDefault();
        //get input
        var inputFullname = document.getElementById("fullname").value;
        var inputPhone = document.getElementById("phone").value;
        var inputEmail = document.getElementById("email").value;
        var inputUsername = document.getElementById("username").value;
        var inputPassword = document.getElementById("pwd").value;
        var inputConfirmPassword = document.getElementById("confirm-pwd").value;

        // is validated
        if (SignUp.validateForm(inputUsername, inputPassword, inputConfirmPassword)) {
            // const node = new Ipfs({
            //     repo: 'ipfs-' + Math.random()
            // })
            const node = new Ipfs();
            node.once('ready', () => {
                console.log('Online status: ', node.isOnline() ? 'online' : 'offline');

                var signUpSection = document.getElementById("sign-up-section");
                var signUpForm = document.getElementById("sign-up-form");

                signUpForm.remove();

                //input data from form to json for IPFS
                var jsonData = {
                    "username": inputUsername,
                    "fullname": inputFullname,
                    "email": inputEmail,
                    "phone": inputPhone,
                    "birthdate": "null",
                    "gender": "null",
                };

                // showLoader()
                var loader = document.createElement("div");

                loader.className = "loader-sign-up mx-auto mt-5";
                signUpSection.appendChild(loader);
                
                //save to ipfs
                // node.files.add(new node.types.Buffer(JSON.stringify(jsonData)),
                console.log(node);
                node.add(new Ipfs.Buffer(JSON.stringify(jsonData)),
                    function (error, filesAdded) {
                        if (error) {
                            console.log(error);
                        }
                        localStorage.setItem("signUpipfsHash", filesAdded[0].hash.toString());

                        // ipfsHash
                        var ipfsHash = localStorage.getItem("signUpipfsHash");
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
                                        gas: 6500000,
                                        gasPrice: 1000000000,
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

                    });
            })
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