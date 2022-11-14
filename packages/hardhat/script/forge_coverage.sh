#!/usr/bin/env bash

set -euo pipefail

main() {
  forge coverage --report lcov
  lcov -o lcov.info --remove lcov.info \
    "test/*" \
    "contracts/mocks/*" \
    "contracts/test_helpers/*" \
    "node_modules/*" \
    "../../node_modules/*"
  mkdir -p forge_coverage
  genhtml --branch-coverage -o forge_coverage lcov.info
}

main
