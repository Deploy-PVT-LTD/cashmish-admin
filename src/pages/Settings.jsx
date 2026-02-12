import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState({
    minPriceFloor: 50,
    maxDeduction: 70,
    currency: 'USD',
    autoApprove: false,
    emailNotifications: true,
    bidExpiry: 48,
    usdToPkrRate: 278,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <AdminLayout title="Settings" subtitle="Configure platform settings">
      <div className="max-w-2xl space-y-6">
        {/* Pricing Settings */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-foreground mb-6">Pricing Configuration</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Price Floor ($)</Label>
                <Input
                  type="number"
                  value={settings.minPriceFloor}
                  onChange={(e) => setSettings({ ...settings, minPriceFloor: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum accepted resale price
                </p>
              </div>
              <div className="space-y-2">
                <Label>Maximum Deduction (%)</Label>
                <Input
                  type="number"
                  value={settings.maxDeduction}
                  onChange={(e) => setSettings({ ...settings, maxDeduction: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Cap on total condition deductions
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="PKR">Pakistani Rupee (PKR)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>USD to PKR Exchange Rate</Label>
              <Input
                type="number"
                value={settings.usdToPkrRate}
                onChange={(e) => setSettings({ ...settings, usdToPkrRate: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Current exchange rate for inventory calculations
              </p>
            </div>

            <div className="space-y-2">
              <Label>Bid Expiry Time (hours)</Label>
              <Input
                type="number"
                value={settings.bidExpiry}
                onChange={(e) => setSettings({ ...settings, bidExpiry: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Time before pending bids expire
              </p>
            </div>
          </div>
        </div>

        {/* Automation Settings */}
        <div className="stat-card">
          <h3 className="text-lg font-semibold text-foreground mb-6">Automation</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Auto-approve Low-risk Submissions</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically accept submissions with perfect conditions
                </p>
              </div>
              <Switch
                checked={settings.autoApprove}
                onCheckedChange={(checked) => setSettings({ ...settings, autoApprove: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Email Notifications</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receive email alerts for new submissions
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="stat-card border-destructive/20">
          <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Reset All Condition Rules</p>
                <p className="text-sm text-muted-foreground">
                  Restore default deduction percentages
                </p>
              </div>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                Reset
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Clear All Pending Bids</p>
                <p className="text-sm text-muted-foreground">
                  Remove all bids awaiting response
                </p>
              </div>
              <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
