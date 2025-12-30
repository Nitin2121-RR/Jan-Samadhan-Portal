import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { LocationInput } from "./ui/LocationInput";
import { Camera, Upload, CheckCircle2, Mic, Sparkles, X, Loader2, Trash2, AlertTriangle, Languages, ImageIcon, Brain, Copy, Check, FileText } from "lucide-react";
import { apiClient } from "../services/api";
import { toast } from "sonner";
import { PageHeader } from "./PageHeader";

interface FileGrievanceFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

interface FilePreview {
  file: File;
  preview: string;
  id?: string;
}

interface AIAnalysisResult {
  categorization: {
    category: string;
    department: string;
    severity: number;
    priorityScore: number;
  };
  translation: {
    detectedLanguage: string;
    wasTranslated: boolean;
  };
  duplicates: {
    isDuplicate: boolean;
    similarCount: number;
    similarGrievances: Array<{
      id: string;
      title: string;
      similarity: number;
      status: string;
    }>;
  };
  autoResponse: {
    acknowledgment: string;
    expectedResolutionDays: number;
    nextSteps: string[];
    trackingInfo: string;
  };
  imageAnalysis: {
    description: string;
    detectedIssues: string[];
    severityFromImage: number;
    suggestedCategory: string;
    confidence: number;
    landmarks: string[];
  } | null;
  aiAnalysisHash: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
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

export function FileGrievanceForm({ onSubmit, onCancel }: FileGrievanceFormProps) {
  const [step, setStep] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ address: string; lat?: number; lng?: number }>({ address: "" });
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  console.log('uploadingFiles state:', uploadingFiles); // Keep for debugging

  // AI Analysis Results
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [submittedGrievanceId, setSubmittedGrievanceId] = useState<string | null>(null);
  const [copiedAck, setCopiedAck] = useState(false);

