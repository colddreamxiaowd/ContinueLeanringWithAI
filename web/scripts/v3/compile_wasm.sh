#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
clang++ --target=wasm32-unknown-unknown -std=c++17 -O0 -nostdlib -fno-exceptions -fno-rtti \
 -Wl,--no-entry -Wl,--strip-all -Wl,--export-all \
 experiments/sparse-transpose/engine.cpp -o public/wasm/sparse_transpose.wasm
printf 'Compiled public/wasm/sparse_transpose.wasm\n'
