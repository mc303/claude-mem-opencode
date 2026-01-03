---
name: Compatibility Issue
about: Automated issue created when compatibility test fails
title: '[COMPAT] '
labels: ['compatibility', 'automated']
---

## Summary

This issue was automatically created by compatibility testing workflow when testing opencode-mem against a new version of claude-mem.

## Details

- **claude-mem Version**: <!-- filled by workflow -->
- **opencode-mem Version**: <!-- filled by workflow -->
- **Test Run**: <!-- filled by workflow -->
- **Date**: <!-- filled by workflow -->

## What Failed

<!-- Filled by workflow with test failure details -->

## Impact

This version of claude-mem may have breaking changes to the Worker API that require updates to opencode-mem.

## Next Steps for Maintainers

1. [ ] Review test run logs
2. [ ] Identify which API endpoints changed
3. [ ] Update opencode-mem to match new API
4. [ ] Update `API_CONTRACT.md` if needed
5. [ ] Re-run compatibility test
6. [ ] Close this issue when version is marked as compatible

## Additional Context

<!-- Any additional context from workflow -->
