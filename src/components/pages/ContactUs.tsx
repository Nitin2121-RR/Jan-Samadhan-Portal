import { ArrowLeft, Mail, MapPin, Clock, MessageSquare, HelpCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface ContactUsProps {
  onBack: () => void;
}

export function ContactUs({ onBack }: ContactUsProps) {
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
          <h1 className="text-2xl font-bold mb-2">Contact Us</h1>
          <p className="text-sm text-muted-foreground">
            We're here to help. Reach out through any of the channels below.
          </p>
        </div>

        <div className="space-y-6 contact-us-container">
          <style>{`
            .contact-us-container {
              padding: 16px !important;
              box-sizing: border-box !important;
            }
            @media (min-width: 640px) {
              .contact-us-container {
                padding: 24px !important;
              }
            }
          `}</style>
          {/* Contact Methods */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-info/10 rounded-md flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email Support</h3>
                  <a
                    href="mailto:support@jansamadhan.gov.in"
                    className="text-sm text-primary hover:underline"
                  >
                    support@jansamadhan.gov.in
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Response within 24-48 hours
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-md flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">WhatsApp</h3>
                  <a
                    href="https://wa.me/911234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    +91 123 456 7890
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quick responses during business hours
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Office Address */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-warning/10 rounded-md flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Head Office</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Jan-Samadhan Portal<br />
                  Department of Administrative Reforms<br />
                  Government of India<br />
                  Sardar Patel Bhavan<br />
                  New Delhi - 110001
                </p>
              </div>
            </div>
          </Card>

          {/* Business Hours */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-md flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Office Hours</h2>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Monday - Friday:</strong> 9:00 AM - 6:00 PM</p>
                  <p><strong>Saturday:</strong> 10:00 AM - 2:00 PM</p>
                  <p><strong>Sunday & Public Holidays:</strong> Closed</p>
                </div>
              </div>
            </div>
          </Card>

          {/* FAQ Link */}
          <Card className="p-6 bg-secondary/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Frequently Asked Questions</h3>
                <p className="text-sm text-muted-foreground">
                  Find answers to common questions about using the portal
                </p>
              </div>
              <Button variant="outline" size="sm">
                View FAQs
              </Button>
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