  // Refs for file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recognition
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (event.results[event.results.length - 1].isFinal) {
          setDescription(prev => prev + ' ' + transcript.trim());
        }
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        toast.error("Voice recognition error. Please try again.");
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition not supported in this browser");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.info("Listening... Speak now");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FilePreview[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
        });
      }
    }

    setFiles(prev => [...prev, ...newFiles].slice(0, 5)); // Max 5 files
    e.target.value = ''; // Reset input
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadFiles = async (): Promise<string[]> => {
    const uploadedIds: string[] = [];
    setUploadingFiles(true);

    try {
      for (const filePreview of files) {
        if (!filePreview.id) {
          const result = await apiClient.uploadFile(filePreview.file);
          uploadedIds.push(result.file.id);
        } else {
          uploadedIds.push(filePreview.id);
        }
      }
    } finally {
      setUploadingFiles(false);
    }

    return uploadedIds;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files first
      const fileIds = files.length > 0 ? await uploadFiles() : [];

      // Create grievance with file IDs
      const result = await apiClient.createGrievance({
        title: title.trim(),
        description: description.trim(),
        latitude: location.lat || undefined,
        longitude: location.lng || undefined,
        address: location.address || undefined,
        fileIds: fileIds.length > 0 ? fileIds : undefined,
      });

      // Store AI analysis results
      setAiAnalysis(result.aiAnalysis);
      setSubmittedGrievanceId(result.grievance.id);

      // Move to step 4 (AI Results)
      setStep(4);

      toast.success("Grievance submitted successfully!", {
        description: "AI analysis complete. Review the results below."
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit grievance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyAcknowledgment = () => {
    if (aiAnalysis?.autoResponse.acknowledgment) {
      navigator.clipboard.writeText(aiAnalysis.autoResponse.acknowledgment);
      setCopiedAck(true);
      toast.success("Acknowledgment copied to clipboard");
      setTimeout(() => setCopiedAck(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={step === 4 ? "Grievance Submitted" : "File a Grievance"}
        description={step === 4 ? "AI analysis complete." : `Step ${step} of 3`}
        icon={<FileText className="w-5 h-5" />}
        action={
          <Button variant="ghost" size="icon-sm" onClick={step === 4 ? onSubmit : onCancel}>
            <X className="w-5 h-5" />
          </Button>
        }
      >
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {[1, 2, 3].map((num) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 600,
                    backgroundColor: step >= num ? '#030213' : '#f3f4f6',
                    color: step >= num ? '#ffffff' : '#6b7280',
                  }}
                >
                  {step > num ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span>{num}</span>
                  )}
                </div>
                {num < 3 && (
                  <div
                    style={{
                      height: '6px',
                      flex: 1,
                      margin: '0 12px',
                      borderRadius: '9999px',
                      backgroundColor: step > num ? 'rgba(3, 2, 19, 0.6)' : '#e5e7eb',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </PageHeader>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {step === 1 && (
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Describe the Issue</h2>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Tell us what's wrong in your own words
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Label htmlFor="title" style={{ fontSize: '14px', fontWeight: 500 }}>Issue Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Large pothole on Main Street"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Label htmlFor="description" style={{ fontSize: '14px', fontWeight: 500 }}>Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide details about the issue..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={toggleRecording}
                >
                  <Mic className={`w-4 h-4 mr-2 ${isRecording ? 'text-destructive animate-pulse' : ''}`} />
                  {isRecording ? 'Stop Recording' : 'Use Voice Input'}
                </Button>
              </div>

              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles className="w-5 h-5" style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#10b981' }}>AI-Powered Categorization</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      No need to select a category. Our AI will automatically route your issue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Add Location & Evidence</h2>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Help us identify the exact location
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Label className="text-sm font-medium">Location</Label>
                <LocationInput
                  value={location}
                  onChange={setLocation}
                  placeholder="Enter full address (e.g., 123 Main Road, Sector 15, New Delhi)"
                  showCoordinates={true}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-sm font-medium">Upload Photos/Videos (max 5)</Label>
              {/* Hidden file inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-md p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
                >
                  <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Take Photo</p>
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-md p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Upload File</p>
                </div>
              </div>

              {/* File Previews */}
              {files.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {files.map((filePreview, index) => (
                    <div key={index} className="relative aspect-square bg-secondary rounded-md overflow-hidden group">
                      {filePreview.file.type.startsWith('image/') ? (
                        <img
                          src={filePreview.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={filePreview.preview}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Photos help authorities understand and resolve the issue faster
              </p>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Verify & Submit</h2>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Review your grievance before submitting
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Issue Title</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, textAlign: 'right' }}>{title || "Not specified"}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Category</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#030213' }}>Auto-detected by AI</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Location</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, textAlign: 'right' }}>{location.address || "Not specified"}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Attachments</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{files.length} file{files.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ padding: '12px 0' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280', display: 'block', marginBottom: '8px' }}>Description</span>
                  <p style={{ fontSize: '14px', lineHeight: 1.625 }}>
                    {description || "No description provided"}
                  </p>
                </div>
              </div>

              {/* File Preview Thumbnails */}
              {files.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {files.map((filePreview, index) => (
                    <div key={index} style={{ width: '64px', height: '64px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                      {filePreview.file.type.startsWith('image/') ? (
                        <img
                          src={filePreview.preview}
                          alt={`Attachment ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <video
                          src={filePreview.preview}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  You'll receive updates via SMS and in-app notifications about your grievance progress.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: AI Analysis Results */}
        {step === 4 && aiAnalysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Success Banner */}
            <Card style={{ padding: '20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 style={{ width: '24px', height: '24px', color: '#10b981' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#10b981' }}>Grievance Registered</h2>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>ID: {submittedGrievanceId}</p>
                </div>
              </div>
            </Card>

            {/* Duplicate Warning */}
            {aiAnalysis.duplicates.isDuplicate && (
              <Card style={{ padding: '16px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <AlertTriangle style={{ width: '20px', height: '20px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <p style={{ fontWeight: 500, color: '#f59e0b' }}>Potential Duplicate Detected</p>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                      Similar grievances have been found in your area. Your grievance has been linked for faster resolution.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Similar Grievances */}
            {aiAnalysis.duplicates.similarCount > 0 && (
              <Card style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Brain style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                  <h3 style={{ fontWeight: 500, fontSize: '14px' }}>Similar Issues ({aiAnalysis.duplicates.similarCount})</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {aiAnalysis.duplicates.similarGrievances.slice(0, 3).map((g) => (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                      <span style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{g.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{g.similarity}% match</span>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: g.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : g.status === 'in_progress' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: g.status === 'resolved' ? '#10b981' : g.status === 'in_progress' ? '#3b82f6' : '#f59e0b'
                        }}>{g.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Categorization */}
            <Card style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <h3 style={{ fontWeight: 500, fontSize: '14px' }}>AI Categorization</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Category</p>
                  <p style={{ fontWeight: 500, fontSize: '14px' }}>{aiAnalysis.categorization.category}</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Department</p>
                  <p style={{ fontWeight: 500, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{aiAnalysis.categorization.department.split('(')[0].trim()}</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Severity</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '9999px',
                          width: `${aiAnalysis.categorization.severity * 10}%`,
                          backgroundColor: aiAnalysis.categorization.severity >= 7 ? '#ef4444' : aiAnalysis.categorization.severity >= 4 ? '#f59e0b' : '#10b981'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{aiAnalysis.categorization.severity}/10</span>
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Priority Score</p>
                  <p style={{ fontWeight: 500, fontSize: '14px' }}>{aiAnalysis.categorization.priorityScore}/100</p>
                </div>
              </div>
            </Card>

            {/* Language Detection */}
            {aiAnalysis.translation.wasTranslated && (
              <Card style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Languages style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                  <h3 style={{ fontWeight: 500, fontSize: '14px' }}>Language Detected</h3>
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Your grievance was written in <span style={{ fontWeight: 500, color: '#111827' }}>
                    {LANGUAGE_NAMES[aiAnalysis.translation.detectedLanguage] || aiAnalysis.translation.detectedLanguage}
                  </span> and has been translated for processing.
                </p>
              </Card>
            )}

            {/* Image Analysis */}
            {aiAnalysis.imageAnalysis && aiAnalysis.imageAnalysis.confidence > 0 && (
              <Card style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <ImageIcon style={{ width: '16px', height: '16px', color: '#030213' }} />
                  <h3 style={{ fontWeight: 500, fontSize: '14px' }}>Image Analysis</h3>
                  <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: 'auto' }}>
                    {aiAnalysis.imageAnalysis.confidence}% confidence
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  {aiAnalysis.imageAnalysis.description}
                </p>
                {aiAnalysis.imageAnalysis.detectedIssues.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {aiAnalysis.imageAnalysis.detectedIssues.map((issue, i) => (
                      <span key={i} style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#f3f4f6', borderRadius: '9999px' }}>
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Auto Response / Acknowledgment */}
            <Card style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontWeight: 500, fontSize: '14px' }}>Official Acknowledgment</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyAcknowledgment}
                >
                  {copiedAck ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', fontSize: '14px', whiteSpace: 'pre-wrap', maxHeight: '192px', overflowY: 'auto' }}>
                {aiAnalysis.autoResponse.acknowledgment}
              </div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>Expected Resolution:</span>
                <span style={{ fontWeight: 500, color: '#030213' }}>
                  {aiAnalysis.autoResponse.expectedResolutionDays} days
                </span>
              </div>
            </Card>

            {/* Next Steps */}
            <Card style={{ padding: '16px' }}>
              <h3 style={{ fontWeight: 500, fontSize: '14px', marginBottom: '12px' }}>Next Steps</h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
                {aiAnalysis.autoResponse.nextSteps.map((s, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
                    <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(3, 2, 19, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#030213' }}>{i + 1}</span>
                    </div>
                    <span style={{ color: '#6b7280' }}>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Blockchain Verification */}
            <Card style={{ padding: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Brain style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                <h3 style={{ fontWeight: 500, fontSize: '14px', color: '#3b82f6' }}>Blockchain Verified</h3>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                AI Analysis Hash: {aiAnalysis.aiAnalysisHash.slice(0, 16)}...{aiAnalysis.aiAnalysisHash.slice(-16)}
              </p>
            </Card>

            {/* Done Button */}
            <Button
              onClick={onSubmit}
              style={{
                width: '100%',
                backgroundColor: '#030213',
                color: '#ffffff',
                padding: '12px 24px',
                fontWeight: 500,
                borderRadius: '8px',
                marginBottom: '24px'
              }}
            >
              Done
            </Button>
          </div>
        )}

        {/* Navigation Buttons (hidden on step 4) */}
        {step < 4 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', marginTop: '8px' }}>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                style={{
                  flex: 1,
                  backgroundColor: '#030213',
                  color: '#ffffff',
                  padding: '12px 24px',
                  fontWeight: 500,
                  borderRadius: '8px',
                }}
                disabled={step === 1 && (!title.trim() || !description.trim())}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                style={{
                  flex: 1,
                  backgroundColor: '#030213',
                  color: '#ffffff',
                  padding: '12px 24px',
                  fontWeight: 500,
                  borderRadius: '8px',
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  "Submit Grievance"
                )}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
