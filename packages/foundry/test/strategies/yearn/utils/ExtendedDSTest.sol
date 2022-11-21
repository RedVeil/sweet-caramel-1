// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.12;

import { Test } from "forge-std/Test.sol";
import "forge-std/StdMath.sol";

contract ExtendedDSTest is Test {
  // Assert Gte with absolute amount of token delta (a >= b && a < b + maxDelta )
  function assertAbsGte(
    uint256 a,
    uint256 b,
    uint256 maxDelta
  ) internal virtual {
    if (b == 0) return assertEq(a, b); // If the expected is 0, actual must be too.

    uint256 delta = stdMath.delta(a, b);

    if (a < b) {
      emit log("Error: a ~>= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      fail();
    }
    if (delta > maxDelta) {
      emit log("Error: a ~>= b not satisfied [int]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      emit log_named_uint(" Max Delta", maxDelta);
      emit log_named_uint("     Delta", delta);
      fail();
    }
  }

  // Assert Gte with absolute amount of token delta (a >= b && a < b + maxDelta )
  function assertAbsGte(
    uint256 a,
    uint256 b,
    uint256 maxDelta,
    string memory err
  ) internal virtual {
    if (b == 0) return assertEq(a, b, err); // If the expected is 0, actual must be too.

    uint256 delta = stdMath.delta(a, b);

    if (a < b) {
      emit log_named_string("Error", err);
      emit log("Error: a ~>= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      fail();
    }
    if (delta > maxDelta) {
      emit log_named_string("Error", err);
      emit log("Error: a ~>= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      emit log_named_uint(" Max Delta", maxDelta);
      emit log_named_uint("     Delta", delta);
      fail();
    }
  }

  // Assert Lte with absolute amount of token delta (a <= b && a > b - maxDelta )
  function assertAbsLte(
    uint256 a,
    uint256 b,
    uint256 maxDelta
  ) internal virtual {
    if (b == 0) return assertEq(a, b); // If the expected is 0, actual must be too.

    uint256 delta = stdMath.delta(a, b);

    if (a > b) {
      emit log("Error: a ~<= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      fail();
    }
    if (delta > maxDelta) {
      emit log("Error: a ~<= b not satisfied [int]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      emit log_named_uint(" Max Delta", maxDelta);
      emit log_named_uint("     Delta", delta);
      fail();
    }
  }

  // Assert Lte with absolute amount of token delta (a <= b && a > b - maxDelta )
  function assertAbsLte(
    uint256 a,
    uint256 b,
    uint256 maxDelta,
    string memory err
  ) internal virtual {
    if (b == 0) return assertEq(a, b, err); // If the expected is 0, actual must be too.

    uint256 delta = stdMath.delta(a, b);

    if (a > b) {
      emit log_named_string("Error", err);
      emit log("Error: a ~<= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      fail();
    }
    if (delta > maxDelta) {
      emit log_named_string("Error", err);
      emit log("Error: a ~<= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      emit log_named_uint(" Max Delta", maxDelta);
      emit log_named_uint("     Delta", delta);
      fail();
    }
  }

  // TODO DELTA CALC IS WRONG
  // Assert Gte with percentage amount of token delta (a >= b && percDelta(a,b) <= maxPercentDelta )
  function assertApproxGteRel(
    uint256 a,
    uint256 b,
    uint256 maxPercentDelta
  ) internal virtual {
    if (b == 0) return assertEq(a, b); // If the expected is 0, actual must be too.

    uint256 percentDelta = stdMath.percentDelta(a, b);

    if (a < b) {
      emit log("Error: a ~>= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      fail();
    }
    if (percentDelta > maxPercentDelta) {
      emit log("Error: a ~>= b not satisfied [int]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      emit log_named_uint(" Max % Delta", maxPercentDelta);
      emit log_named_uint("     % Delta", percentDelta);
      fail();
    }
  }

  // Assert Gte with percentage amount of token delta (a >= b && percDelta(a,b) <= maxPercentDelta )
  function assertApproxGteRel(
    uint256 a,
    uint256 b,
    uint256 maxPercentDelta,
    string memory err
  ) internal virtual {
    if (b == 0) return assertEq(a, b, err); // If the expected is 0, actual must be too.

    uint256 percentDelta = stdMath.percentDelta(a, b);

    if (a < b) {
      emit log_named_string("Error", err);
      emit log("Error: a ~>= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      fail();
    }
    if (percentDelta > maxPercentDelta) {
      emit log_named_string("Error", err);
      emit log("Error: a ~>= b not satisfied [int]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      emit log_named_uint(" Max % Delta", maxPercentDelta);
      emit log_named_uint("     % Delta", percentDelta);
      fail();
    }
  }

  // Assert Lte with percentage amount of token delta (a <= b && percDelta(a,b) <= maxPercentDelta )
  function assertApproxLteRel(
    uint256 a,
    uint256 b,
    uint256 maxPercentDelta
  ) internal virtual {
    if (b == 0) return assertEq(a, b); // If the expected is 0, actual must be too.

    uint256 percentDelta = stdMath.percentDelta(a, b);

    if (a > b) {
      emit log("Error: a ~<= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      fail();
    }
    if (percentDelta > maxPercentDelta) {
      emit log("Error: a ~<= b not satisfied [int]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      emit log_named_uint(" Max % Delta", maxPercentDelta);
      emit log_named_uint("     % Delta", percentDelta);
      fail();
    }
  }

  // Assert Lte with percentage amount of token delta (a <= b && percDelta(a,b) <= maxPercentDelta )
  function assertApproxLteRel(
    uint256 a,
    uint256 b,
    uint256 maxPercentDelta,
    string memory err
  ) internal virtual {
    if (b == 0) return assertEq(a, b, err); // If the expected is 0, actual must be too.

    uint256 percentDelta = stdMath.percentDelta(a, b);

    if (a > b) {
      emit log_named_string("Error", err);
      emit log("Error: a ~<= b not satisfied [uint]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      fail();
    }
    if (percentDelta > maxPercentDelta) {
      emit log_named_string("Error", err);
      emit log("Error: a ~<= b not satisfied [int]");
      emit log_named_uint("  Expected", b);
      emit log_named_uint("    Actual", a);
      emit log_named_uint(" Max % Delta", maxPercentDelta);
      emit log_named_uint("     % Delta", percentDelta);
      fail();
    }
  }

  function assertAbsWithin(
    uint256 expected,
    uint256 actual,
    uint256 delta
  ) internal {
    if (expected > actual) {
      assertLe(expected - actual, delta);
    } else if (actual > expected) {
      assertLe(actual - expected, delta);
    } else {
      assertEq(expected, actual);
    }
  }
}
