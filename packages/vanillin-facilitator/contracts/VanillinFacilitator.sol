pragma solidity ^0.4.12;


/*
    VanillinFacilitator Contract

    It emits necessary events from and to participants
*/
contract VanillinFacilitator {

    event IPFSOnly(address from, address indexed to, string ipfsRef, uint timestampt);
    event DiffieIPFS(address from, address indexed to, string gB, string ipfsRef, uint timestampt);
    event DiffieOnly(address from, address indexed to, string gA, uint timestampt);

    // sends the diffie helman key (G^A) to user B.
    function init(address to, string gA) public {
        DiffieOnly(msg.sender, to, gA, now);
    }

    //this is the second part of diffie helman
    function reply(address to, string gB, string ipfsRef) public {
        DiffieIPFS(msg.sender, to, gB, ipfsRef, now);
    }

    // this function sends the IPFS refence from user A to B
    // both user's can then query IPFS and decrypt the data outside the contract
    function finalize(address to, string ipfsRef) public {
        IPFSOnly(msg.sender, to, ipfsRef, now);
    }
}
