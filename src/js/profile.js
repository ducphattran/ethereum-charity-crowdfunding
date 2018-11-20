window.onload = function () {
    var username = web3.toAscii(window.App.account.username);
    var address = window.App.account.username;
    var token = window.App.account.token;

    document.getElementById("address").innerText = address;
    document.getElementById("username").innerText = username;
    document.getElementById("token").innerText = token;

}