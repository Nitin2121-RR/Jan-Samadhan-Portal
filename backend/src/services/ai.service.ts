import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/env';
import prisma from '../config/database';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// India-specific department mapping
const INDIA_DEPARTMENTS = {
  'Roads & Infrastructure': 'Public Works Department (PWD)',
  'Water Supply': 'Public Health Engineering Department (PHED) / Jal Board',
  'Street Lights': 'Municipal Corporation - Electrical Wing',
  'Garbage Collection': 'Municipal Corporation - Sanitation Department',
  'Drainage & Sewage': 'Municipal Corporation - Drainage Division',
  'Parks & Gardens': 'Horticulture Department',
  'Public Safety': 'Police Department / District Magistrate',
  'Traffic Issues': 'Traffic Police / Transport Department',
  'Electricity': 'State Electricity Board (DISCOM)',
  'Education': 'Education Department',
  'Healthcare': 'Health Department / District Medical Officer',
  'Land & Property': 'Revenue Department / Land Records',
  'Pension & Welfare': 'Social Welfare Department',
  'Ration & Food': 'Food & Civil Supplies Department',
  'Other': 'District Collector Office',
};

// Supported languages for translation
const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  bn: 'Bengali',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
  as: 'Assamese',
  ur: 'Urdu',
};

// Expected resolution times by category (in days)
const RESOLUTION_TIMES: Record<string, number> = {
  'Roads & Infrastructure': 15,
  'Water Supply': 7,
  'Street Lights': 5,
  'Garbage Collection': 3,
  'Drainage & Sewage': 7,
  'Parks & Gardens': 10,
  'Public Safety': 2,
  'Traffic Issues': 5,
  'Electricity': 3,
  'Education': 15,
  'Healthcare': 5,
  'Land & Property': 30,
  'Pension & Welfare': 21,
  'Ration & Food': 10,
  'Other': 15,
};

interface CategorizeResult {
  category: string;
  department: string;
  departmentId: string | null;
  priorityScore: number;
  severity: number;
  expectedResolutionDays: number;
}

interface TranslationResult {
  detectedLanguage: string;
  originalText: string;
  translatedText: string;
  confidence: number;
}

interface ImageAnalysisResult {
  description: string;
  detectedIssues: string[];
  severityFromImage: number;
  suggestedCategory: string;
  confidence: number;
  landmarks: string[];
}

interface DuplicateResult {
  isDuplicate: boolean;
  similarGrievances: Array<{
    id: string;
    title: string;
    similarity: number;
    status: string;
  }>;
  duplicateOf: string | null;
}

interface AutoResponseResult {
  acknowledgment: string;
  expectedResolutionDays: number;
  nextSteps: string[];
  trackingInfo: string;
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private embeddingModel: any = null;
  private visionModel: any = null;

  constructor() {
    if (config.gemini.apiKey) {
      this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
      // Main model for text generation
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      // Embedding model for duplicate detection
      this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      // Vision model for image analysis (using same model as it supports multimodal)
      this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    }
  }

