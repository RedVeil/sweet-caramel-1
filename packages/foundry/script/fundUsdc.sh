#!/usr/bin/env bash

cast rpc anvil_impersonateAccount 0xF977814e90dA44bFA03b6295A0616a897441aceC && cast send 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 \
--from 0xF977814e90dA44bFA03b6295A0616a897441aceC \
  "transfer(address,uint256)(bool)" \
  0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 \
  1000000000
