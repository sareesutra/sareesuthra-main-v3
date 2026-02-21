import { supabase } from "@/lib/supabase";

export const settingsService = {
  async getSetting(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.warn(`Error fetching setting ${key}:`, error);
      return null;
    }

    return data?.value || null;
  },

  async getJsonSetting<T>(key: string, defaultValue: T): Promise<T> {
    const value = await this.getSetting(key);
    if (!value) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.warn(`Failed to parse JSON setting for ${key}`, e);
      return defaultValue;
    }
  },

  async updateSetting(key: string, value: string | object): Promise<{ success: boolean; error?: any }> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value: stringValue, updated_at: new Date().toISOString() });

    if (error) {
      console.error(`Error updating setting ${key}:`, error);
      return { success: false, error };
    }

  },

  async initializeDefaultSettings(defaultSlots: any[]): Promise<{ success: boolean; message: string }> {
    try {
      // Check if home_media_slots exists
      const existing = await this.getSetting("home_media_slots");
      if (!existing) {
        console.log("Initializing default home_media_slots...");
        await this.updateSetting("home_media_slots", defaultSlots);
        await this.updateSetting("banner_enabled", "false");
        await this.updateSetting("banner_text", "Welcome to Saree Sutra!");
        return { success: true, message: "Settings initialized successfully" };
      }
      return { success: true, message: "Settings already exist" };
    } catch (error: any) {
      console.error("Initialization failed:", error);
      return { success: false, message: error.message };
    }
  }
};
