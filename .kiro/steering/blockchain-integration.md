---
inclusion: fileMatch
fileMatchPattern: "**/*blockchain*"
---

# Blockchain Integration Guidelines

## Smart Contract Development

### Contract Standards
- Use OpenZeppelin contracts for security standards
- Implement proper access controls (Ownable, AccessControl)
- Use ReentrancyGuard for state-changing functions
- Follow Checks-Effects-Interactions pattern

### Gas Optimization
- Use `uint256` instead of smaller uints when possible
- Pack struct variables efficiently
- Use events for data that doesn't need on-chain storage
- Implement batch operations where applicable

### Security Best Practices
- Use latest Solidity version with security fixes
- Implement proper input validation
- Use SafeMath for arithmetic operations (pre-0.8.0)
- Conduct thorough testing with edge cases

## Frontend Blockchain Integration

### Web3 Connection
```typescript
// Use ethers.js for blockchain interactions
import { ethers } from 'ethers';

// Proper provider initialization
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
```

### Contract Interaction Patterns
- Always handle transaction failures gracefully
- Implement proper loading states for blockchain operations
- Use event listeners for real-time updates
- Cache contract instances for performance

### Error Handling
```typescript
try {
  const tx = await contract.submitGrievance(data);
  await tx.wait(); // Wait for confirmation
} catch (error) {
  if (error.code === 'USER_REJECTED') {
    // Handle user rejection
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    // Handle insufficient funds
  }
}
```

## Backend Blockchain Integration

### Event Monitoring
- Use WebSocket connections for real-time event monitoring
- Implement proper event filtering and processing
- Handle blockchain reorganizations
- Store processed events to prevent reprocessing

### Transaction Management
- Implement proper nonce management
- Use appropriate gas limits and prices
- Handle pending transactions
- Implement retry mechanisms for failed transactions

## Testing Blockchain Components

### Local Development
- Use Hardhat for local blockchain development
- Deploy contracts to local network for testing
- Use Hardhat console for contract debugging
- Implement comprehensive test suites

### Integration Testing
- Test contract interactions with frontend
- Verify event emission and handling
- Test error scenarios and edge cases
- Use testnet for pre-production testing

## Deployment and Monitoring

### Contract Deployment
- Use deployment scripts with proper verification
- Implement upgrade patterns where necessary
- Document contract addresses and ABIs
- Verify contracts on block explorers

### Monitoring
- Monitor contract events and transactions
- Set up alerts for unusual activity
- Track gas usage and optimization opportunities
- Monitor contract balance and state changes