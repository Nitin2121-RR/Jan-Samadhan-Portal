---
inclusion: fileMatch
fileMatchPattern: "**/*ai*"
---

# AI Integration Guidelines

## Google Gemini Integration

### API Configuration
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
```

### Prompt Engineering Best Practices
- Use structured prompts with clear instructions
- Provide examples for better classification accuracy
- Include context about the civic domain
- Use consistent formatting for responses

### Image Analysis Prompts
```typescript
const analyzeImagePrompt = `
Analyze this image for civic issues. Respond with JSON:
{
  "is_civic": boolean,
  "category": "pothole|garbage_dump|streetlight|pipe_leak|traffic_signal|fallen_tree|manhole|footpath|dead_animal|clogged_drain|live_wire|dirty_water|bus_stop|park_damage|road_markings",
  "severity": number (1-10),
  "description": "detailed description",
  "confidence": number (0-1),
  "department": "PWD|Sanitation|Electricity Board|Water Supply Board|Traffic & Transport|Horticulture"
}

Consider safety risks, public impact, and infrastructure damage for severity scoring.
`;
```

### Error Handling and Fallbacks
- Implement retry logic with exponential backoff
- Handle API rate limiting gracefully
- Provide manual classification fallback
- Log AI responses for quality monitoring

### Response Validation
```typescript
import { z } from 'zod';

const AIResponseSchema = z.object({
  is_civic: z.boolean(),
  category: z.enum(['pothole', 'garbage_dump', /* ... */]),
  severity: z.number().min(1).max(10),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  department: z.enum(['PWD', 'Sanitation', /* ... */])
});
```

## Vector Embeddings for Deduplication

### Embedding Generation
- Use text embeddings for issue descriptions
- Store embeddings in database for similarity search
- Implement cosine similarity for duplicate detection
- Set appropriate similarity thresholds

### Duplicate Detection Logic
```typescript
const findSimilarIssues = async (embedding: number[], threshold = 0.85) => {
  // Use vector similarity search
  const similarIssues = await searchSimilarEmbeddings(embedding, threshold);
  return similarIssues.filter(issue => issue.similarity > threshold);
};
```

## AI Quality Monitoring

### Confidence Scoring
- Track AI confidence scores over time
- Flag low-confidence classifications for review
- Use confidence scores for automatic vs manual routing
- Implement feedback loops for model improvement

### Performance Metrics
- Monitor classification accuracy
- Track false positive/negative rates
- Measure response times and API usage
- Analyze user correction patterns

### Continuous Improvement
- Collect user feedback on AI classifications
- Retrain models with corrected data
- A/B test different prompt strategies
- Monitor and adjust classification thresholds

## Privacy and Security

### Data Handling
- Minimize data sent to AI services
- Implement proper data anonymization
- Use secure API key management
- Comply with data protection regulations

### Content Filtering
- Implement content moderation for user uploads
- Filter sensitive or inappropriate content
- Validate image types and sizes
- Scan for malicious content