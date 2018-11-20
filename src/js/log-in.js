window.onload = function () {
    
    document.getElementById("btn-log-in").addEventListener('click', function (event) {
        event.preventDefault();
        //input
        var inputUsername = document.getElementById("username").value;
        var inputPassword = document.getElementById("pwd").value;
        inputPassword = web3.sha3(inputPassword);

        checkAuth(inputUsername, inputPassword);
        getProfile(inputUsername, inputPassword);
    });

     function checkAuth(username, password)  {
        username = window.App.hexToBytes(username, 16);
        password = window.App.hexToBytes(password, 32);
        var fundingInstance;
        //validate
        window.App.contracts.Funding.deployed().then(function (instance) {
                fundingInstance = instance;
                return fundingInstance.checkAuth.call(username, password);
            }).then(function (result) {
                if (result) {
                    if (typeof(Storage) !== "undefined") {
                        // Store
                        sessionStorage.setItem("username", username);
                        sessionStorage.setItem("password", password);
                        // window.location.href = "/";
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
    }

    function getProfile(username, password){

        username = window.App.hexToBytes(username, 16);
        password = window.App.hexToBytes(password, 32);
        //validate
        window.App.contracts.Funding.deployed().then(function (instance) {
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
    }

};