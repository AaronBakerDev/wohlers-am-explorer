'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Lock, TrendingUp, Database, FileText, Globe } from "lucide-react"

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Unlock Premium AM Industry Data</DialogTitle>
          <DialogDescription className="text-base mt-2">
            Get access to exclusive datasets, advanced analytics, and comprehensive market intelligence
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Premium Datasets</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">AM Materials Market Trends - 245+ materials analyzed</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Aerospace & Automotive Applications - 200+ case studies</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Medical Device Manufacturing - 78+ applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Software Platforms Analysis - 45+ platforms reviewed</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Premium Features</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited data exports (CSV, Excel, JSON)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Advanced filtering and search capabilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Real-time market updates and alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">API access for data integration</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {/* Basic Plan */}
            <div className="border border-border rounded-lg p-6 relative">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Basic</h3>
                  <p className="text-sm text-muted-foreground mt-1">Essential AM data access</p>
                </div>
                <div className="text-3xl font-bold">
                  $199<span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>2 Premium datasets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>100 exports/month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Start Free Trial
                </Button>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="border-2 border-primary rounded-lg p-6 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2" variant="default">
                Most Popular
              </Badge>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Professional</h3>
                  <p className="text-sm text-muted-foreground mt-1">Complete market intelligence</p>
                </div>
                <div className="text-3xl font-bold">
                  $499<span className="text-lg font-normal text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>All Premium datasets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Unlimited exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>API access</span>
                  </li>
                </ul>
                <Button className="w-full">
                  Start Free Trial
                </Button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-border rounded-lg p-6 relative">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Enterprise</h3>
                  <p className="text-sm text-muted-foreground mt-1">Custom solutions</p>
                </div>
                <div className="text-3xl font-bold">
                  Custom
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Custom datasets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Dedicated support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>White-label options</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>SLA guarantee</span>
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="bg-muted/50 rounded-lg p-4 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold">Why Subscribe?</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Gain competitive advantage with exclusive access to Wohlers Associates&apos; comprehensive AM market data. 
              Our premium datasets include detailed analysis, industry forecasts, and insights not available anywhere else.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              All plans include a 14-day free trial. Cancel anytime.
            </p>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}