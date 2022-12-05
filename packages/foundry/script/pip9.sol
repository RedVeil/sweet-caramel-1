// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import {Script} from "forge-std/Script.sol";
import "forge-std/Test.sol";

interface PopLocker {
    function lock(address _account, uint256 _amount, uint256 _spendratio) external;
}

interface ERC20 {
    function approve(address _spender, uint256 _amount) external;
    function balanceOf(address account) external returns (uint256);
    function allowance(address owner, address spender) external returns (uint256);
}
// @notice This script will lock tokens for recipients according to PIP-9
contract pip9 is Script {
    PopLocker public constant popLocker = PopLocker(0xe8af04AD759Ad790Aa5592f587D3cFB3ecC6A9dA);
    ERC20 public constant pop = ERC20(0xC5B57e9a1E7914FDA753A88f24E5703e617Ee50c);

    using stdJson for string;


    /// @notice The main script entrypoint
    function run() external {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/data/pip-9.json");
        string memory json = vm.readFile(path);
        address[] memory addresses = json.readAddressArray(".addresses");
        string[] memory amounts = json.readStringArray(".amounts"); // for some reason was not reading value correctly as uin256[]

        vm.startBroadcast();
        pop.approve(address(popLocker), 10_000 ether);
        uint256 sent;
        for (uint256 i = 0; i < addresses.length; i++) {
            (uint256 amount, bool error) = strToUint(amounts[i]);
            console.log("Locking ",amount, "POP for", addresses[i]);
            console.log( "(", amount / 1e18 ,")");
            
            popLocker.lock(addresses[i], amount / 1e18 * 1 ether, 0);

            sent += amount;
            console.log("sent", sent / 1e18);
        }

        vm.stopBroadcast();
    }

    function strToUint(string memory _str) public pure returns (uint256 res, bool err) {
        for (uint256 i = 0; i < bytes(_str).length; i++) {
            if ((uint8(bytes(_str)[i]) - 48) < 0 || (uint8(bytes(_str)[i]) - 48) > 9) {
                return (0, false);
            }
            res += (uint8(bytes(_str)[i]) - 48) * 10 ** (bytes(_str).length - i - 1);
        }

        return (res, true);
    }
}
