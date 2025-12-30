import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Camera, MapPin, Upload, CheckCircle2, Mic, Sparkles, X, Loader2, Trash2, AlertTriangle, Languages, ImageIcon, Brain, Copy, Check, FileText } from "lucide-react";
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
  const [location, setLocation] = useState({ address: "", lat: 0, lng: 0 });
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState(false);

  // AI Analysis Results
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [submittedGrievanceId, setSubmittedGrievanceId] = useState<string | null>(null);
  const [copiedAck, setCopiedAck] = useState(false);

  // Refs for file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recognition
  const recognitionRef = useRef<any>(null);

  // Function to detect current location
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setManualAddress(true);
      return;
    }

    setDetectingLocation(true);
    setLocation({ address: "Detecting location...", lat: 0, lng: 0 });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({
          address: "Fetching address...",
          lat: latitude,
          lng: longitude,
        });

        // Reverse geocode to get address using Nominatim
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`, {
          headers: {
            'Accept-Language': 'en',
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              throw new Error(data.error);
            }
            // Build a readable address from components
            const addr = data.address;
            let addressParts = [];
            if (addr.road || addr.street) addressParts.push(addr.road || addr.street);
            if (addr.neighbourhood || addr.suburb) addressParts.push(addr.neighbourhood || addr.suburb);
            if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village);
            if (addr.state) addressParts.push(addr.state);

            const formattedAddress = addressParts.length > 0
              ? addressParts.join(', ')
              : data.display_name?.split(',').slice(0, 4).join(',') || "Location detected";

            setLocation(prev => ({ ...prev, address: formattedAddress }));
            toast.success("Location detected successfully");
          })
          .catch((err) => {
            console.error('Geocoding error:', err);
            setLocation(prev => ({ ...prev, address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}` }));
            toast.info("Coordinates captured. You can add address manually.");
          })
          .finally(() => {
            setDetectingLocation(false);
            setManualAddress(false);
          });
      },
      (error) => {
        setDetectingLocation(false);
        let errorMessage = "Unable to detect location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable it in your browser settings or enter address manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please enter address manually.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again or enter manually.";
            break;
        }

        toast.error(errorMessage);
        setLocation({ address: "", lat: 0, lng: 0 });
        setManualAddress(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Try to detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

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
    <div 
      className="space-y-6" 
      style={{ 
        padding: "24px",
        paddingTop: "20px",
        paddingBottom: "20px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb"
      }}
    >
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
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all font-semibold ${
                    step >= num
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > num ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <span className="text-sm sm:text-base">{num}</span>
                  )}
                </div>
                {num < 3 && (
                  <div
                    className={`h-1.5 flex-1 mx-3 rounded-full transition-all ${
                      step > num ? "bg-primary/60" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-5">
        {step === 1 && (
          <Card className="p-4 sm:p-6 space-y-6" style={{ padding: "20px !important" }}>
            <div>
              <h2 className="text-lg font-semibold mb-1">Describe the Issue</h2>
              <p className="text-sm text-muted-foreground">
                Tell us what's wrong in your own words
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                placeholder="e.g., Large pothole on Main Street"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide details about the issue..."
                rows={4}
                className="bg-input-background border-border"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={toggleRecording}
              >
                <Mic className={`w-4 h-4 mr-2 ${isRecording ? 'text-destructive animate-pulse' : ''}`} />
                {isRecording ? 'Stop Recording' : 'Use Voice Input'}
              </Button>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-accent">AI-Powered Categorization</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No need to select a category. Our AI will automatically route your issue.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-4 sm:p-6 space-y-6" style={{ padding: "20px !important" }}>
            <div>
              <h2 className="text-lg font-semibold mb-1">Add Location & Evidence</h2>
              <p className="text-sm text-muted-foreground">
                Help us identify the exact location
              </p>
            </div>

            <div className="space-y-3">
              <div className="bg-secondary/50 border border-border rounded-md p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                    {detectingLocation ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <MapPin className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {detectingLocation ? "Detecting Location..." : "Current Location"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {location.address || "No location set"}
                    </p>
                    {location.lat !== 0 && location.lng !== 0 && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="flex-1"
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      {location.lat ? 'Refresh Location' : 'Detect Location'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant={manualAddress ? "default" : "outline"}
                  size="sm"
                  onClick={() => setManualAddress(!manualAddress)}
                  className="flex-1"
                >
                  Enter Manually
                </Button>
              </div>

              {manualAddress && (
                <div className="space-y-2">
                  <Label htmlFor="manual-address">Address</Label>
                  <Textarea
                    id="manual-address"
                    placeholder="Enter full address (e.g., 123 Main Road, Sector 15, New Delhi)"
                    rows={2}
                    value={location.address}
                    onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-input-background border-border"
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Upload Photos/Videos (max 5)</Label>
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
          </Card>
        )}

        {step === 3 && (
          <Card className="p-4 sm:p-6 space-y-6" style={{ padding: "20px" }}>
            <div>
              <h2 className="text-lg font-semibold mb-1">Verify & Submit</h2>
              <p className="text-sm text-muted-foreground">
                Review your grievance before submitting
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4 py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Issue Title</span>
                <span className="text-sm font-medium text-right">{title || "Not specified"}</span>
              </div>
              <div className="flex justify-between items-start gap-4 py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium text-primary">Auto-detected by AI</span>
              </div>
              <div className="flex justify-between items-start gap-4 py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="text-sm font-medium text-right">{location.address || "Not specified"}</span>
              </div>
              <div className="flex justify-between items-start gap-4 py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Attachments</span>
                <span className="text-sm font-medium">{files.length} file{files.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="py-3">
                <span className="text-sm text-muted-foreground block mb-2">Description</span>
                <p className="text-sm leading-relaxed">
                  {description || "No description provided"}
                </p>
              </div>
            </div>

            {/* File Preview Thumbnails */}
            {files.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {files.map((filePreview, index) => (
                  <div key={index} className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-secondary">
                    {filePreview.file.type.startsWith('image/') ? (
                      <img
                        src={filePreview.preview}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={filePreview.preview}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="bg-secondary/60 border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                You'll receive updates via SMS and in-app notifications about your grievance progress.
              </p>
            </div>
          </Card>
        )}

        {/* Step 4: AI Analysis Results */}
        {step === 4 && aiAnalysis && (
          <div className="space-y-4">
            {/* Success Banner */}
            <Card className="p-6 bg-success/10 border-success/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-success">Grievance Registered</h2>
                  <p className="text-sm text-muted-foreground">ID: {submittedGrievanceId}</p>
                </div>
              </div>
            </Card>

            {/* Duplicate Warning */}
            {aiAnalysis.duplicates.isDuplicate && (
              <Card className="p-4 bg-warning/10 border-warning/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Potential Duplicate Detected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Similar grievances have been found in your area. Your grievance has been linked for faster resolution.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Similar Grievances */}
            {aiAnalysis.duplicates.similarCount > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm text-foreground">Similar Issues ({aiAnalysis.duplicates.similarCount})</h3>
                </div>
                <div className="space-y-2">
                  {aiAnalysis.duplicates.similarGrievances.slice(0, 3).map((g) => (
                    <div key={g.id} className="flex items-center justify-between p-2 bg-secondary/70 rounded-lg">
                      <span className="text-sm truncate flex-1 text-foreground">{g.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{g.similarity}% match</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          g.status === 'resolved' ? 'bg-success/10 text-success' :
                          g.status === 'in_progress' ? 'bg-info/10 text-info' :
                          'bg-warning/10 text-warning'
                        }`}>{g.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Categorization */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-medium text-sm text-foreground">AI Categorization</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/70 rounded-lg">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium text-sm text-foreground">{aiAnalysis.categorization.category}</p>
                </div>
                <div className="p-3 bg-secondary/70 rounded-lg">
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium text-sm text-foreground truncate">{aiAnalysis.categorization.department.split('(')[0].trim()}</p>
                </div>
                <div className="p-3 bg-secondary/70 rounded-lg">
                  <p className="text-xs text-muted-foreground">Severity</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          aiAnalysis.categorization.severity >= 7 ? 'bg-destructive' :
                          aiAnalysis.categorization.severity >= 4 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${aiAnalysis.categorization.severity * 10}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">{aiAnalysis.categorization.severity}/10</span>
                  </div>
                </div>
                <div className="p-3 bg-secondary/70 rounded-lg">
                  <p className="text-xs text-muted-foreground">Priority Score</p>
                  <p className="font-medium text-sm text-foreground">{aiAnalysis.categorization.priorityScore}/100</p>
                </div>
              </div>
            </Card>

            {/* Language Detection */}
            {aiAnalysis.translation.wasTranslated && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="w-4 h-4 text-info" />
                  <h3 className="font-medium text-sm">Language Detected</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your grievance was written in <span className="font-medium text-foreground">
                    {LANGUAGE_NAMES[aiAnalysis.translation.detectedLanguage] || aiAnalysis.translation.detectedLanguage}
                  </span> and has been translated for processing.
                </p>
              </Card>
            )}

            {/* Image Analysis */}
            {aiAnalysis.imageAnalysis && aiAnalysis.imageAnalysis.confidence > 0 && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-sm">Image Analysis</h3>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {aiAnalysis.imageAnalysis.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {aiAnalysis.imageAnalysis.description}
                </p>
                {aiAnalysis.imageAnalysis.detectedIssues.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {aiAnalysis.imageAnalysis.detectedIssues.map((issue, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-secondary rounded-full">
                        {issue}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Auto Response / Acknowledgment */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">Official Acknowledgment</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyAcknowledgment}
                >
                  {copiedAck ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="bg-secondary/50 rounded-md p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {aiAnalysis.autoResponse.acknowledgment}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Expected Resolution:</span>
                <span className="font-medium text-primary">
                  {aiAnalysis.autoResponse.expectedResolutionDays} days
                </span>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="p-4">
              <h3 className="font-medium text-sm mb-3">Next Steps</h3>
              <ul className="space-y-2">
                {aiAnalysis.autoResponse.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-primary">{i + 1}</span>
                    </div>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Blockchain Verification */}
            <Card className="p-4 bg-info/10 border-info/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-info" />
                <h3 className="font-medium text-sm text-info">Blockchain Verified</h3>
              </div>
              <p className="text-xs text-muted-foreground font-mono break-all">
                AI Analysis Hash: {aiAnalysis.aiAnalysisHash.slice(0, 16)}...{aiAnalysis.aiAnalysisHash.slice(-16)}
              </p>
            </Card>

            {/* Done Button */}
            <Button onClick={onSubmit} className="w-full">
              Done
            </Button>
          </div>
        )}

        {/* Navigation Buttons (hidden on step 4) */}
        {step < 4 && (
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 sm:flex-none"
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex-1"
                disabled={step === 1 && (!title.trim() || !description.trim())}
              >
                Continue
              </Button>
            ) : (
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
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
