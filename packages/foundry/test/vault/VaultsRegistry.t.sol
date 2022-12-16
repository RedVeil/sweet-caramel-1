// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";
import { VaultsRegistry } from "../../src/vault/VaultsRegistry.sol";
import { VaultMetadata } from "../../src/interfaces/vault/IVaultsRegistry.sol";
import { WithContractRegistry, IContractRegistry } from "../utils/WithContractRegistry.sol";
import { MockERC20 } from "../utils/mocks/MockERC20.sol";
import { MockERC4626 } from "../utils/mocks/MockERC4626.sol";

contract VaultsRegistryTest is Test, WithContractRegistry {
  MockERC20 asset = new MockERC20("ERC20", "TEST", 18);
  MockERC4626 vault = new MockERC4626(asset, "ERC4626", "TEST-4626");
  VaultsRegistry registry;

  address nonOwner = makeAddr("non owner");

  address staking = makeAddr("staking");
  address submitter = makeAddr("submitter");
  address swapAddress = makeAddr("swap address");

  string constant metadataCid = "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR";
  address[8] swapTokenAddresses;

  event VaultAdded(address vaultAddress, string metadataCID);

  function setUp() public {
    _adminPrepare();

    for (uint256 i; i < 8; ++i) {
      swapTokenAddresses[i] = address(uint160(i));
    }

    registry = new VaultsRegistry(address(this));
  }

  /*//////////////////////////////////////////////////////////////
                          REGISTER_VAULT
    //////////////////////////////////////////////////////////////*/
  function test__registerVault() public {
    VaultMetadata memory vaultParams = VaultMetadata({
      vaultAddress: address(vault),
      staking: staking,
      submitter: submitter,
      metadataCID: metadataCid,
      swapTokenAddresses: swapTokenAddresses,
      swapAddress: swapAddress,
      exchange: 1
    });

    vm.expectEmit(false, false, false, true);
    emit VaultAdded(address(vault), metadataCid);

    registry.registerVault(vaultParams);

    VaultMetadata memory savedVault = registry.getVault(address(vault));

    assertEq(savedVault.vaultAddress, address(vault));
    assertEq(savedVault.staking, staking);
    assertEq(savedVault.submitter, submitter);
    assertEq(savedVault.metadataCID, metadataCid);
    assertEq(savedVault.swapAddress, swapAddress);
    assertEq(savedVault.exchange, 1);

    for (uint256 i; i < 8; ++i) {
      assertEq(savedVault.swapTokenAddresses[i], address(uint160(i)));
    }
  }

  function test__registerVault_nonOwner() public {
    VaultMetadata memory vaultParams = VaultMetadata({
      vaultAddress: address(vault),
      staking: staking,
      submitter: submitter,
      metadataCID: metadataCid,
      swapTokenAddresses: swapTokenAddresses,
      swapAddress: swapAddress,
      exchange: 1
    });

    vm.prank(nonOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    registry.registerVault(vaultParams);
  }

  function test__registerVault_vault_already_registered() public {
    VaultMetadata memory vaultParams = VaultMetadata({
      vaultAddress: address(vault),
      staking: staking,
      submitter: submitter,
      metadataCID: metadataCid,
      swapTokenAddresses: swapTokenAddresses,
      swapAddress: swapAddress,
      exchange: 1
    });

    registry.registerVault(vaultParams);

    vm.expectRevert(VaultsRegistry.VaultAlreadyRegistered.selector);
    registry.registerVault(vaultParams);
  }
}
