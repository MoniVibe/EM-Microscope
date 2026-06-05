#!/usr/bin/env python3
"""AprilTag detector scaffold for a future L7.8 pass.

L7.7 does not implement AprilTag decoding. This file exists only to reserve the
tool boundary and to keep the docs honest.
"""

from __future__ import annotations


def main() -> int:
    raise SystemExit(
        "AprilTag decoding is not implemented in L7.7. Use the OpenCV ChArUco external helper or add a real "
        "AprilTag dependency and receipt-preserving implementation in a later pass."
    )


if __name__ == "__main__":
    main()
