
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { settingsService } from "@/lib/services/settingsService";
import { toast } from "sonner";
import { Loader2, Save, Image as ImageIcon, X, MessageSquare, BarChart3, Link as LinkIcon, Pencil } from "lucide-react";
import { getDirectUrl } from "@/lib/utils/imageUtils";

interface HeroImage {
  url: string;
  link?: string;
}

const SettingsTab = () => {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [mobileHeroImages, setMobileHeroImages] = useState<HeroImage[]>([]);
  
  const [newImage, setNewImage] = useState("");
  const [newImageLink, setNewImageLink] = useState("");
  const [editingDesktopIndex, setEditingDesktopIndex] = useState<number | null>(null);

  const [newMobileImage, setNewMobileImage] = useState("");
  const [newMobileImageLink, setNewMobileImageLink] = useState("");
  const [editingMobileIndex, setEditingMobileIndex] = useState<number | null>(null);

  const [enableBanner, setEnableBanner] = useState(false);
  const [bannerText, setBannerText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Try fetching the new array setting
      const images = await settingsService.getJsonSetting<any[]>("hero_images", []);
      const mobileImages = await settingsService.getJsonSetting<any[]>("hero_images_mobile", []);
      
      // Normalize Desktop Images
      if (images && images.length > 0) {
        setHeroImages(images.map(img => {
            if (typeof img === 'string') return { url: getDirectUrl(img), link: "" };
            return { url: getDirectUrl(img.url), link: img.link || "" };
        }));
      } else {
        const oldUrl = await settingsService.getSetting("hero_image_url");
        if (oldUrl) {
          setHeroImages([{ url: getDirectUrl(oldUrl), link: "" }]);
        }
      }

      // Normalize Mobile Images
      if (mobileImages && mobileImages.length > 0) {
          setMobileHeroImages(mobileImages.map(img => {
            if (typeof img === 'string') return { url: getDirectUrl(img), link: "" };
            return { url: getDirectUrl(img.url), link: img.link || "" };
          }));
      }

      // Fetch banner settings
      const bannerEnabled = await settingsService.getSetting("banner_enabled");
      setEnableBanner(bannerEnabled === "true"); 
      const bannerText = await settingsService.getSetting("banner_text");
      setBannerText(bannerText || "");



    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const results = await Promise.all([
        settingsService.updateSetting("hero_images", heroImages),
        settingsService.updateSetting("hero_images_mobile", mobileHeroImages),
        settingsService.updateSetting("banner_enabled", String(enableBanner)),
        settingsService.updateSetting("banner_text", bannerText)
      ]);
      
      const allSuccess = results.every(r => r.success);
      
      if (allSuccess) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings: " + (results.find(r => !r.success)?.error?.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const validateUrl = (url: string): string | null => {
    // Check for ImgBB viewer links (common mistake)
    if (url.includes("ibb.co") && !url.includes("i.ibb.co")) {
      return "For ImgBB, please copy the 'Direct Link' (ends in .jpg/.png), not the Viewer link.";
    }
    return null;
  };

  const addImage = () => {
    if (!newImage.trim()) return;
    
    const validationError = validateUrl(newImage.trim());
    if (validationError) {
      toast.warning("Invalid Link Format", {
        description: validationError,
        duration: 6000,
      });
      return;
    }

    const directUrl = getDirectUrl(newImage.trim());
    
    if (editingDesktopIndex !== null) {
        const updated = [...heroImages];
        updated[editingDesktopIndex] = { url: directUrl, link: newImageLink.trim() };
        setHeroImages(updated);
        setEditingDesktopIndex(null);
        toast.success("Image updated! Don't forget to Save.");
    } else {
        setHeroImages([...heroImages, { url: directUrl, link: newImageLink.trim() }]);
        toast.success("Image added! Don't forget to Save.");
    }
    
    setNewImage("");
    setNewImageLink("");
  };

  const editDesktopImage = (index: number) => {
      const img = heroImages[index];
      setNewImage(img.url);
      setNewImageLink(img.link || "");
      setEditingDesktopIndex(index);
      toast.info("Editing image. Click 'Update Slide' when done.");
  };

  const cancelEditDesktop = () => {
      setNewImage("");
      setNewImageLink("");
      setEditingDesktopIndex(null);
  };

  const addMobileImage = () => {
    if (!newMobileImage.trim()) return;
    
    const validationError = validateUrl(newMobileImage.trim());
    if (validationError) {
      toast.warning("Invalid Link Format", {
        description: validationError,
        duration: 6000,
      });
      return;
    }

    const directUrl = getDirectUrl(newMobileImage.trim());

    if (editingMobileIndex !== null) {
        const updated = [...mobileHeroImages];
        updated[editingMobileIndex] = { url: directUrl, link: newMobileImageLink.trim() };
        setMobileHeroImages(updated);
        setEditingMobileIndex(null);
        toast.success("Mobile image updated! Don't forget to Save.");
    } else {
        setMobileHeroImages([...mobileHeroImages, { url: directUrl, link: newMobileImageLink.trim() }]);
        toast.success("Mobile image added! Don't forget to Save.");
    }

    setNewMobileImage("");
    setNewMobileImageLink("");
  };

  const editMobileImage = (index: number) => {
      const img = mobileHeroImages[index];
      setNewMobileImage(img.url);
      setNewMobileImageLink(img.link || "");
      setEditingMobileIndex(index);
      toast.info("Editing mobile image. Click 'Update Slide' when done.");
  };

  const cancelEditMobile = () => {
      setNewMobileImage("");
      setNewMobileImageLink("");
      setEditingMobileIndex(null);
  };

  const removeImage = (index: number) => {
    const newImages = [...heroImages];
    newImages.splice(index, 1);
    setHeroImages(newImages);
    if (editingDesktopIndex === index) cancelEditDesktop();
  };

  const removeMobileImage = (index: number) => {
    const newImages = [...mobileHeroImages];
    newImages.splice(index, 1);
    setMobileHeroImages(newImages);
    if (editingMobileIndex === index) cancelEditMobile();
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
      <Card>
        <CardHeader>
          <CardTitle>Site Settings</CardTitle>
          <CardDescription>Manage global configuration for your store.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Desktop Hero Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-gold" />
              Hero Section Images (Desktop)
            </h3>
            
            <div className={`grid gap-4 p-4 rounded-xl border transition-colors ${editingDesktopIndex !== null ? 'bg-gold/10 border-gold' : 'bg-muted/10 border-border'}`}>
              <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="hero-image">{editingDesktopIndex !== null ? 'Edit Image URL' : 'Image URL'}</Label>
                      <Input
                        id="hero-image"
                        placeholder="Paste image link here..."
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="hero-link">Link URL (Optional)</Label>
                      <Input
                        id="hero-link"
                        placeholder="/shop/perfumes"
                        value={newImageLink}
                        onChange={(e) => setNewImageLink(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addImage()}
                      />
                  </div>
              </div>
              <div className="flex gap-2">
                  <Button onClick={addImage} type="button" variant="default" className="flex-1 md:flex-none">
                      {editingDesktopIndex !== null ? 'Update Slide' : 'Add Slide'}
                  </Button>
                  {editingDesktopIndex !== null && (
                      <Button onClick={cancelEditDesktop} type="button" variant="outline">Cancel</Button>
                  )}
              </div>
              <p className="text-xs text-muted-foreground">
                Paste a direct link from <strong>ImgBB or Dropbox</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {heroImages.map((img, index) => (
                   <div key={index} className={`relative group rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all ${editingDesktopIndex === index ? 'ring-2 ring-gold' : 'border-border'}`}>
                     <div className="aspect-video w-full bg-muted relative">
                       <img 
                         src={img.url} 
                         alt={`Hero ${index + 1}`} 
                         className="object-cover w-full h-full"
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.src = "/fallback-product.jpg";
                         }}
                       />
                       {img.link && (
                           <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                               <LinkIcon className="h-3 w-3" /> {img.link}
                           </div>
                       )}
                     </div>
                     
                     <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button
                         onClick={() => editDesktopImage(index)}
                         className="bg-background/80 hover:bg-primary text-primary hover:text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-sm"
                         title="Edit Slide"
                       >
                         <Pencil className="h-4 w-4" />
                       </button>
                       <button
                         onClick={() => removeImage(index)}
                         className="bg-background/80 hover:bg-destructive text-destructive hover:text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-sm"
                         title="Remove Slide"
                       >
                         <X className="h-4 w-4" />
                       </button>
                     </div>
                   </div>
                 ))}
            </div>
          </div>

          {/* Mobile Hero Images */}
          <div className="space-y-4 pt-6 border-t">
               <h3 className="text-lg font-medium flex items-center gap-2">
                 <ImageIcon className="h-5 w-5 text-gold" />
                 Hero Section Images (Mobile)
               </h3>
               
               <div className={`grid gap-4 p-4 rounded-xl border transition-colors ${editingMobileIndex !== null ? 'bg-gold/10 border-gold' : 'bg-muted/10 border-border'}`}>
                  <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="mobile-image">{editingMobileIndex !== null ? 'Edit Mobile Image URL' : 'Mobile Image URL'}</Label>
                          <Input
                            id="mobile-image"
                            placeholder="Paste mobile image link here..."
                            value={newMobileImage}
                            onChange={(e) => setNewMobileImage(e.target.value)}
                          />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="mobile-link">Link URL (Optional)</Label>
                          <Input
                            id="mobile-link"
                            placeholder="/shop/gift-sets"
                            value={newMobileImageLink}
                            onChange={(e) => setNewMobileImageLink(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addMobileImage()}
                          />
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <Button onClick={addMobileImage} type="button" variant="default" className="flex-1 md:flex-none">
                          {editingMobileIndex !== null ? 'Update Slide' : 'Add Slide'}
                      </Button>
                      {editingMobileIndex !== null && (
                          <Button onClick={cancelEditMobile} type="button" variant="outline">Cancel</Button>
                      )}
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                 {mobileHeroImages.map((img, index) => (
                   <div key={index} className={`relative group rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all ${editingMobileIndex === index ? 'ring-2 ring-gold' : 'border-border'}`}>
                     <div className="aspect-[9/16] w-full bg-muted relative">
                       <img 
                         src={img.url} 
                         alt={`Mobile Hero ${index + 1}`} 
                         className="object-cover w-full h-full"
                         onError={(e) => {
                           const target = e.target as HTMLImageElement;
                           target.src = "/fallback-product.jpg";
                         }}
                       />
                       {img.link && (
                           <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 max-w-[90%] truncate">
                               <LinkIcon className="h-3 w-3 shrink-0" /> {img.link}
                           </div>
                       )}
                     </div>
                     
                     <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                         onClick={() => editMobileImage(index)}
                         className="bg-background/80 hover:bg-primary text-primary hover:text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-sm"
                         title="Edit Slide"
                       >
                         <Pencil className="h-4 w-4" />
                       </button>
                       <button
                         onClick={() => removeMobileImage(index)}
                         className="bg-background/80 hover:bg-destructive text-destructive hover:text-white p-2 rounded-full backdrop-blur-sm transition-all shadow-sm"
                         title="Remove Slide"
                       >
                         <X className="h-4 w-4" />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
          </div>

          {/* Announcement Banner Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gold" />
              Announcement Banner
            </h3>
            
            <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
               <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                   <Label className="text-base font-bold">Show Banner</Label>
                   <p className="text-sm text-muted-foreground">Display an animated banner at the top of the site.</p>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Switch
                     id="banner-mode"
                     checked={enableBanner}
                     onCheckedChange={setEnableBanner}
                   />
                 </div>
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
