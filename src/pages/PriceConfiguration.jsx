import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function PriceConfiguration() {
    const [activeTab, setActiveTab] = useState('screen');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState({
        screen: { perfect: 0, scratched: 0, cracked: 0 },
        body: { perfect: 0, scratched: 0, damaged: 0 },
        battery: { good: 0, average: 0, poor: 0 }
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/price-config');
            // Ensure we have default structure if API returns partial data
            setConfig({
                screen: { perfect: 0, scratched: 10, cracked: 25, ...data.screen },
                body: { perfect: 0, scratched: 10, damaged: 20, ...data.body },
                battery: { good: 0, average: 10, poor: 20, ...data.battery }
            });
        } catch (error) {
            console.error('Failed to fetch price config:', error);
            toast.error('Failed to load configuration');
            // Set defaults on error
            setConfig({
                screen: { perfect: 0, scratched: 10, cracked: 25 },
                body: { perfect: 0, scratched: 10, damaged: 20 },
                battery: { good: 0, average: 10, poor: 20 }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (category, condition, value) => {
        // Ensure value is a number between 0 and 100
        const numValue = Math.min(100, Math.max(0, Number(value) || 0));

        setConfig(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [condition]: numValue
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.put('/price-config', config);
            toast.success('Price configuration saved successfully');
        } catch (error) {
            console.error('Failed to save config:', error);
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Price Configuration" subtitle="Manage deduction rules">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    const tabs = [
        { id: 'screen', label: 'Screen Condition' },
        { id: 'body', label: 'Body Condition' },
        { id: 'battery', label: 'Battery Health' }
    ];

    return (
        <AdminLayout title="Price Configuration" subtitle="Manage deduction percentages">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Helper Alert */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                        <h4 className="font-medium text-primary">How this works</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Adjust the percentage deducted from the base price for each condition provided.
                            For example, if a Base Price is $1000 and "Scratched Screen" is set to 10%, the final price will be $900.
                        </p>
                    </div>
                </div>

                {/* Configuration Card */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Deduction Rules</CardTitle>
                                <CardDescription>Set percentage deductions (0-100%)</CardDescription>
                            </div>
                            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>

                        {/* Custom Tabs */}
                        <div className="flex border-b border-border mb-6 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                            {activeTab === 'screen' && (
                                <div className="grid gap-6 sm:grid-cols-3">
                                    {['perfect', 'scratched', 'cracked'].map(condition => (
                                        <div key={condition} className="space-y-2">
                                            <Label className="capitalize">{condition}</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={config.screen[condition]}
                                                    onChange={(e) => handleInputChange('screen', condition, e.target.value)}
                                                    className="pr-8"
                                                />
                                                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'body' && (
                                <div className="grid gap-6 sm:grid-cols-3">
                                    {['perfect', 'scratched', 'damaged'].map(condition => (
                                        <div key={condition} className="space-y-2">
                                            <Label className="capitalize">{condition}</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={config.body[condition]}
                                                    onChange={(e) => handleInputChange('body', condition, e.target.value)}
                                                    className="pr-8"
                                                />
                                                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'battery' && (
                                <div className="grid gap-6 sm:grid-cols-3">
                                    {['good', 'average', 'poor'].map(condition => (
                                        <div key={condition} className="space-y-2">
                                            <Label className="capitalize">{condition}</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={config.battery[condition]}
                                                    onChange={(e) => handleInputChange('battery', condition, e.target.value)}
                                                    className="pr-8"
                                                />
                                                <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
