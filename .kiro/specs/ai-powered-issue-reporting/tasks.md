# Implementation Plan: AI-Powered Issue Reporting

## Overview

This implementation plan breaks down the AI-Powered Issue Reporting feature into discrete coding tasks that build incrementally. The approach focuses on core functionality first, with testing integrated throughout to catch issues early. Each task builds on previous work and includes specific requirements validation.

## Tasks

- [x] 1. Set up core project structure and types
  - Create TypeScript interfaces for IssueTicker, AIClassificationResult, Department, and Category models
  - Set up Supabase client configuration and database connection
  - Create master data structure for departments and categories
  - _Requirements: 7.1, 7.4_

- [x] 1.2 Update dependencies for free maps integration
  - Remove Mapbox dependencies (mapbox-gl, @types/mapbox-gl)
  - Add Leaflet and React-Leaflet for free OSM maps
  - Configure TypeScript types for Leaflet
  - _Requirements: 8.1_

- [ ] 1.1 Write property test for master data consistency
  - **Property 14: Master Data Consistency**
  - **Validates: Requirements 7.3, 7.4**

- [ ] 2. Implement camera interface component
  - [x] 2.1 Create CameraCapture component with device camera access
    - Implement camera initialization with permission handling
    - Add support for front/rear camera switching on mobile devices
    - Include fallback to file upload when camera unavailable
    - _Requirements: 1.1, 1.5, 1.3_

  - [ ] 2.2 Write property test for camera interface activation
    - **Property 1: Camera Interface Activation**
    - **Validates: Requirements 1.1**

  - [ ] 2.3 Write property test for camera type support
    - **Property 3: Camera Type Support**
    - **Validates: Requirements 1.5**

- [x] 3. Implement geolocation service and maps integration
  - [x] 3.1 Create GeolocationService for GPS coordinate capture
    - Implement getCurrentLocation() with accuracy metadata
    - Add reverseGeocode() for human-readable addresses
    - Include error handling for GPS unavailable scenarios
    - _Requirements: 1.2, 1.4, 6.3_

  - [x] 3.2 Create MapWidget component for interactive maps
    - Implement map initialization with Leaflet and OpenStreetMap tiles
    - Add draggable marker for precise location selection
    - Include zoom controls and multiple OSM tile layer options
    - Support centering on user's current location
    - Integrate Nominatim geocoding for address search
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

  - [x] 3.3 Implement issue visualization on maps
    - Display issue markers with category icons and severity colors
    - Add issue popup/sidebar on marker click
    - Include issue clustering for dense areas
    - Support filtering issues by category or status
    - _Requirements: 8.4, 8.5_

  - [x] 3.4 Add location validation and service area boundaries
    - Implement coordinate validation against service boundaries
    - Add visual indicators for service area limits
    - Include fallback messaging for out-of-area locations
    - _Requirements: 8.7_

  - [x] 3.5 Write unit tests for geolocation error handling
    - Test GPS unavailable scenarios
    - Test location permission denied cases
    - Test invalid coordinate boundary checking
    - _Requirements: 1.4, 6.3_

  - [x] 3.6 Write property tests for maps functionality
    - **Property 16: Map Widget Initialization**
    - **Property 17: Location Marker Precision**
    - **Property 18: Issue Marker Display**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.7**

- [ ] 4. Implement AI analysis engine
  - [x] 4.1 Create AIAnalysisEngine with Gemini API integration
    - Implement analyzeImage() method with structured prompting
    - Add validateClassification() for response schema validation
    - Include retryAnalysis() with exponential backoff for API failures
    - _Requirements: 2.1, 2.2, 6.1_

  - [ ] 4.2 Write property test for AI analysis triggering
    - **Property 4: AI Analysis Triggering**
    - **Validates: Requirements 2.1**

  - [ ] 4.3 Write property test for structured classification response
    - **Property 5: Structured Classification Response**
    - **Validates: Requirements 2.2**

  - [ ] 4.4 Write property test for category mapping consistency
    - **Property 6: Category Mapping Consistency**
    - **Validates: Requirements 2.3, 2.5, 7.1**

