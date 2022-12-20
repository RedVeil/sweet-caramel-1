Deployment script for Goerli:

forge script ./script/benGov/BeneficiaryGovernanceDeployment.s.sol:DeployBenGov -vvv --rpc-url https://goerli.infura.io/v3/5c244fcd48af4896ab389b3e8063ea56 --broadcast --verify

Adding nomination proposals

forge script ./script/benGov/AddNominationProposal.s.sol:AddProposal --rpc-url <RPC_URL> --chain-id 5 --sender <YOUR_ADDRESS> --broadcast

