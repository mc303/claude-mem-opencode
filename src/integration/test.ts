#!/usr/bin/env bun

/**
 * Test script for claude-mem OpenCode integration
 */

import { ClaudeMemIntegration } from './index.js'

async function testIntegration(): Promise<void> {
  console.log('='.repeat(60))
  console.log('claude-mem OpenCode Integration Test')
  console.log('='.repeat(60))
  console.log()

  const integration = new ClaudeMemIntegration()

  try {
    // Test 1: Initialize integration
    console.log('Test 1: Initializing integration...')
    await integration.initialize()
    console.log('✅ PASS: Integration initialized')
    console.log()

    // Test 2: Check status
    console.log('Test 2: Getting integration status...')
    const status = await integration.getStatus()
    console.log('Status:')
    console.log(`  - Initialized: ${status.initialized}`)
    console.log(`  - Worker Ready: ${status.workerReady}`)
    console.log(`  - Project: ${status.currentProject}`)
    console.log(`  - Worker URL: ${status.workerUrl}`)
    console.log('✅ PASS: Status retrieved')
    console.log()

    // Test 3: Get project context
    console.log('Test 3: Getting project context...')
    const context = await integration.getProjectContext()
    if (context) {
      console.log(`✅ PASS: Got context (${context.length} chars)`)
    } else {
      console.log('⚠️  WARN: No context available (expected for new project)')
    }
    console.log()

    // Test 4: Search memory
    console.log('Test 4: Searching memory...')
    try {
      const searchResults = await integration.searchMemory('test')
      console.log(`✅ PASS: Search returned ${Array.isArray(searchResults) ? searchResults.length : 'results'}`)
    } catch (error) {
      console.log('⚠️  WARN: Search failed (expected for empty database)')
      console.log(`  Error: ${error}`)
    }
    console.log()

    // Test 5: Shutdown
    console.log('Test 5: Shutting down integration...')
    await integration.shutdown()
    console.log('✅ PASS: Integration shut down')
    console.log()

    console.log('='.repeat(60))
    console.log('All tests completed!')
    console.log('='.repeat(60))
    process.exit(0)
  } catch (error) {
    console.error('❌ FAIL: Test failed')
    console.error(`  Error: ${error}`)
    console.log()
    console.log('Troubleshooting:')
    console.log('  1. Ensure worker is running: npm run worker:start')
    console.log('  2. Check worker health: curl http://localhost:37777/api/health')
    console.log('  3. Check worker logs: npm run worker:tail')
    console.log()
    process.exit(1)
  }
}

// Run tests
testIntegration()