- [ ] 5. Implement severity assessment and SLA logic
  - [ ] 5.1 Create SeverityAssessor component
    - Implement severity score validation (1-10 range)
    - Add SLA timeline assignment based on severity levels
    - Include integration with escalation matrix
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 5.2 Write property test for severity score validity
    - **Property 7: Severity Score Validity**
    - **Validates: Requirements 3.1**

  - [ ] 5.3 Write property test for SLA assignment logic
    - **Property 8: SLA Assignment Logic**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ] 6. Checkpoint - Ensure core AI processing works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement ticket management system
  - [ ] 7.1 Create TicketManager for database operations
    - Implement createTicket() with unique ID generation
    - Add updateTicketStatus() for status transitions
    - Include complete data persistence (image, metadata, AI results)
    - _Requirements: 4.2, 4.4, 4.5, 1.2_

  - [ ] 7.2 Write property test for ticket creation on confirmation
    - **Property 10: Ticket Creation on Confirmation**
    - **Validates: Requirements 4.2, 4.4**

  - [ ] 7.3 Write property test for complete data persistence
    - **Property 2: Complete Data Persistence**
    - **Validates: Requirements 1.2, 4.5**

- [ ] 8. Implement user interface and feedback system
  - [x] 8.1 Create IssueReportingInterface component
    - Build camera capture UI with real-time feedback
    - Add AI analysis results display with user confirmation
    - Include loading states and progress indicators
    - Implement error messaging and retry options
    - _Requirements: 4.1, 5.1, 5.3, 5.4_

  - [ ] 8.2 Write property test for user feedback consistency
    - **Property 9: User Feedback Consistency**
    - **Validates: Requirements 4.1, 5.1, 5.3**

- [ ] 9. Implement performance and offline capabilities
  - [ ] 9.1 Add response time optimization
    - Implement 5-second response time requirement
    - Add performance monitoring and optimization
    - _Requirements: 5.2_

  - [ ] 9.2 Create offline queue management
    - Implement local storage for offline submissions
    - Add automatic sync when connectivity restored
    - Include queue status indicators for users
    - _Requirements: 5.5, 6.1_

  - [ ] 9.3 Write property test for response time performance
    - **Property 11: Response Time Performance**
    - **Validates: Requirements 5.2**

  - [ ] 9.4 Write property test for offline queue management
    - **Property 12: Offline Queue Management**
    - **Validates: Requirements 5.5, 6.1**

- [ ] 10. Implement comprehensive error handling
  - [ ] 10.1 Add input validation system
    - Implement data validation before storage
    - Add error handling for invalid inputs
    - Include user-friendly error messages
    - _Requirements: 6.5, 6.2_

  - [ ] 10.2 Write property test for input data validation
    - **Property 13: Input Data Validation**
    - **Validates: Requirements 6.5**

  - [ ] 10.3 Write unit tests for error scenarios
    - Test camera access denied fallback
    - Test non-civic image rejection
    - Test poor image quality handling
    - Test database failure recovery
    - _Requirements: 1.3, 2.4, 6.2, 6.4_

- [ ] 11. Implement API endpoints and backend integration
  - [x] 11.1 Create Next.js API routes for image analysis
    - Build /api/analyze-image endpoint with Gemini integration
    - Add /api/tickets endpoint for ticket CRUD operations
    - Include proper error handling and response formatting
    - _Requirements: 2.1, 4.2_

  - [ ] 11.2 Write property test for classification response completeness
    - **Property 15: Classification Response Completeness**
    - **Validates: Requirements 7.5**

- [ ] 12. Integration and final wiring
  - [ ] 12.1 Connect all components in main reporting flow
    - Wire camera → AI analysis → user confirmation → ticket creation
    - Integrate error handling and offline capabilities
    - Add proper loading states and user feedback throughout
    - _Requirements: All requirements integration_

  - [ ] 12.2 Write integration tests for end-to-end flows
    - Test complete reporting workflow
    - Test error recovery scenarios
    - Test offline-to-online sync
    - _Requirements: Complete workflow validation_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks include comprehensive testing from the start for robust development
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests ensure components work together correctly
- The implementation uses TypeScript for type safety and better development experience