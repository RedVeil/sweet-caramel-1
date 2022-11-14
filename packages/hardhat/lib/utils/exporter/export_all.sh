#! /bin/bash

if [ "$CI" = "true" ]; then
echo "Using CI exporter"
EXPORTER=./musl-exporter
else
echo "Using local exporter"
EXPORTER=./target/release/exporter
fi

NAMED_ACCOUNTS=../namedAccounts.json
OUT_DIR=out

if [ ! -f "$OUT_DIR/hardhat-deployment.json" ]
then
  $EXPORTER create-deployment --named-accounts $NAMED_ACCOUNTS -n hardhat -c 1337  -o $OUT_DIR/hardhat-deployment.json
fi

$EXPORTER create-deployment --named-accounts $NAMED_ACCOUNTS -n mainnet -c 1  -o $OUT_DIR/mainnet-deployment.json
$EXPORTER create-deployment --named-accounts $NAMED_ACCOUNTS -n polygon -c 137  -o $OUT_DIR/polygon-deployment.json
$EXPORTER create-deployment --named-accounts $NAMED_ACCOUNTS -n bsc -c 56  -o $OUT_DIR/bsc-deployment.json
$EXPORTER create-deployment --named-accounts $NAMED_ACCOUNTS -n arbitrum -c 42161  -o $OUT_DIR/arbitrum-deployment.json
$EXPORTER create-deployment --named-accounts $NAMED_ACCOUNTS -n rinkeby -c 4  -o $OUT_DIR/rinkeby-deployment.json

$EXPORTER merge --inputs $NAMED_ACCOUNTS,$OUT_DIR/hardhat-deployment.json --network mainnet --out $OUT_DIR/hardhat-merge.json -c 1337
$EXPORTER merge --inputs $NAMED_ACCOUNTS,$OUT_DIR/polygon-deployment.json --network polygon --out $OUT_DIR/polygon-merge.json -c 137
$EXPORTER merge --inputs $NAMED_ACCOUNTS,$OUT_DIR/arbitrum-deployment.json --network arbitrum --out $OUT_DIR/arbitrum-merge.json -c 42161
$EXPORTER merge --inputs $NAMED_ACCOUNTS,$OUT_DIR/mainnet-deployment.json --network mainnet --out $OUT_DIR/mainnet-merge.json -c 1
$EXPORTER merge --inputs $NAMED_ACCOUNTS,$OUT_DIR/bsc-deployment.json --network bsc --out $OUT_DIR/bsc-merge.json -c 56
$EXPORTER merge --inputs $NAMED_ACCOUNTS,$OUT_DIR/rinkeby-deployment.json --network rinkeby --out $OUT_DIR/rinkeby-merge.json -c 4

$EXPORTER combine --inputs $OUT_DIR/hardhat-merge.json,$OUT_DIR/polygon-merge.json,$OUT_DIR/arbitrum-merge.json,$OUT_DIR/mainnet-merge.json,$OUT_DIR/bsc-merge.json,$OUT_DIR/rinkeby-merge.json --out $OUT_DIR/deployments.json

echo "exported deployments to" $PWD/$OUT_DIR/deployments.json