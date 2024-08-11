// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {wrapModelStorage} from "../src/wrapModelStorage.sol";
import {ModelStorage} from "../src/wrapModelStorage.sol";

contract Reverter {
    event EvTest();

    function emitAndRevert() external {
        emit EvTest();
        revert();
    }

    function revertWithoutReason() external {
        revert ModelStorage.InvalidID();
    }
}

contract testModelStorage is Test {
    function testGet()
        public
    {
        wrapModelStorage wrap = new wrapModelStorage(); 
        Reverter reverter = new Reverter();
        vm.expectRevert(ModelStorage.InvalidID.selector);
        reverter.revertWithoutReason();

        //wrap.unset(1);
        //wrap.get(10);
    }
}
