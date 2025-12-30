interface CategorizeResult {
    category: string;
    department: string;
    departmentId: string | null;
    priorityScore: number;
    severity: number;
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
declare class AIService {
    private genAI;
    private model;
    private embeddingModel;
    private visionModel;
    constructor();
    generateEmbedding(text: string): Promise<number[]>;
    private cosineSimilarity;
    detectDuplicates(title: string, description: string, location?: {
        lat?: number;
        lng?: number;
    }): Promise<DuplicateResult>;
    generateAutoResponse(title: string, description: string, category: string, grievanceId: string, userName: string, language?: string): Promise<AutoResponseResult>;
    private getTemplateResponse;
    private getDefaultAcknowledgment;
    detectAndTranslate(text: string): Promise<TranslationResult>;
    translateToLanguage(text: string, targetLanguage: string): Promise<string>;
    analyzeImage(imagePath: string): Promise<ImageAnalysisResult>;
    analyzeMultipleImages(imagePaths: string[]): Promise<ImageAnalysisResult>;
    private getMimeType;
    private getDefaultImageAnalysis;
    categorizeGrievance(title: string, description: string): Promise<CategorizeResult>;
    private keywordCategorize;
    fullAnalysis(title: string, description: string, userName: string, imagePaths?: string[], location?: {
        lat?: number;
        lng?: number;
    }): Promise<{
        categorization: CategorizeResult;
        translation: TranslationResult;
        duplicates: DuplicateResult;
        autoResponse: AutoResponseResult;
        imageAnalysis: ImageAnalysisResult | null;
        embedding: number[];
        aiAnalysisHash: string;
    }>;
}
declare const _default: AIService;
export default _default;
//# sourceMappingURL=ai.service.d.ts.map