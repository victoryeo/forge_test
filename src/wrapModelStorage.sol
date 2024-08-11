// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";

library Model {
    struct Item {
        uint256[16] A;

        // Uncommenting the following line makes the test fail due to
        // vm.expectRevert() not managing the revert message correctly.
        //uint8 B;
    }
}

library ModelStorage {
    error InvalidID();

    struct Storage {
        mapping (uint32 => Model.Item) Map;
    }
    function set(Storage storage data, uint32 id, Model.Item calldata item)
        internal
    {
        data.Map[id] = item;
    }

    function unset(Storage storage data, uint32 id)
        internal
    {
        delete data.Map[id];
    }
  function get(Storage storage data, uint32 id)
        internal view
        exist(data, id)
        returns (Model.Item storage item)
    {
        item = data.Map[id];
    }

    modifier exist(Storage storage data, uint32 id) {
        if (data.Map[id].A[0] == 0) revert InvalidID();
        _;
    }
}

contract wrapModelStorage {
    using ModelStorage for ModelStorage.Storage;

    ModelStorage.Storage data;

    function set(uint32 id, Model.Item calldata item)
        public
    {
        data.set(id, item);        
    }

    function unset(uint32 id)
        public
    {
        data.unset(id);
    }

    function get(uint32 id)
        public view
        returns (Model.Item memory item)
    {
        item = data.get(id);
    }    
}

