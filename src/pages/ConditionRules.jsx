import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Settings2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ConditionRules() {
  return (
    <AdminLayout title="Condition Rules" subtitle="Price deduction rules for device conditions">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Settings2 className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Per-Model Condition Rules
        </h2>
        
        <p className="text-muted-foreground max-w-md mb-6">
          Condition rules are now set individually for each mobile model. 
          This allows you to customize price deductions based on the specific device.
        </p>
        
        <Link to="/mobiles">
          <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
            Go to Mobiles
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-2">📱 How it works</h3>
          <p className="text-sm text-muted-foreground">
            When adding or editing a mobile model, you can set custom deduction percentages for screen condition, body condition, battery health, and functional issues.
          </p>
        </div>
        
        <div className="stat-card">
          <h3 className="font-semibold text-foreground mb-2">💡 Benefits</h3>
          <p className="text-sm text-muted-foreground">
            Different phone models may have different repair costs. Setting per-model rules ensures accurate pricing based on each device's specific characteristics.
          </p>
        </div>
      </div>

      {/* Default Rules Reference */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold text-foreground mb-4">Default Deduction Rules (Applied to New Models)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-foreground mb-2">📱 Screen</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>Perfect: 0%</li>
              <li>Minor scratches: 5%</li>
              <li>Visible scratches: 10%</li>
              <li>Cracked (Minor): 20%</li>
              <li>Cracked (Major): 35%</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">🔧 Body</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>Like new: 0%</li>
              <li>Minor dents: 5%</li>
              <li>Visible dents: 10%</li>
              <li>Heavy wear: 20%</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">🔋 Battery</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>90-100%: 0%</li>
              <li>80-89%: 5%</li>
              <li>70-79%: 10%</li>
              <li>60-69%: 15%</li>
              <li>Below 60%: 25%</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">⚙️ Functional</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>All working: 0%</li>
              <li>Camera issues: 15%</li>
              <li>Speaker/Mic: 10%</li>
              <li>Touch issues: 20%</li>
              <li>Face ID/Fingerprint: 15%</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