  // ============================================================
  // 1. DUPLICATE DETECTION WITH EMBEDDINGS
  // ============================================================

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingModel) {
      return [];
    }

    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async detectDuplicates(
    title: string,
    description: string,
    location?: { lat?: number; lng?: number }
  ): Promise<DuplicateResult> {
    const combinedText = `${title} ${description}`;
    const newEmbedding = await this.generateEmbedding(combinedText);

    if (newEmbedding.length === 0) {
      return { isDuplicate: false, similarGrievances: [], duplicateOf: null };
    }

    // Get recent grievances with embeddings (last 30 days, same area if location provided)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const whereClause: any = {
      createdAt: { gte: thirtyDaysAgo },
      status: { not: 'resolved' },
      NOT: { embedding: { equals: [] } },
    };

    // Note: Location filtering is done in the comparison loop below
    // to properly handle cases where one grievance has location and other doesn't

    const existingGrievances = await prisma.grievance.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        embedding: true,
        status: true,
        category: true,
        latitude: true,
        longitude: true,
      },
      take: 100,
    });

    console.log(`Duplicate detection: Found ${existingGrievances.length} grievances to compare against`);

    const similarGrievances: Array<{
      id: string;
      title: string;
      similarity: number;
      status: string;
      isNearby?: boolean;
    }> = [];

    for (const grievance of existingGrievances) {
      if (grievance.embedding && grievance.embedding.length > 0) {
        const similarity = this.cosineSimilarity(newEmbedding, grievance.embedding);

        // Check if locations are nearby (within ~5km) - only compare if both have locations
        let isNearby = false;
        if (location?.lat && location?.lng && grievance.latitude && grievance.longitude) {
          const latDiff = Math.abs(location.lat - grievance.latitude);
          const lngDiff = Math.abs(location.lng - grievance.longitude);
          isNearby = latDiff < 0.045 && lngDiff < 0.045; // ~5km radius
        }

        console.log(`Comparing with "${grievance.title}": ${Math.round(similarity * 100)}% similarity, nearby: ${isNearby}`);

        // Only consider similar if text is similar AND location is nearby (or no location data)
        const hasLocationData = location?.lat && location?.lng;
        const shouldCompare = !hasLocationData || isNearby;

        if (similarity > 0.75 && shouldCompare) { // 75% similarity threshold
          similarGrievances.push({
            id: grievance.id,
            title: grievance.title,
            similarity: Math.round(similarity * 100),
            status: grievance.status,
            isNearby,
          });
        }
      }
    }

    // Sort by similarity (highest first)
    similarGrievances.sort((a, b) => b.similarity - a.similarity);

    // If similarity > 90%, consider it a duplicate
    const duplicateOf = similarGrievances.length > 0 && similarGrievances[0].similarity > 90
      ? similarGrievances[0].id
      : null;

    console.log(`Duplicate detection result: ${similarGrievances.length} similar, isDuplicate: ${duplicateOf !== null}`);
    if (similarGrievances.length > 0) {
      console.log(`Top similar: "${similarGrievances[0].title}" at ${similarGrievances[0].similarity}%`);
    }

    return {
      isDuplicate: duplicateOf !== null,
      similarGrievances: similarGrievances.slice(0, 5), // Return top 5
      duplicateOf,
    };
  }

  // ============================================================
  // 2. AUTO-RESPONSE GENERATION
  // ============================================================

  async generateAutoResponse(
    title: string,
    description: string,
    category: string,
    grievanceId: string,
    userName: string,
    language: string = 'en'
  ): Promise<AutoResponseResult> {
    const expectedDays = RESOLUTION_TIMES[category] || 15;
    const departmentName = INDIA_DEPARTMENTS[category as keyof typeof INDIA_DEPARTMENTS] || 'District Collector Office';

    if (!this.model) {
      // Fallback template response
      return this.getTemplateResponse(category, grievanceId, userName, expectedDays, departmentName, language);
    }

    try {
      const languageName = SUPPORTED_LANGUAGES[language] || 'English';
      const prompt = `You are an official grievance acknowledgment system for the Government of India. Generate a professional, empathetic acknowledgment message for a citizen's grievance.

Grievance Details:
- Title: ${title}
- Description: ${description}
- Category: ${category}
- Department: ${departmentName}
- Grievance ID: ${grievanceId}
- Citizen Name: ${userName}
- Expected Resolution: ${expectedDays} days

Generate a response in ${languageName} language with:
1. A warm acknowledgment of their complaint
2. Confirmation that it has been registered
3. The assigned department
4. Expected timeline
5. Next steps they can expect

Respond with ONLY a JSON object (no markdown):
{
  "acknowledgment": "The full acknowledgment message in ${languageName}",
  "nextSteps": ["step1", "step2", "step3"],
  "trackingInfo": "Brief tracking instructions"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          acknowledgment: parsed.acknowledgment || this.getDefaultAcknowledgment(grievanceId, userName, category, language),
          expectedResolutionDays: expectedDays,
          nextSteps: parsed.nextSteps || ['Your grievance will be reviewed', 'Assigned officer will investigate', 'You will receive status updates'],
          trackingInfo: parsed.trackingInfo || `Track your grievance using ID: ${grievanceId}`,
        };
      }
    } catch (error) {
      console.error('Error generating auto-response:', error);
    }

    return this.getTemplateResponse(category, grievanceId, userName, expectedDays, departmentName, language);
  }

  private getTemplateResponse(
    category: string,
    grievanceId: string,
    userName: string,
    expectedDays: number,
    departmentName: string,
    language: string
  ): AutoResponseResult {
    const templates: Record<string, { acknowledgment: string; nextSteps: string[]; trackingInfo: string }> = {
      en: {
        acknowledgment: `Dear ${userName},\n\nThank you for submitting your grievance regarding "${category}". Your complaint has been successfully registered with Grievance ID: ${grievanceId}.\n\nYour grievance has been forwarded to ${departmentName} for immediate attention. We are committed to resolving your issue within ${expectedDays} working days.\n\nYou will receive regular updates on the progress of your complaint. Thank you for using Jan-Samadhan Portal.\n\nRegards,\nJan-Samadhan Team`,
        nextSteps: [
          'Your grievance has been assigned to the relevant department',
          'An officer will review and investigate the issue',
          'You will receive SMS/email updates on progress',
          'Resolution report will be shared upon completion',
        ],
        trackingInfo: `Track your grievance anytime using ID: ${grievanceId} on the Jan-Samadhan Portal`,
      },
      hi: {
        acknowledgment: `प्रिय ${userName},\n\nआपकी "${category}" से संबंधित शिकायत दर्ज करने के लिए धन्यवाद। आपकी शिकायत सफलतापूर्वक पंजीकृत हो गई है। शिकायत आईडी: ${grievanceId}\n\nआपकी शिकायत ${departmentName} को तत्काल कार्रवाई के लिए भेज दी गई है। हम ${expectedDays} कार्य दिवसों के भीतर आपकी समस्या का समाधान करने के लिए प्रतिबद्ध हैं।\n\nआपको अपनी शिकायत की प्रगति पर नियमित अपडेट प्राप्त होंगे।\n\nसादर,\nजन-समाधान टीम`,
        nextSteps: [
          'आपकी शिकायत संबंधित विभाग को सौंप दी गई है',
          'एक अधिकारी समस्या की समीक्षा और जांच करेगा',
          'आपको प्रगति पर SMS/ईमेल अपडेट मिलेंगे',
          'समाधान के बाद रिपोर्ट साझा की जाएगी',
        ],
        trackingInfo: `जन-समाधान पोर्टल पर आईडी ${grievanceId} का उपयोग करके अपनी शिकायत को ट्रैक करें`,
      },
    };

    return {
      ...(templates[language] || templates.en),
      expectedResolutionDays: expectedDays,
    };
  }

  private getDefaultAcknowledgment(grievanceId: string, userName: string, category: string, language: string): string {
    if (language === 'hi') {
      return `प्रिय ${userName}, आपकी शिकायत (${category}) सफलतापूर्वक दर्ज हो गई है। शिकायत आईडी: ${grievanceId}`;
    }
    return `Dear ${userName}, your grievance regarding ${category} has been successfully registered. Grievance ID: ${grievanceId}`;
  }

  // ============================================================
  // 3. LANGUAGE TRANSLATION
  // ============================================================

  async detectAndTranslate(text: string): Promise<TranslationResult> {
    if (!this.model) {
      return {
        detectedLanguage: 'en',
        originalText: text,
        translatedText: text,
        confidence: 100,
      };
    }

    try {
      const prompt = `Analyze this text and detect its language. If it's not in English, translate it to English.

Text: "${text}"

Respond with ONLY a JSON object (no markdown):
{
  "detectedLanguage": "ISO 639-1 code (e.g., 'hi' for Hindi, 'en' for English, 'ta' for Tamil)",
  "languageName": "Full language name",
  "isEnglish": true/false,
  "translatedText": "English translation (same as original if already English)",
  "confidence": number between 0-100
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          detectedLanguage: parsed.detectedLanguage || 'en',
          originalText: text,
          translatedText: parsed.translatedText || text,
          confidence: parsed.confidence || 80,
        };
      }
    } catch (error) {
      console.error('Error detecting/translating language:', error);
    }

    return {
      detectedLanguage: 'en',
      originalText: text,
      translatedText: text,
      confidence: 50,
    };
  }

  async translateToLanguage(text: string, targetLanguage: string): Promise<string> {
    if (!this.model || targetLanguage === 'en') {
      return text;
    }

    const languageName = SUPPORTED_LANGUAGES[targetLanguage] || 'Hindi';

    try {
      const prompt = `Translate this English text to ${languageName}:

"${text}"

Respond with ONLY the translated text, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error translating text:', error);
      return text;
    }
  }

  // ============================================================
  // 4. IMAGE ANALYSIS
  // ============================================================

  async analyzeImage(imagePath: string): Promise<ImageAnalysisResult> {
    if (!this.visionModel) {
      return this.getDefaultImageAnalysis();
    }

    try {
      // Read image file and convert to base64
      const absolutePath = path.resolve(imagePath);
      if (!fs.existsSync(absolutePath)) {
        console.error('Image file not found:', absolutePath);
        return this.getDefaultImageAnalysis();
      }

      const imageBuffer = fs.readFileSync(absolutePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);

      const prompt = `You are an AI assistant analyzing images of civic issues for a government grievance portal in India. Analyze this image and identify:

1. What civic issue is shown (pothole, garbage, broken streetlight, water leak, etc.)
2. The severity of the issue (1-10 scale)
3. The appropriate category for this grievance
4. Any identifiable landmarks or location hints
5. Safety concerns if any

Respond with ONLY a JSON object (no markdown):
{
  "description": "Detailed description of what you see in the image",
  "detectedIssues": ["issue1", "issue2"],
  "severityFromImage": number 1-10,
  "suggestedCategory": "One of: Roads & Infrastructure, Water Supply, Street Lights, Garbage Collection, Drainage & Sewage, Parks & Gardens, Public Safety, Traffic Issues, Electricity, Other",
  "confidence": number 0-100,
  "landmarks": ["any visible landmarks or location identifiers"],
  "safetyRisk": "low/medium/high",
  "additionalNotes": "any other relevant observations"
}`;

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      };

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description || 'Image analysis unavailable',
          detectedIssues: parsed.detectedIssues || [],
          severityFromImage: Math.min(10, Math.max(1, parsed.severityFromImage || 5)),
          suggestedCategory: parsed.suggestedCategory || 'Other',
          confidence: parsed.confidence || 70,
          landmarks: parsed.landmarks || [],
        };
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    }

    return this.getDefaultImageAnalysis();
  }

  async analyzeMultipleImages(imagePaths: string[]): Promise<ImageAnalysisResult> {
    if (imagePaths.length === 0) {
      return this.getDefaultImageAnalysis();
    }

    if (imagePaths.length === 1) {
      return this.analyzeImage(imagePaths[0]);
    }

    // Analyze each image and combine results
    const analyses = await Promise.all(imagePaths.map(p => this.analyzeImage(p)));

    // Combine results
    const allIssues = new Set<string>();
    const allLandmarks = new Set<string>();
    let maxSeverity = 1;
    let totalConfidence = 0;
    const descriptions: string[] = [];
    const categories: Record<string, number> = {};

    for (const analysis of analyses) {
      analysis.detectedIssues.forEach(i => allIssues.add(i));
      analysis.landmarks.forEach(l => allLandmarks.add(l));
      maxSeverity = Math.max(maxSeverity, analysis.severityFromImage);
      totalConfidence += analysis.confidence;
      descriptions.push(analysis.description);
      categories[analysis.suggestedCategory] = (categories[analysis.suggestedCategory] || 0) + 1;
    }

    // Get most common category
    const suggestedCategory = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other';

    return {
      description: descriptions.join(' | '),
      detectedIssues: Array.from(allIssues),
      severityFromImage: maxSeverity,
      suggestedCategory,
      confidence: Math.round(totalConfidence / analyses.length),
      landmarks: Array.from(allLandmarks),
    };
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  private getDefaultImageAnalysis(): ImageAnalysisResult {
    return {
      description: 'Image analysis not available',
      detectedIssues: [],
      severityFromImage: 5,
      suggestedCategory: 'Other',
      confidence: 0,
      landmarks: [],
    };
  }

  // ============================================================
  // ORIGINAL CATEGORIZATION (Enhanced)
  // ============================================================

  async categorizeGrievance(title: string, description: string): Promise<CategorizeResult> {
    // If no API key, use keyword-based categorization
    if (!this.model) {
      return this.keywordCategorize(title, description);
    }

    try {
      const categories = Object.keys(INDIA_DEPARTMENTS).join(', ');
      const prompt = `You are an AI assistant for a grievance management system in India. Analyze this citizen grievance and categorize it to the appropriate government department.

Available Categories: ${categories}

Grievance Title: ${title}
Description: ${description}

Analyze and respond with ONLY a JSON object (no markdown, no explanation):
{
  "category": "exact category from list above",
  "priorityScore": number between 0-100 (100 = most urgent, consider public safety, health impact, number of people affected),
  "severity": number between 1-10 (10 = most severe),
  "reasoning": "brief explanation"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const category = parsed.category || 'Other';
        const department = INDIA_DEPARTMENTS[category as keyof typeof INDIA_DEPARTMENTS] || INDIA_DEPARTMENTS['Other'];

        // Look up departmentId from database
        const deptRecord = await prisma.department.findFirst({
          where: { category },
          select: { id: true },
        });

        return {
          category,
          department,
          departmentId: deptRecord?.id || null,
          priorityScore: Math.min(100, Math.max(0, parsed.priorityScore || 50)),
          severity: Math.min(10, Math.max(1, parsed.severity || 5)),
          expectedResolutionDays: RESOLUTION_TIMES[category] || 15,
        };
      }

      // Fallback to keyword-based if parsing fails
      return this.keywordCategorize(title, description);
    } catch (error) {
      console.error('AI categorization error:', error);
      // Fallback to keyword-based categorization
      return this.keywordCategorize(title, description);
    }
  }

  private async keywordCategorize(title: string, description: string): Promise<CategorizeResult> {
    const text = `${title} ${description}`.toLowerCase();

    // Comprehensive keyword-based categorization for Indian context
    let category = 'Other';
    let priorityScore = 50;
    let severity = 5;

    // Roads & Infrastructure - PWD
    if (text.match(/road|pothole|footpath|sidewalk|bridge|highway|pavement|tar|asphalt|crater|broken road|damaged road|sadak|gaddha/)) {
      category = 'Roads & Infrastructure';
      priorityScore = 75;
      severity = 7;
    }
    // Water Supply - Jal Board / PHED
    else if (text.match(/water|pipeline|leak|tap|bore|borewell|tanker|water supply|pani|jal|contaminated water|dirty water|no water|paani/)) {
      category = 'Water Supply';
      priorityScore = 85;
      severity = 8;
    }
    // Street Lights - Municipal Electrical
    else if (text.match(/light|street light|lamp|bulb|pole|dark|no light|bijli|broken light|streetlight/)) {
      category = 'Street Lights';
      priorityScore = 60;
      severity = 5;
    }
    // Garbage - Sanitation
    else if (text.match(/garbage|waste|trash|kachra|dustbin|dump|litter|sanitation|clean|sweeper|safai|kuda/)) {
      category = 'Garbage Collection';
      priorityScore = 70;
      severity = 6;
    }
    // Drainage - Municipal Drainage
    else if (text.match(/drain|sewage|flood|nala|gutter|overflow|clog|waterlog|naali|sewer|nali/)) {
      category = 'Drainage & Sewage';
      priorityScore = 80;
      severity = 7;
    }
    // Parks - Horticulture
    else if (text.match(/park|garden|tree|plantation|green|bagicha|playground|ped|bageeche/)) {
      category = 'Parks & Gardens';
      priorityScore = 40;
      severity = 3;
    }
    // Public Safety - Police/DM
    else if (text.match(/safety|crime|theft|robbery|harassment|threat|violence|police|dangerous|stray dog|animal attack|eve teasing|chori|daku/)) {
      category = 'Public Safety';
      priorityScore = 90;
      severity = 9;
    }
    // Traffic - Traffic Police
    else if (text.match(/traffic|signal|parking|jam|congestion|challan|rash driving|accident|zebra crossing/)) {
      category = 'Traffic Issues';
      priorityScore = 75;
      severity = 7;
    }
    // Electricity - DISCOM
    else if (text.match(/electricity|power|current|bijli|transformer|meter|wire|cable|power cut|outage|bill|vidyut/)) {
      category = 'Electricity';
      priorityScore = 80;
      severity = 7;
    }
    // Education - Education Dept
    else if (text.match(/school|college|education|teacher|vidyalaya|shiksha|admission|scholarship|padhai/)) {
      category = 'Education';
      priorityScore = 65;
      severity = 5;
    }
    // Healthcare - Health Dept
    else if (text.match(/hospital|health|doctor|medicine|clinic|dispensary|swasthya|ambulance|PHC|CHC|dawai|ilaj/)) {
      category = 'Healthcare';
      priorityScore = 85;
      severity = 8;
    }
    // Land - Revenue Dept
    else if (text.match(/land|property|registry|mutation|encroachment|boundary|zameen|khasra|khatauni|jameen/)) {
      category = 'Land & Property';
      priorityScore = 60;
      severity = 5;
    }
    // Pension/Welfare - Social Welfare
    else if (text.match(/pension|widow|disability|handicap|BPL|welfare|old age|vridha|divyang|vidhwa/)) {
      category = 'Pension & Welfare';
      priorityScore = 75;
      severity = 6;
    }
    // Ration - Food & Civil Supplies
    else if (text.match(/ration|card|kerosene|gas|cylinder|PDS|fair price|food grain|aadhar|subsidy|rashan/)) {
      category = 'Ration & Food';
      priorityScore = 75;
      severity = 6;
    }

    // Adjust priority based on urgency keywords
    if (text.match(/urgent|immediate|emergency|critical|serious|life threatening|death|dying|atrocity|jaldi|turant/)) {
      priorityScore = Math.min(100, priorityScore + 20);
      severity = Math.min(10, severity + 2);
    }

    // Get the corresponding department
    const department = INDIA_DEPARTMENTS[category as keyof typeof INDIA_DEPARTMENTS] || INDIA_DEPARTMENTS['Other'];

    // Look up departmentId from database
    const deptRecord = await prisma.department.findFirst({
      where: { category },
      select: { id: true },
    });

    return {
      category,
      department,
      departmentId: deptRecord?.id || null,
      priorityScore,
      severity,
      expectedResolutionDays: RESOLUTION_TIMES[category] || 15,
    };
  }

  // ============================================================
  // FULL ANALYSIS (Combines all AI features)
  // ============================================================

  async fullAnalysis(
    title: string,
    description: string,
    userName: string,
    imagePaths: string[] = [],
    location?: { lat?: number; lng?: number }
  ): Promise<{
    categorization: CategorizeResult;
    translation: TranslationResult;
    duplicates: DuplicateResult;
    autoResponse: AutoResponseResult;
    imageAnalysis: ImageAnalysisResult | null;
    embedding: number[];
    aiAnalysisHash: string;
  }> {
    // 1. Detect language and translate
    const titleTranslation = await this.detectAndTranslate(title);
    const descTranslation = await this.detectAndTranslate(description);

    // Use translated text for further analysis
    const processedTitle = titleTranslation.translatedText;
    const processedDesc = descTranslation.translatedText;

    // 2. Analyze images if provided
    let imageAnalysis: ImageAnalysisResult | null = null;
    if (imagePaths.length > 0) {
      imageAnalysis = await this.analyzeMultipleImages(imagePaths);
    }

    // 3. Categorize (considering image analysis)
    let categorization = await this.categorizeGrievance(processedTitle, processedDesc);

    // Enhance categorization with image analysis
    if (imageAnalysis && imageAnalysis.confidence > 70) {
      // If image suggests different category with high confidence, consider it
      if (imageAnalysis.suggestedCategory !== 'Other' && imageAnalysis.suggestedCategory !== categorization.category) {
        // Average the severity
        categorization.severity = Math.round((categorization.severity + imageAnalysis.severityFromImage) / 2);
      }
      // Boost severity if image shows severe issue
      if (imageAnalysis.severityFromImage > categorization.severity) {
        categorization.severity = Math.round((categorization.severity + imageAnalysis.severityFromImage) / 2);
        categorization.priorityScore = Math.min(100, categorization.priorityScore + 10);
      }
    }

    // 4. Generate embedding for duplicate detection
    const combinedText = `${processedTitle} ${processedDesc}`;
    const embedding = await this.generateEmbedding(combinedText);

    // 5. Check for duplicates
    const duplicates = await this.detectDuplicates(processedTitle, processedDesc, location);

    // 6. Generate auto-response (in user's language)
    const autoResponse = await this.generateAutoResponse(
      title,
      description,
      categorization.category,
      'PENDING', // Will be replaced with actual ID after creation
      userName,
      titleTranslation.detectedLanguage
    );

    // 7. Create hash of AI analysis for blockchain
    const analysisData = {
      category: categorization.category,
      severity: categorization.severity,
      priorityScore: categorization.priorityScore,
      detectedLanguage: titleTranslation.detectedLanguage,
      imageAnalysis: imageAnalysis ? {
        suggestedCategory: imageAnalysis.suggestedCategory,
        severityFromImage: imageAnalysis.severityFromImage,
        confidence: imageAnalysis.confidence,
      } : null,
      duplicateOf: duplicates.duplicateOf,
      timestamp: new Date().toISOString(),
    };

    const aiAnalysisHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(analysisData))
      .digest('hex');

    return {
      categorization,
      translation: {
        detectedLanguage: titleTranslation.detectedLanguage,
        originalText: `${title}\n\n${description}`,
        translatedText: `${processedTitle}\n\n${processedDesc}`,
        confidence: Math.round((titleTranslation.confidence + descTranslation.confidence) / 2),
      },
      duplicates,
      autoResponse,
      imageAnalysis,
      embedding,
      aiAnalysisHash,
    };
  }
}

export default new AIService();

