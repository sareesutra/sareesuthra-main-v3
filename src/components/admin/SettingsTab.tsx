import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { settingsService } from "@/lib/services/settingsService";
import { toast } from "sonner";
import { Loader2, Save, Image as ImageIcon, UploadCloud, MapPin } from "lucide-react";
import { getDirectUrl } from "@/lib/utils/imageUtils";
import { productService } from "@/lib/services/productService";
import { defaultHomeMediaSlots, HomeMediaSlot, mergeHomeMediaSlots } from "@/lib/homeMedia";

const SettingsTab = () => {
  const [homeMediaSlots, setHomeMediaSlots] = useState<HomeMediaSlot[]>(defaultHomeMediaSlots);
  const [enableBanner, setEnableBanner] = useState(false);
  const [bannerText, setBannerText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [activeUploadSlot, setActiveUploadSlot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [savedSlots, bannerEnabled, savedBannerText] = await Promise.all([
        settingsService.getJsonSetting<HomeMediaSlot[]>("home_media_slots", defaultHomeMediaSlots),
        settingsService.getSetting("banner_enabled"),
        settingsService.getSetting("banner_text"),
      ]);

      setHomeMediaSlots(mergeHomeMediaSlots(savedSlots));
      setEnableBanner(bannerEnabled === "true");
      setBannerText(savedBannerText || "");
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSlot = (key: string, patch: Partial<HomeMediaSlot>) => {
    setHomeMediaSlots((prev) => prev.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)));
  };

  const openUploadForSlot = (key: string) => {
    setActiveUploadSlot(key);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeUploadSlot) return;

    try {
      setUploadingSlot(activeUploadSlot);
      const uploadedUrl = await productService.uploadImage(file);
      updateSlot(activeUploadSlot, { url: uploadedUrl });
      toast.success("Image uploaded. Click Save Changes to publish.");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Image upload failed");
    } finally {
      setUploadingSlot(null);
      setActiveUploadSlot(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const results = await Promise.all([
        settingsService.updateSetting("home_media_slots", homeMediaSlots),
        settingsService.updateSetting("banner_enabled", String(enableBanner)),
        settingsService.updateSetting("banner_text", bannerText),
      ]);

      const allSuccess = results.every((r) => r.success);
      if (allSuccess) {
        toast.success("Homepage image settings saved successfully");
      } else {
        toast.error("Failed to save one or more settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      <Card>
        <CardHeader>
          <CardTitle>Homepage Media Manager</CardTitle>
          <CardDescription>
            Edit every homepage image from here: upload, replace, preview, and set where each image clicks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {homeMediaSlots.map((slot) => (
              <div key={slot.key} className="rounded-xl border border-border p-4 bg-muted/10 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-gold" />
                      {slot.label}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {slot.location}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openUploadForSlot(slot.key)}
                    disabled={uploadingSlot === slot.key}
                  >
                    {uploadingSlot === slot.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4 mr-2" /> Upload
                      </>
                    )}
                  </Button>
                </div>

                <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted border">
                  <img
                    src={getDirectUrl(slot.url, 1200)}
                    alt={slot.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/fallback-product.jpg";
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`url-${slot.key}`}>Image URL</Label>
                  <Input
                    id={`url-${slot.key}`}
                    value={slot.url}
                    onChange={(e) => updateSlot(slot.key, { url: getDirectUrl(e.target.value.trim()) })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`link-${slot.key}`}>Click Link</Label>
                  <Input
                    id={`link-${slot.key}`}
                    value={slot.link || ""}
                    onChange={(e) => updateSlot(slot.key, { link: e.target.value })}
                    placeholder="/products"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium">Announcement Banner</h3>
            <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Show Banner</Label>
                  <p className="text-sm text-muted-foreground">Display an animated banner at the top of the site.</p>
                </div>
                <Switch id="banner-mode" checked={enableBanner} onCheckedChange={setEnableBanner} />
              </div>

              {enableBanner && (
                <div className="space-y-2 animate-fade-in">
                  <Label>Banner Message</Label>
                  <Input
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    placeholder="e.g. Free Shipping on Orders over ₹999!"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="bg-gold hover:bg-gold/90 text-white">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
