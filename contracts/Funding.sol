pragma solidity ^0.4.24;

contract Funding {
    
    mapping (address => uint) public addressToIndex; // get Index from Address
    mapping (bytes16 => uint) public usernameToIndex; // get Index from Username
    mapping (address => Account) public addressToAccount; // get Account from Address
    mapping (uint => Campaign) public idToCampaign; // get Campaign from id of a campaign
    mapping (uint => transactionLog) public idToTransLog; // get transactionLog from id of transactionLog
    
    Account[] public accounts;
    address[] public addresses;
    bytes16[] public usernames;
    int256[][] public tokenExchangeLogs;
    uint256[][] public campaignsByIndex;
    uint256[][] public transactionsByIdCamp;
    uint256 public numOfCamp;
    uint256 public numOfTrans;
    
    constructor () public {
        Account memory acc = Account("admin","charity",0);
        
        accounts.push(acc);
        addresses.push(msg.sender);
        usernames.push("admin");
        tokenExchangeLogs.push([0]);
        campaignsByIndex.push([0]);
        
        numOfCamp = 0;
        numOfTrans = 0;
    }
    
    struct Account{
        bytes16 username;
        bytes password;
        // bytes ipfsHash;
        int token;
    }
    
    struct transactionLog{
        uint256 id;
        uint256 fromIndexAcc;
        uint toIdCamp;
        uint numOfToken;
    }
    
    struct Campaign{
        uint id;
        address creator;
        int numOfToken;
        uint numOfTrans;
    }
    
    function getBal() public view returns(uint256 bal){
        return address (this).balance;
    }
    
    function hadAccount(address userAddress) public view returns (bool flag){
        return (addressToIndex[userAddress] > 0 || userAddress == addresses[0]);
    }
    
    function usernameTaken(bytes16 username) public view returns (bool flag){
        return (usernameToIndex[username] > 0 || username == "admin");
    }
    
    modifier minPrice (uint256 _amount){
        require(_amount >= 1000000000,"Value must be at least 1 gwei");
        _;
    }

    function createAccount(bytes16 username,bytes password) public returns (bool success)
    {
        require(!hadAccount(msg.sender));
        require(!usernameTaken(username));
        Account memory acc = Account (username,password,0);
        // Campaign memory camp = Campaign(0,msg.sender,0);
        
        accounts.push(acc);
        usernames.push(username);
        addresses.push(msg.sender);
        tokenExchangeLogs.push([0]);
        campaignsByIndex.push([0]);
        
        addressToIndex[msg.sender] = addresses.length - 1;
        addressToAccount[msg.sender] = acc;
        usernameToIndex[username] = usernames.length - 1;
        // idToCampaign[numOfCamp+1] = camp;
        
        return true;
    }
    
    function changePassword(bytes16 username,bytes oladPassword,bytes newPassword)
    public returns (bool success){
        require(usernameTaken(username));
        Account memory acc = accounts[usernameToIndex[username]];
         if(acc.username == username && keccak256(acc.password) == keccak256(oladPassword)){
            acc.password = newPassword;
            accounts[usernameToIndex[acc.username]] = acc;
            return true;
        }else{
            return false;
        }
    }
    
    function checkAuth(bytes16 username,bytes password) public view returns(bool success){
        require(usernameTaken(username));
        Account memory acc = accounts[usernameToIndex[username]];
        if(acc.username == username && keccak256(acc.password) == keccak256(password)){
            return true;
        }else{
            return false;
        }
    }
    
    function exchangeToToken() payable minPrice(msg.value) public returns (bool success){
        int256 numOfToken = int256(msg.value/1000000000);
        // get Account
        Account storage acc = addressToAccount[msg.sender];
        acc.token += numOfToken;
        accounts[usernameToIndex[acc.username]] = Account(acc.username,acc.password,acc.token);
        // add to tokenExchangeLogs
        tokenExchangeLogs[usernameToIndex[acc.username]].push(numOfToken);
        
        return true;
    }
    
    function exchangeToEther(uint256 fromToken,uint256 toEther,bytes16 username, bytes password) public returns(bool success){
        require(checkAuth(username,password));
        require(fromToken >= toEther*1000000000);
        Account memory acc = accounts[usernameToIndex[username]];
        require(uint256 (acc.token) >= fromToken);
        require(getBal() >= uint256 (fromToken*1000000000));
        msg.sender.transfer(toEther);
        return true;
    }
    
    function getUserProfile(bytes16 username,bytes password) public view returns (bytes16 usrname,bytes pwd,int256 token){
        require(checkAuth(username,password));
        Account memory acc = accounts[usernameToIndex[username]];
        return (acc.username,acc.password,acc.token);
    }

    function getTokenExchangeLog (bytes16 username) public view returns(int256[] tokensExchange){
        return tokenExchangeLogs[usernameToIndex[username]];
    }
    
    function createCampaign(bytes16 username) public returns (bool success){
        require(usernameTaken(username));
        Campaign memory camp = Campaign(numOfCamp,addresses[usernameToIndex[username]],0,0);
        idToCampaign[numOfCamp] = camp;
        campaignsByIndex[usernameToIndex[username]].push(numOfCamp);
        numOfCamp += 1;
        transactionsByIdCamp.push([0]);
        return true;
    }
 
    function getCampaign (uint256 idCampaign) public view returns (uint256 id,address creator,int256 numOfToken,uint256 numberOfTrans){
        Campaign memory camp = idToCampaign[idCampaign];
        return (camp.id,camp.creator,camp.numOfToken,camp.numOfTrans);
    }
 
    function donate(uint256 tokens,uint256 idCampaign,bytes16 username,bytes password) public returns (bool success){
        require(checkAuth(username,password));
        Account memory acc = accounts[usernameToIndex[username]];
        require(acc.token >= int256 (tokens));
        acc.token -= int256 (tokens);
        accounts[usernameToIndex[username]] = acc;
        
        Campaign memory camp = idToCampaign[idCampaign];
        camp.numOfToken += int256 (tokens);
        camp.numOfTrans += 1;
        idToCampaign[idCampaign] = camp;
        
        transactionLog memory trans = transactionLog(numOfTrans,usernameToIndex[username]
        ,idCampaign,tokens);
        transactionsByIdCamp[idCampaign].push(numOfTrans);
        idToTransLog[numOfTrans] = trans;
        numOfTrans += 1;
        return true;
    }
    
    function getUserCount() public view returns(uint count)
    {
        return addresses.length;
    }
    
    function getCampaignCount() public view returns(uint count)
    {
        return numOfCamp;
    }
    
    function getTransCount() public view returns(uint count)
    {
        return numOfTrans;
    }
}
