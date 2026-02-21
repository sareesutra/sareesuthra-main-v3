import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck, Truck, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Product, formatPrice } from "@/lib/products";
import { productService } from "@/lib/services/productService";
import { settingsService } from "@/lib/services/settingsService";
import { getDirectUrl } from "@/lib/utils/imageUtils";
import { defaultHomeMediaSlots, HomeMediaSlot, mergeHomeMediaSlots } from "@/lib/homeMedia";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [homeMedia, setHomeMedia] = useState<HomeMediaSlot[]>(defaultHomeMediaSlots);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [data, media] = await Promise.all([
          productService.getProducts(),
          settingsService.getJsonSetting<HomeMediaSlot[]>("home_media_slots", defaultHomeMediaSlots),
        ]);
        setProducts((data || []).filter((p) => !p.isHidden));

        // If no media slots found in DB, initialize them
        if (!media || media.length === 0) {
          await settingsService.initializeDefaultSettings(defaultHomeMediaSlots);
        }
        setHomeMedia(mergeHomeMediaSlots(media));
      } catch (error) {
        console.error("Failed loading products", error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const latestProducts = useMemo(() => products.slice(0, 4), [products]);
  const handworkProducts = useMemo(() => products.slice(4, 8), [products]);
  const mediaByKey = useMemo(() => {
    const map = new Map(homeMedia.map((slot) => [slot.key, slot]));
    return (key: string) => map.get(key);
  }, [homeMedia]);

  return (
    <main className="min-h-screen relative overflow-hidden bg-puniora-void">
      <div className="relative z-10">
        <Header />

        <section className="pt-32 md:pt-40 pb-12 md:pb-20 px-4 md:px-8">
          <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative min-h-[60vh] md:min-h-[70vh]">
            <img
              src={mediaByKey("hero_main")?.url || "/home/banner-main.jpg"}
              alt="Saree Sutra hero"
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative z-10 h-full min-h-[60vh] md:min-h-[70vh] flex items-center justify-center text-center px-6">
              <div className="max-w-2xl text-white space-y-6">
                <p className="uppercase tracking-[0.35em] text-xs md:text-sm">Saree Sutra Collection</p>
                <h1 className="font-heading text-4xl md:text-6xl">Modern Drapes, Timeless Craft</h1>
                <p className="text-white/90 text-sm md:text-base">
                  Premium sarees curated for weddings, festive occasions, and elegant daily wear.
                </p>
                <Link
                  to={mediaByKey("hero_main")?.link || "/products"}
                  className="inline-flex items-center gap-2 bg-white text-puniora-black px-6 py-3 rounded-full text-xs uppercase tracking-[0.2em] font-semibold"
                >
                  Shop Now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl md:text-5xl text-puniora-orange-DEFAULT">Latest Collection</h2>
              <p className="text-muted-foreground mt-2">Fresh picks from your admin catalogue</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-puniora-orange-600" /></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {latestProducts.map((product) => (
                  <Link key={product.id} to={`/products/${productService.createSlug(product.name)}`} className="group block">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden">
                      <img
                        src={product.images?.[0] ? getDirectUrl(product.images[0], 800) : "/fallback-product.jpg"}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <h3 className="mt-3 text-sm md:text-base font-medium line-clamp-1">{product.name}</h3>
                    <p className="text-puniora-orange-700 text-sm">{formatPrice(product.price)}</p>
                  </Link>
                ))}
              </div>
            )}
            <div className="text-center mt-8">
              <Link to="/products" className="inline-block border border-puniora-orange-300 px-6 py-2 rounded-full text-xs uppercase tracking-[0.2em] hover:bg-puniora-orange-50">View All</Link>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20 px-4 md:px-8 bg-[#f3ecdf]">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-heading text-3xl md:text-5xl text-center mb-10 text-puniora-black">Shop By Collection</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link to={mediaByKey("collection_1")?.link || "/products"} className="relative col-span-2 md:col-span-1 h-72 md:h-[30rem] rounded-2xl overflow-hidden">
                <img src={mediaByKey("collection_1")?.url || "/home/collection-1.jpg"} alt="Festive Sarees" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-black/30 flex items-end p-6"><span className="text-white text-xl font-heading">Festive Sarees</span></div>
              </Link>
              <Link to={mediaByKey("collection_2")?.link || "/products"} className="relative h-72 md:h-[14.5rem] rounded-2xl overflow-hidden">
                <img src={mediaByKey("collection_2")?.url || "/home/collection-2.jpg"} alt="Silk Edition" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-black/25 flex items-end p-4"><span className="text-white font-heading">Silk Edition</span></div>
              </Link>
              <Link to={mediaByKey("collection_3")?.link || "/products"} className="relative h-72 md:h-[14.5rem] rounded-2xl overflow-hidden">
                <img src={mediaByKey("collection_3")?.url || "/home/collection-3.jpg"} alt="Wedding Looks" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-black/25 flex items-end p-4"><span className="text-white font-heading">Wedding Looks</span></div>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
          <div className="max-w-5xl mx-auto text-center">
            <h3 className="font-heading text-2xl md:text-4xl text-puniora-black">"Weaving Tradition Into Modern Elegance"</h3>
            <p className="text-muted-foreground mt-4">
              Saree Sutra brings heritage weaving and contemporary styling together for every celebration.
            </p>
          </div>
        </section>

        <section className="py-14 md:py-20 px-4 md:px-8 bg-[#f7f2ea]">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <p className="uppercase text-xs tracking-[0.3em] text-puniora-orange-700">Our Brand</p>
              <h3 className="font-heading text-3xl md:text-5xl">Made For Your Signature Drape</h3>
              <p className="text-muted-foreground">
                Every piece is selected for fabric quality, rich color depth, and elegant finish. We focus on wearable luxury.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 bg-puniora-orange-DEFAULT text-white rounded-full text-xs uppercase tracking-[0.2em]">
                Read More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <img src={mediaByKey("brand_story")?.url || "/our-story-saree.jpg"} alt="Saree Sutra brand story" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-heading text-3xl md:text-5xl text-center mb-10 text-puniora-black">Handwork Sarees</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {(handworkProducts.length ? handworkProducts : latestProducts).map((product) => (
                <Link key={product.id} to={`/products/${productService.createSlug(product.name)}`} className="group block">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden">
                    <img
                      src={product.images?.[0] ? getDirectUrl(product.images[0], 800) : "/fallback-product.jpg"}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3 className="mt-3 text-sm md:text-base font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-puniora-orange-700 text-sm">{formatPrice(product.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20 px-4 md:px-8 bg-[#f8f5ef]">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-heading text-3xl md:text-5xl text-center mb-10 text-puniora-black">Photo Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["gallery_1", "gallery_2", "gallery_3", "gallery_4"].map((key, index) => (
                <div key={key} className="aspect-[4/5] rounded-xl overflow-hidden">
                  <img src={mediaByKey(key)?.url || `/home/gallery-${index + 1}.jpg`} alt="Saree gallery" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 md:py-14 px-4 md:px-8 bg-white border-y">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <Truck className="h-5 w-5 mx-auto text-puniora-orange-700" />
              <p className="text-xs uppercase tracking-[0.2em]">Pan India Delivery</p>
            </div>
            <div className="space-y-2">
              <ShieldCheck className="h-5 w-5 mx-auto text-puniora-orange-700" />
              <p className="text-xs uppercase tracking-[0.2em]">Quality Checked</p>
            </div>
            <div className="space-y-2">
              <Sparkles className="h-5 w-5 mx-auto text-puniora-orange-700" />
              <p className="text-xs uppercase tracking-[0.2em]">Premium Styling</p>
            </div>
          </div>
        </section>

        <Footer />

        <SEO
          title="Premium Sarees Online"
          description="Shop premium sarees online at Saree Sutra. Discover wedding, festive, silk, and everyday drapes with trusted quality and Pan-India delivery."
          url="/"
        />
      </div>
    </main>
  );
};

export default Index;
