// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "Ownable.sol";

contract WeaveHash is Ownable {

    struct DataHash {
        uint id;
        string hash;
        string metadata;
    }

    event NewHash (
        address indexed sender,
        uint id,
        string hash,
        string metadata
    );

    mapping (uint => DataHash) Map;
    mapping (uint => uint) Indexes;
    uint public Count = 0;

    address public creator;

    constructor() public {
        creator = msg.sender;
    }

    function resetHashes() public onlyOwner {
       require(msg.sender == creator, "not authorized");
       Count = 0;
    }

    function release() public payable onlyOwner {
       require(msg.sender == creator, "not authorized");
       address payable addr = payable(address(creator));
       selfdestruct(addr);
    }

    function storeHash(
            uint id,
            string calldata hash,
            string calldata metadata
    ) public onlyOwner {
        require(msg.sender == creator, "not authorized");

        //TODO: check already existing. do we allow replace?
        //if we do, on replace we can still end with multiple mappings to the same id, the client needs to filter duplicates
        Map[id] = DataHash(id, hash, metadata);
        Indexes[Count++] = id;
        emit NewHash(msg.sender, id, hash, metadata);
    }

    function readHash(uint id) public view returns (DataHash memory) {
        return Map[id];
    }

    function readHashes() public view returns (string[] memory) {
        string[] memory ret = new string[](Count * 3 + 1);
        ret[0] = "x";
        //suboptimal code consuming a lot of gas, ignore for now
        for (uint i = 0; i < Count; i++) {
            uint id = Indexes[i];
            DataHash memory d = Map[id];

            uint p = i * 3 + 1;
            ret[p] = uint2str(id);
            ret[p + 1] = d.hash;
            ret[p + 2] = d.metadata;
        }
        return ret;
    }

    function uint2str(uint v) private pure returns (string memory) {
        if (v == 0) return "0";
        uint256 j = v;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory str = new bytes(length);
        uint256 k = length;
        j = v;
        while (j != 0) {
            str[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(str);
    }
}