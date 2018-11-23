pragma solidity ^0.4.24;

contract Funding {
    
    mapping (address => uint) private addressToIndex; // get Index from Address
    mapping (bytes16 => uint) private usernameToIndex; // get Index from Username
    mapping (address => Account) private addressToAccount; // get Account from Address
    mapping (bytes => uint) private ipfsHashToIndex;
    mapping (uint => Campaign) private idToCampaign; // get Campaign from id of a campaign
    mapping (uint => transactionLog) private idToTransLog; // get transactionLog from id of transactionLog
    
    Account[] private accounts;
    address[] private addresses;
    bytes16[] private usernames;
    bytes[] private ipfsHashes; 
    int256[][] private tokenExchangeLogs;
    uint256[][] private campaignsByIndex;
    uint256[][] private transactionsByIdCamp;
    uint256 private numOfCamp;
    uint256 private numOfTrans;
    
    constructor () public {
        Account memory acc = Account("admin","charity","not-available",0);
        
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
        bytes ipfsHash;
        int token;
    }
    
    struct transactionLog{
        uint256 id;
        uint256 fromIndexAcc;
        uint toIdCamp;
        uint numOfToken;
        bytes ipfsHash;
    }
    
    struct Campaign{
        uint id;
        address creator;
        int numOfToken;
        uint numOfTrans;
        bytes ipfsHash;
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

    function createAccount(bytes16 username,bytes password,bytes ipfsHash) public returns (bool success)
    {
        require(!hadAccount(msg.sender));
        require(!usernameTaken(username));
        Account memory acc = Account (username,password,ipfsHash,0);
        
        accounts.push(acc);
        usernames.push(username);
        addresses.push(msg.sender);
        ipfsHashes.push(ipfsHash);
        tokenExchangeLogs.push([0]);
        campaignsByIndex.push([0]);
        
        addressToIndex[msg.sender] = addresses.length - 1;
        addressToAccount[msg.sender] = acc;
        usernameToIndex[username] = usernames.length - 1;
        ipfsHashToIndex[ipfsHash] = ipfsHashes.length - 1;
        
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
        accounts[usernameToIndex[acc.username]] = Account(acc.username,acc.password,acc.ipfsHash,acc.token);
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
    
    function getUserProfile(bytes16 username,bytes password) public view returns (address addr,bytes16 usrname,bytes pwd,int256 token,bytes ipfsHash){
        require(checkAuth(username,password));
        Account memory acc = accounts[usernameToIndex[username]];
        return (addresses[usernameToIndex[username]],acc.username,acc.password,acc.token,acc.ipfsHash);
    }

    function getTokenExchangeLog (bytes16 username) public view returns(int256[] tokensExchange){
        return tokenExchangeLogs[usernameToIndex[username]];
    }
    
    function createCampaign(bytes16 username,bytes campaignIpfsHash) public returns (bool success){
        require(usernameTaken(username));
        Campaign memory camp = Campaign(numOfCamp,addresses[usernameToIndex[username]],0,0,campaignIpfsHash);
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
 
    function donate(uint256 tokens,uint256 idCampaign,bytes16 username,bytes password,bytes transIpfsHash) public returns (bool success){
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
        ,idCampaign,tokens,transIpfsHash);
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
