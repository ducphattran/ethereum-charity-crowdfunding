window.onload = function () {

    document.getElementById("btn-log-in").addEventListener('click', function (event) {
        event.preventDefault();
        //input
        var inputUsername = document.getElementById("username").value;
        var inputPassword = document.getElementById("pwd").value;
        inputPassword = web3.sha3(inputPassword);

        checkAuth(inputUsername, inputPassword);
    });

     function checkAuth(username, password)  {
        username = window.App.hexToBytes(username, 16);
        password = window.App.hexToBytes(password, 32);
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
                        window.location.href = "/";
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

    function showAlert(type, element) {
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