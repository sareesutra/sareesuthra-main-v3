import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { productService } from "@/lib/services/productService";
import { Product } from "@/lib/products";
import { ArrowRight, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getDirectUrl } from "@/lib/utils/imageUtils";

const FeaturedGiftSet = () => {
    const [giftSet, setGiftSet] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    const [bundleImages, setBundleImages] = useState<string[]>([]);

    // Use scroll reveal for animations - pass loading as trigger so it re-runs when content appears
    useScrollReveal("animate-reveal", 0.1, loading);

    useEffect(() => {
        const fetchFeaturedSet = async () => {
            try {
                const products = await productService.getProducts();

                // Get all valid products for the spotlight
                const validProducts = products.filter(p => !p.isHidden);

                // Fallback: If no "visible" products found (e.g. mapping issue), use ANY product from DB
                // This ensures we show something if data exists, rather than an empty section
                const finalPool = validProducts.length > 0 ? validProducts : products;

                if (finalPool.length === 0) {
                    console.warn("Daily Spotlight: No products found in database.");
                    setGiftSet(null);
                    return;
                }

                // Priority 1: Check for explicitly featured product
                const featuredProduct = finalPool.find(p => p.is_featured);

                if (featuredProduct) {
                    setGiftSet(featuredProduct);
                } else {
                    // Priority 2: Fallback to Date-based rotation if no featured product set
                    const today = new Date().toISOString().split('T')[0];
                    let seed = 0;
                    for (let i = 0; i < today.length; i++) {
                        seed += today.charCodeAt(i);
                    }
                    
                    const randomIndex = seed % finalPool.length;
                    const dailySpotlight = finalPool[randomIndex];
                    setGiftSet(dailySpotlight);
                }

            } catch (error) {
                console.error("Failed to fetch featured product", error);
                setGiftSet(null);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedSet();
    }, []);

    // Fetch bundle images effect (separate to avoid deep nesting issues)
    useEffect(() => {
        if (!giftSet) return;
        
        const fetchBundleImages = async () => {
             // Only fetch if it's a gift set, has no main images (or just 1 placeholder/empty), and has bundle items to show
            if (giftSet.isGiftSet && (!giftSet.images || giftSet.images.length === 0 || (giftSet.images.length === 1 && !giftSet.images[0]))) {
                if (giftSet.bundleItems && giftSet.bundleItems.length > 0) {
                    try {
                        const bundlePromises = giftSet.bundleItems.map(bId => productService.getProductById(bId));
                        const bundleResults = await Promise.all(bundlePromises);
                        const validImages = bundleResults
                        .filter(p => p !== null)
                        .map(p => p!.images[0])
                        .filter(Boolean);
                        
                        if (validImages.length > 0) {
                            setBundleImages(validImages);
                        }
                    } catch (err) {
                        console.error("Failed to fetch bundle images for featured set", err);
                    }
                }
            }
        };
        fetchBundleImages();
    }, [giftSet]);

    if (loading || !giftSet) return null;

    const productData = giftSet;
    const hasMainImage = productData.images && productData.images.length > 0 && productData.images[0];
    const displayImage = hasMainImage ? productData.images[0] : "/fallback-product.jpg";
    const showBundleGrid = !hasMainImage && bundleImages.length > 0;
    
    // Create a truncated description if none exists or it's too long
    const shortDesc = productData.description 
        ? (productData.description.length > 120 ? productData.description.substring(0, 120) + "..." : productData.description)
        : "Experience luxury in every breath with our curated collection.";

    return (
        <section className="bg-puniora-void relative overflow-hidden text-puniora-black py-20">

            {/* MOBILE LAYOUT: Cinematic (Block on Mobile, Hidden on LG Screens) */}
            <div className="lg:hidden relative w-full min-h-[600px] overflow-hidden group pb-12">
                <div className="relative aspect-[4/5] mx-6 rounded-[2rem] overflow-hidden shadow-xl mb-8">
                    {showBundleGrid ? (
                        <div className={`w-full h-full grid ${bundleImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
                            {bundleImages.slice(0, 4).map((img, idx) => (
                                <img
                                    key={idx}
                                    src={getDirectUrl(img, 1200)}
                                    alt=""
                                    className={`w-full h-full object-cover opacity-100 transition-transform duration-[2000ms] group-hover:scale-105
                                      ${bundleImages.length === 2 && idx === 0 ? 'border-r border-white/20' : ''}
                                      ${bundleImages.length > 2 && idx === 0 ? 'border-r border-b border-white/20' : ''}
                                      ${bundleImages.length > 2 && idx === 1 ? 'border-b border-white/20' : ''}
                                      ${bundleImages.length > 2 && idx === 2 ? 'border-r border-white/20' : ''}
                                      ${bundleImages.length === 3 && idx === 2 ? 'col-span-2 border-r-0' : ''} 
                                    `}
                                />
                            ))}
                        </div>
                    ) : (
                        <img
                            src={getDirectUrl(displayImage, 1200)}
                            alt={productData.name}
                            width="800"
                            height="1200"
                            loading="eager"
                            // @ts-ignore
                            fetchpriority="high"
                            className="w-full h-full object-cover transition-transform [transition-duration:2000ms] group-hover:scale-105"
                        />
                    )}
                </div>

                <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-end">
                    <div className="max-w-xl space-y-4 reveal opacity-0 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-puniora-orange-50 border border-puniora-orange-200 rounded-full mb-2 mx-auto">
                            <span className="w-1.5 h-1.5 rounded-full bg-puniora-orange-500 animate-pulse" />
                            <span className="text-[10px] font-medium text-puniora-orange-700 uppercase tracking-widest">Best Seller</span>
                        </div>

                        <h2 className="text-4xl font-heading font-medium leading-[1.1] text-puniora-orange-DEFAULT">
                            Experience <br />
                            <span className="italic font-light block mt-1 text-3xl text-puniora-black">
                                {productData.name}
                            </span>
                        </h2>

                        <p className="text-sm text-gray-600 font-light leading-relaxed max-w-xs mx-auto">
                            "{shortDesc}"
                        </p>

                        <div className="flex justify-center gap-8 pt-2">
                            <div>
                                <p className="text-xl font-heading text-puniora-black">
                                    ₹{productData.price}
                                    {productData.real_price && (
                                        <span className="text-sm text-gray-400 line-through ml-2">₹{productData.real_price}</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 px-4">
                            <Link to={`/products/${productService.createSlug(productData.name)}`}>
                                <Button size="lg" disabled={productData.is_sold_out} className="w-full h-12 bg-puniora-orange-DEFAULT text-white hover:bg-puniora-orange-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span className="text-xs font-bold uppercase tracking-[0.2em] mr-2">
                                        {productData.is_sold_out ? "Sold Out" : "Shop Now"}
                                    </span>
                                    {!productData.is_sold_out && <ArrowRight className="w-4 h-4" />}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>


            {/* DESKTOP LAYOUT: Split Luxury (Hidden on Mobile, Block on LG Screens) */}
            <div className="hidden lg:block py-12 container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-24 items-center">
                    {/* Image Content - Left */}
                    <div className="relative group reveal opacity-0">
                        <div className="absolute inset-0 bg-gold/10 blur-3xl transform scale-90 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-full" />
                        <div className="relative z-10">
                            <div className="absolute inset-0 border border-puniora-orange-200 rounded-t-[150px] rounded-b-[20px] translate-x-4 translate-y-4 transition-transform duration-700 group-hover:translate-x-6 group-hover:translate-y-6" />
                            <div 
                                className="relative rounded-t-[150px] rounded-b-[20px] overflow-hidden shadow-2xl shadow-gray-200 aspect-[4/5] max-w-md mx-auto bg-white"
                            >
                                {showBundleGrid ? (
                                    <div className={`w-full h-full grid ${bundleImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
                                        {bundleImages.slice(0, 4).map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={getDirectUrl(img, 1200)}
                                                alt=""
                                                className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 will-change-transform
                                                  ${bundleImages.length === 2 && idx === 0 ? 'border-r border-white/20' : ''}
                                                  ${bundleImages.length > 2 && idx === 0 ? 'border-r border-b border-white/20' : ''}
                                                  ${bundleImages.length > 2 && idx === 1 ? 'border-b border-white/20' : ''}
                                                  ${bundleImages.length > 2 && idx === 2 ? 'border-r border-white/20' : ''}
                                                  ${bundleImages.length === 3 && idx === 2 ? 'col-span-2 border-r-0' : ''} 
                                                `}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <img
                                        src={getDirectUrl(displayImage, 1200)}
                                        alt={productData.name}
                                        width="500"
                                        height="625"
                                        loading="eager"
                                        // @ts-ignore
                                        fetchpriority="high"
                                        className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105 will-change-transform"
                                    />
                                )}

                                <div className="absolute bottom-8 left-8 z-20 bg-white/80 backdrop-blur-md border border-white/50 px-6 py-3 rounded-full flex items-center gap-3 shadow-lg cursor-default">
                                    <span className="h-2 w-2 rounded-full bg-puniora-orange-500 animate-pulse-glow" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-puniora-orange-900">Best Seller</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Content - Right */}
                    <div className="space-y-10 reveal opacity-0" style={{ animationDelay: '0.2s' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 border-b border-puniora-orange-500/30 text-puniora-orange-600 text-xs font-bold uppercase tracking-[0.3em]">
                            Featured Item
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-6xl lg:text-7xl font-heading leading-tight text-puniora-orange-DEFAULT">
                                Experience <br />
                                <span className="italic font-light text-puniora-black pr-4">
                                    {productData.name}
                                </span>
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed max-w-lg font-light tracking-wide">
                                "{shortDesc}"
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6 items-center pt-4">
                            <Link to={`/products/${productService.createSlug(productData.name)}`}>
                                <Button size="xl" disabled={productData.is_sold_out} className="bg-puniora-orange-DEFAULT text-white hover:bg-puniora-orange-700 hover:scale-105 transition-all duration-500 h-14 px-10 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                                    <span className="text-xs font-bold uppercase tracking-[0.2em] mr-2">
                                        {productData.is_sold_out ? "Sold Out" : "Shop Now"}
                                    </span>
                                    {!productData.is_sold_out && <ArrowRight className="h-4 w-4" />}
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-puniora-orange-100">
                            <div className="space-y-1">
                                <h4 className="text-puniora-black font-heading text-4xl lg:text-5xl">₹{productData.price}</h4>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Limited Time</p>
                            </div>
                             <div className="space-y-1">
                                <h4 className="text-puniora-orange-700 font-heading text-4xl lg:text-5xl">{productData.category}</h4>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-1">Category</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedGiftSet;
