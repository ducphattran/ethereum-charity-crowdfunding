pragma solidity ^0.4.24;

contract Funding {
    
    mapping (address => uint) private addressToIndex; // get Index from Address
    mapping (bytes16 => uint) private usernameToIndex; // get Index from Username
    mapping (address => Account) private addressToAccount; // get Account from Address
    mapping (bytes => uint) private ipfsHashToIndex; // get Index from ipfsHash of Account
    mapping (uint => Campaign) private idToCampaign; // get Campaign from id of a campaign
    mapping (uint => transactionLog) private idToTransLog; // get transactionLog from id of transactionLog
    mapping (uint => tokenExchangeLog) private idToExchangeLog; // get tokenExchangeLog from id of tokenExchangeLog
    mapping (bytes => uint) private nameOfCampToIndex; //get Index from name of Campaign
    
    Account[] public accounts;
    address[] private addresses;
    bytes16[] private usernames;
    bytes[] private ipfsHashes; 
    uint256[][] private tokenExchangeLogs;
    bytes[] private namesOfCamp;
    uint256[][] private campaignsByIndex;
    uint256[][] private transactionsByIdCamp;
    uint256[][] private donateLogs;
    uint256 private numOfCamp;
    uint256 private numOfTrans;
    uint256 private numOfExchanges;
    
    constructor () public {
        Account memory acc = Account("admin","charity","not-available",0);
    
        accounts.push(acc);
        addresses.push(msg.sender);
        usernames.push("admin");
        campaignsByIndex.push([0]);
        donateLogs.push([0]);
        numOfCamp = 0;
        numOfTrans = 1; // watse 1st index of Transaction for each campaign
        numOfExchanges = 1;
        // create token exchange log 
        tokenExchangeLog memory tokenExLog  = tokenExchangeLog(0,acc.username,0,"not-available");
        idToExchangeLog[0] = tokenExLog;
        tokenExchangeLogs.push([0]);
        
        // create 1st campaign
        namesOfCamp.push("this campaign is used to waste the 1st index");
        nameOfCampToIndex["this campaign is used to waste the 1st index"] = namesOfCamp.length -1 ;
    }
    
    struct Account{
        bytes16 username;
        bytes password;
        bytes ipfsHash;
        int token;
    }
    
    struct transactionLog{
        uint256 id;
        bytes16 fromUsername;
        uint toIdCamp;
        int numOfToken;
        bytes ipfsHash;
    }
    
    struct tokenExchangeLog {
        uint256 id;
        bytes16 ownerUsername;
        int numOfToken;
        bytes ipfsHash;
    }
    
    struct Campaign{
        uint id;
        bytes name;
        bytes16 creator;
        int numOfToken;
        uint numOfTrans;
        bytes ipfsHash;
    }
    
    
    function getBal() public view returns(uint256 bal){
        return address (this).balance;
    }
    
    function nameOfCampTaken(bytes nameOfCamp) private view returns (bool) {
        return (keccak256(nameOfCamp) == keccak256("this campaign is used to waste the 1st index") 
        || nameOfCampToIndex[nameOfCamp] > 0 ); 
    }

    function hadAccount(address userAddress) private view returns (bool flag){
        return (addressToIndex[userAddress] > 0 || userAddress == addresses[0]);
    }
    
    function usernameTaken(bytes16 username) private view returns (bool flag){
        return (usernameToIndex[username] > 0 || username == "admin");
    }
    
    modifier minPrice (uint256 _amount){
        require(_amount >= 1000000000,"Value must be at least 1 gwei");
        _;
    }

    function updateAccount(bytes16 username,bytes password,bytes ipfsHash) public returns (bool success) {
        require(checkAuth(username,password));
        Account memory acc = accounts[usernameToIndex[username]];
        acc.ipfsHash = ipfsHash;
        accounts[usernameToIndex[acc.username]] = acc;
        return true;
    }

    function createAccount(bytes16 username,bytes password,bytes ipfsHash) public returns (bool success)
    {
        require(!hadAccount(msg.sender));
        require(!usernameTaken(username));
        Account memory acc = Account (username,password,ipfsHash,0);
        
        accounts.push(acc);
        usernames.push(username);
        addresses.push(msg.sender);
        ipfsHashes.push(ipfsHash);
        campaignsByIndex.push([0]);
        donateLogs.push([0]);
        
        addressToIndex[msg.sender] = addresses.length - 1;
        addressToAccount[msg.sender] = acc;
        usernameToIndex[username] = usernames.length - 1;
        ipfsHashToIndex[ipfsHash] = ipfsHashes.length - 1;
        
        
        // create token exchange log 
        tokenExchangeLog memory tokenExLog  = tokenExchangeLog(0,acc.username,0,"not-available");
        idToExchangeLog[0] = tokenExLog;
        tokenExchangeLogs.push([0]);
        
        return true;
    }
    
    function changePassword(bytes16 username,bytes oldPassword,bytes newPassword)
    public returns (bool success){
        require(checkAuth(username,oldPassword));
        Account memory acc = accounts[usernameToIndex[username]];
        acc.password = newPassword;
        accounts[usernameToIndex[acc.username]] = acc;
        return true;
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
    
    function getAddressByUsername(bytes16 username) public view returns(address){
        return addresses[usernameToIndex[username]];
    }

    function exchangeToToken(bytes ipfsHash) payable minPrice(msg.value) public returns (bool success){
        int256 numOfToken = int256(msg.value/1000000000);
        // get Account
        Account storage acc = addressToAccount[msg.sender];
        acc.token += numOfToken;
        accounts[usernameToIndex[acc.username]] = Account(acc.username,acc.password,acc.ipfsHash,acc.token);
        
        // create token exchange log 
        tokenExchangeLog memory tokenExLog  = tokenExchangeLog(numOfExchanges,acc.username,int256(numOfToken),ipfsHash);
        idToExchangeLog[numOfExchanges] = tokenExLog;
        tokenExchangeLogs[addressToIndex[msg.sender]].push(numOfExchanges);
        numOfExchanges +=1;
        
        return true;
    }
    
    function exchangeToEther(uint256 fromToken,bytes16 username, bytes password,bytes ipfsHash) public returns(bool success){
        require(checkAuth(username,password));
        
        // require(fromToken >= toEther*1000000000);
        Account memory acc = accounts[usernameToIndex[username]];
        require(uint256 (acc.token) >= fromToken);
        require(getBal() >= uint256 (fromToken*1000000000));
        msg.sender.transfer(fromToken*1000000000);
        acc.token -= int256(fromToken);
        accounts[usernameToIndex[acc.username]] = Account(acc.username,acc.password,acc.ipfsHash,acc.token);
        
        // create token exchange log 
        tokenExchangeLog memory tokenExLog  = tokenExchangeLog(numOfExchanges,acc.username,int256(fromToken)*-1,ipfsHash);
        idToExchangeLog[numOfExchanges] = tokenExLog;
        tokenExchangeLogs[usernameToIndex[acc.username]].push(numOfExchanges);
        numOfExchanges +=1;
        return true;
    }
    
    function getUserProfile(bytes16 username,bytes password) public view returns (address addr,bytes16 usrname,bytes pwd,int256 token,bytes ipfsHash){
        require(checkAuth(username,password));
        Account memory acc = accounts[usernameToIndex[username]];
        return (addresses[usernameToIndex[username]],acc.username,acc.password,acc.token,acc.ipfsHash);
    }

    function getListOfTokenExchangeLog (bytes16 username) public view returns(uint256[] tokensExchange){
        return tokenExchangeLogs[usernameToIndex[username]];
    }
    
    function getTokenExchangeLog (uint256 idTokenExchangeLog) 
    public view returns (uint256 idTokenExLog, bytes16 ownerUsername, int256 tokens, bytes ipfsHash){
        tokenExchangeLog memory exLog = idToExchangeLog[idTokenExchangeLog];
        return (exLog.id,exLog.ownerUsername,exLog.numOfToken,exLog.ipfsHash);
    }
    
    function getDonateLog (bytes16 username) public view returns(uint256[]){
        return donateLogs[usernameToIndex[username]];
    }
    
    function createCampaign(bytes16 username,bytes nameOfCamp,bytes campaignIpfsHash) public 
    returns (bool success){
        require(usernameTaken(username));
        require(!nameOfCampTaken(nameOfCamp));
        Campaign memory camp = Campaign(numOfCamp,nameOfCamp,username,0,0,campaignIpfsHash);
        idToCampaign[numOfCamp] = camp;
        campaignsByIndex[usernameToIndex[username]].push(numOfCamp);
        numOfCamp += 1;
        namesOfCamp.push(nameOfCamp);
        nameOfCampToIndex[nameOfCamp] = namesOfCamp.length - 1;
        transactionsByIdCamp.push([0]);
        return true;
    }

    function getListCampaignByUsername(bytes16 username) public 
    view returns (uint256[] campaignsList) {
        return campaignsByIndex[usernameToIndex[username]];
    }
    
    function getCampaign (uint256 idCampaign) public 
    view returns (uint256 id,bytes16 creatorUsername,int256 numOfToken,uint256 numberOfTrans,bytes ipfsHash){
        Campaign memory camp = idToCampaign[idCampaign];
        return (camp.id,camp.creator,camp.numOfToken,camp.numOfTrans,camp.ipfsHash);
    }
    
    function getTransactionListOfCamp(uint256 idCampaign) public view returns (uint256[] ids){
        return transactionsByIdCamp[idCampaign];
    }
        
    function getTransactionById(uint256 idTransaction) public
    view returns(uint256 id,bytes16 fromUsername,uint toIdCamp,int numOfToken,bytes ipfsHash){
        transactionLog memory trans = idToTransLog[idTransaction];
        return (trans.id,trans.fromUsername,trans.toIdCamp,trans.numOfToken,trans.ipfsHash);
    }
 
    function donate(uint256 tokens,uint256 idCampaign,bytes16 username,bytes password,bytes transIpfsHash,bytes exchangeIpfsHash) public returns (bool success){
        require(checkAuth(username,password));
        Account memory acc = accounts[usernameToIndex[username]];
        require(acc.token >= int256 (tokens));
        acc.token -= int256 (tokens);
        accounts[usernameToIndex[username]] = acc;
        
        Campaign memory camp = idToCampaign[idCampaign];
        camp.numOfToken += int256 (tokens);
        camp.numOfTrans += 1;
        idToCampaign[idCampaign] = camp;

        transactionLog memory trans = transactionLog(numOfTrans,username,idCampaign,int256(tokens),transIpfsHash);
        transactionsByIdCamp[idCampaign].push(numOfTrans);
        idToTransLog[numOfTrans] = trans;
        donateLogs[usernameToIndex[username]].push(numOfTrans);
        
        // create token exchange log 
        tokenExchangeLog memory tokenExLog  = tokenExchangeLog(numOfExchanges,acc.username,int256(tokens)*-1,exchangeIpfsHash);
        idToExchangeLog[numOfExchanges] = tokenExLog;
        tokenExchangeLogs[usernameToIndex[acc.username]].push(numOfExchanges);
        numOfExchanges +=1;
        numOfTrans += 1;
        return true;
    }
    
    function withDraw(bytes16 username, bytes password, uint256 idCampaign, uint256 withdrawTokens,bytes transIpfsHash,bytes exchangeIpfsHash)
    public returns (bool){
        require(checkAuth(username,password));
        Campaign memory camp = idToCampaign[idCampaign];
        require(camp.numOfToken >= int256(withdrawTokens));
        camp.numOfToken -= int256(withdrawTokens);
        idToCampaign[idCampaign] = camp;
        
        Account memory acc = accounts[usernameToIndex[username]];
        acc.token += int256 (withdrawTokens);
        accounts[usernameToIndex[username]] = acc;

        transactionLog memory trans = transactionLog(numOfTrans,username,idCampaign,int256(withdrawTokens)*-1,transIpfsHash);
        transactionsByIdCamp[idCampaign].push(numOfTrans);
        idToTransLog[numOfTrans] = trans;

        // create token exchange log 
        tokenExchangeLog memory tokenExLog  = tokenExchangeLog(numOfExchanges,acc.username,int256(withdrawTokens),exchangeIpfsHash);
        idToExchangeLog[numOfExchanges] = tokenExLog;
        tokenExchangeLogs[usernameToIndex[acc.username]].push(numOfExchanges);
        numOfExchanges +=1;
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
    function getExchangesCount() public view returns(uint count)
    {
        return numOfExchanges;
    }

}
