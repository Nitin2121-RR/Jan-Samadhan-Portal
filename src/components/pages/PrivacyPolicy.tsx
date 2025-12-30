import { ArrowLeft, Shield, Eye, Database, Lock, Users, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
          <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: December 2025
          </p>
        </div>

        <div className="space-y-6 privacy-policy-container">
          <style>{`
            .privacy-policy-container {
              padding: 16px !important;
              box-sizing: border-box !important;
            }
            @media (min-width: 640px) {
              .privacy-policy-container {
                padding: 24px !important;
              }
            }
          `}</style>
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Our Commitment</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Jan-Samadhan Portal is committed to protecting your privacy. This policy explains
                  how we collect, use, and safeguard your personal information when you use our
                  grievance management platform.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-info/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-info" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Information We Collect</h2>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Account Information:</strong> Name, email, phone number, and address</li>
                  <li>• <strong>Grievance Data:</strong> Reports, descriptions, photos, and location data</li>
                  <li>• <strong>Usage Data:</strong> App interactions, preferences, and device information</li>
                  <li>• <strong>Voice Recordings:</strong> When using voice-to-text features (processed locally)</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-success/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">How We Use Your Information</h2>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Process and track your grievances</li>
                  <li>• Communicate updates about your reports</li>
                  <li>• Improve our services and user experience</li>
                  <li>• Ensure accountability through blockchain verification</li>
                  <li>• Generate anonymized analytics for public benefit</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-warning/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Data Security</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We implement industry-standard security measures including encryption,
                  secure servers, and access controls to protect your data. Grievance records
                  are secured using blockchain technology for immutability and transparency.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Data Sharing</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We share your grievance information only with relevant government authorities
                  for resolution. We do not sell or share your personal data with third parties
                  for marketing purposes. Community feed data is displayed anonymously.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Contact Us</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For privacy-related inquiries, please contact our Data Protection Officer at{" "}
                  <a href="mailto:privacy@jansamadhan.gov.in" className="text-primary hover:underline">
                    privacy@jansamadhan.gov.in
                  </a>
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
