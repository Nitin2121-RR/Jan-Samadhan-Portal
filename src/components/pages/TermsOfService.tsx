import { ArrowLeft, FileText, AlertTriangle, CheckCircle, Scale, Ban, Gavel } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface TermsOfServiceProps {
  onBack: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: December 2025
          </p>
        </div>

        <div className="space-y-6 terms-of-service-container">
          <style>{`
            .terms-of-service-container {
              padding: 16px !important;
              box-sizing: border-box !important;
            }
            @media (min-width: 640px) {
              .terms-of-service-container {
                padding: 24px !important;
              }
            }
          `}</style>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Acceptance of Terms</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  By accessing and using the Jan-Samadhan Portal, you agree to be bound by these
                  Terms of Service. If you do not agree to these terms, please do not use the platform.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-success/10 rounded-md flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Eligibility</h2>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• You must be 18 years or older to create an account</li>
                  <li>• You must provide accurate and complete registration information</li>
                  <li>• You are responsible for maintaining account security</li>
                  <li>• One account per person is permitted</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-info/10 rounded-md flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-info" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Proper Use of Services</h2>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Submit genuine grievances only</li>
                  <li>• Provide accurate information and supporting evidence</li>
                  <li>• Use appropriate language in all submissions</li>
                  <li>• Respect the grievance resolution process</li>
                  <li>• Do not submit duplicate grievances for the same issue</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Ban className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Prohibited Activities</h2>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Filing false or frivolous grievances</li>
                  <li>• Impersonating others or using false identities</li>
                  <li>• Harassment or abuse of government officials</li>
                  <li>• Attempting to manipulate the priority scoring system</li>
                  <li>• Uploading harmful or illegal content</li>
                  <li>• Using bots or automated systems</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-warning/10 rounded-md flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Disclaimer</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  While we strive for timely resolution, the Jan-Samadhan Portal does not guarantee
                  specific resolution timelines. Resolution depends on the nature of the grievance
                  and the responsible authority. The platform facilitates communication but does
                  not replace official government procedures.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Gavel className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Termination</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or terminate accounts that violate these terms.
                  Users may appeal account actions by contacting support. Upon termination,
                  your grievance history may be retained for record-keeping purposes.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          © 2025 Jan-Samadhan Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}
