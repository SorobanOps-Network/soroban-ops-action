# Soroban-Ops Automated Performance Pipeline

<div align="center">

[![CI Build Status](https://img.shields.io/github/actions/workflow/status/SorobanOps-Network/soroban-ops-action/test-action.yml?branch=main&style=flat-square&label=Build%20Status)](https://github.com/SorobanOps-Network/soroban-ops-action/actions/workflows/test-action.yml)
[![Version](https://img.shields.io/github/package-json/v/SorobanOps-Network/soroban-ops-action?style=flat-square&color=blue)](https://github.com/SorobanOps-Network/soroban-ops-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

An automated testing framework engine designed to trace optimization metrics for Stellar Soroban Smart Contracts.

## Prerequisites
- **Node.js** (v18 or newer)
- **Rust Toolchain** (`wasm32-unknown-unknown` targets profile)
- **Docker & Docker Compose**

## Quick Start (Usage)

When using your tools inside your personal smart contract repository, you can implement the Infrastructure in each repo by formatting their workflow file like this:

```yaml
# Example workflow inside a target contract repository using our tools
steps:
- name: Checkout Target Contract Code
  uses: actions/checkout@v4

- name: Boot Soroban-Ops Infrastructure Node Network
  run: |
    # Pull down the compose file from our infrastructure repository
    curl -sSL https://raw.githubusercontent.com/SorobanOps-Network/soroban-ops-docker/main/docker/docker-compose.standalone.yml -o docker-compose.yml
    docker-compose up -d
    
- name: Run Profile Analyzer Reporting Action
  # Invoke our custom action repository cleanly as a native extension dependency
  uses: SorobanOps-Network/soroban-ops-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Quickstart Setup Checklist
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build local workspace components targets:

   ```bash
   npm run build
   ```

3. Run test verification validation suites:

   ```bash
   npm run test
   ```
