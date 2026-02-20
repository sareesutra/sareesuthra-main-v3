import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productService } from "@/lib/services/productService";
import { Product, formatPrice } from "@/lib/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import RelatedProducts from "@/components/RelatedProducts";
import ReviewSection from "@/components/ReviewSection";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { reviewService } from "@/lib/services/reviewService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw, Share2, CreditCard, Banknote, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { getDirectUrl } from "@/lib/utils/imageUtils";
import RevealOnScroll from "@/components/ui/RevealOnScroll";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [averageRating, setAverageRating] = useState({ average: 0, count: 0 });
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedImage, setSelectedImage] = useState("");

  const [bundleImages, setBundleImages] = useState<string[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Try to fetch by slug first if it's not a UUID, or use the smart getProductBySlug which handles both
        const data = await productService.getProductBySlug(id);
        
        if (data && !data.isHidden) {
          setProduct(data);
          // Initialize selection from product base values
          setSelectedSize(data.size);
          setSelectedPrice(data.price);
          setSelectedImage(data.images[0]);


          // If the base product size matches a variant, load that variant's specific image/price if needed
          // But rely on base values first to respect the "Main" display
          if (data.variants && data.variants.length > 0) {
            const matchingVariant = data.variants.find(v => v.size === data.size);
            if (matchingVariant) {
              if (matchingVariant.price) setSelectedPrice(matchingVariant.price);
              if (matchingVariant.image) setSelectedImage(matchingVariant.image);
            }
          }

          // Fetch rating
          const ratingData = await reviewService.getAverageRating(data.id);
          setAverageRating(ratingData);

          // Fetch bundle items if this is a gift set with no images (or placeholder)
          if (data.isGiftSet && (!data.images || data.images.length === 0 || (data.images.length === 1 && !data.images[0]))) {
            if (data.bundleItems && data.bundleItems.length > 0) {
              const bundlePromises = data.bundleItems.map(bId => productService.getProductById(bId));
              const bundleResults = await Promise.all(bundlePromises);
              const validImages = bundleResults
                .filter(p => p !== null)
                .map(p => p!.images[0])
                .filter(Boolean);

              if (validImages.length > 0) {
                setBundleImages(validImages);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const handleVariantChange = (variant: any) => {
    setSelectedSize(variant.size);
    setSelectedPrice(variant.price);
    if (variant.image) {
      setSelectedImage(variant.image);
    } else {
      // Revert to default main image if variant has no specific image
      setSelectedImage("");
      setActiveImage(0);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart({ ...product, price: selectedPrice, size: selectedSize, images: [selectedImage, ...product.images.filter(i => i !== selectedImage)] });
      navigate("/checkout");
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name}: ${product.description ? product.description.substring(0, 100) + '...' : ''} at Puniora!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast.success("Link and details copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed/cancelled", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gold" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col pt-24 items-center justify-center text-center px-4">
        <h1 className="text-3xl font-heading mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8 text-lg">The fragrance you're looking for doesn't exist or has been removed.</p>
        <Link to="/">
          <Button variant="gold" size="lg">Return to Collection</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-40 pb-24 overflow-x-clip w-full">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb / Back button */}
          <RevealOnScroll variant="fade-in" delay={100}>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors mb-4 lg:mb-8 group">
              <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
              Back to Collection
            </Link>
          </RevealOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            <div className="flex flex-col-reverse lg:flex-row gap-4 w-full relative sm:sticky sm:top-24 lg:sticky lg:top-36 lg:z-10 lg:self-start h-fit">
              
              {/* Thumbnail strip (Images + Videos) */}
              {(product.images.length > 1 || (product.videos && product.videos.length > 0)) && (
                <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto lg:w-24 shrink-0 no-scrollbar py-2 px-1 w-full lg:w-auto lg:h-[600px]">
                  {/* Images */}
                  {product.images.map((img, index) => (
                    <div
                      key={`img-${index}`}
                      className={`relative w-16 h-16 lg:w-20 lg:h-20 shrink-0 bg-white border-2 rounded-xl p-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${(selectedImage === img || (!selectedImage && activeImage === index && !product.videos?.includes(selectedImage)))
                        ? 'border-gold shadow-md shadow-gold/10'
                        : 'border-border hover:border-gold/50'
                        }`}
                      onClick={() => { setActiveImage(index); setSelectedImage(img); }}
                    >
                      <img 
                        src={getDirectUrl(img, 200)} 
                        alt="" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'; // Hide if deeply broken, or maybe show fallback
                          // e.currentTarget.src = "fallback_url"; 
                        }} 
                      />
                    </div>
                  ))}

                  {/* Videos */}
                  {product.videos?.map((video, index) => {
                    const getYoutubeId = (url: string) => {
                      if (!url) return null;
                      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                      const match = url.match(regExp);
                      return (match && match[2].length === 11) ? match[2] : null;
                    };
                    const ytId = getYoutubeId(video);
                    const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/default.jpg` : null;

                    return (
                      <div
                        key={`vid-${index}`}
                        className={`relative w-16 h-16 lg:w-20 lg:h-20 shrink-0 bg-black border-2 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300 ${selectedImage === video
                          ? 'border-gold shadow-md shadow-gold/10'
                          : 'border-border hover:border-gold/50'
                          }`}
                        onClick={() => { setSelectedImage(video); }}
                      >
                        {thumbUrl ? (
                          <img src={getDirectUrl(thumbUrl)} alt="Video thumbnail" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                        ) : (
                          <div className="w-full h-full bg-neutral-900" />
                        )}

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-6 h-6 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Main Image Display */}
              <div className="flex-1 w-full bg-white rounded-3xl overflow-hidden border border-border shadow-xl shadow-gold/5 flex items-center justify-center aspect-square md:aspect-[4/3] lg:h-[600px] lg:aspect-auto relative group">
                  {/* Share Button Overlay */}
                  <div className="absolute top-4 right-4 z-20">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={handleShare}
                      className="rounded-full w-12 h-12 bg-gold text-white shadow-xl hover:bg-gold/90 transition-all duration-300 group/share z-30"
                      title="Share this fragrance"
                    >
                      <Share2 className="h-5 w-5 group-hover/share:scale-110 transition-transform" />
                    </Button>
                  </div>

                {(() => {
                  const currentMedia = selectedImage || product.images[activeImage];
                  // Helper to check for YouTube
                  const getYoutubeId = (url: string) => {
                    if (!url) return null;
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                    const match = url.match(regExp);
                    return (match && match[2].length === 11) ? match[2] : null;
                  };

                  const ytId = getYoutubeId(currentMedia);
                  const isVideo = product.videos?.includes(currentMedia);

                  if (isVideo && ytId) {
                    return (
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full rounded-2xl"
                      />
                    );
                  } else if (isVideo) {
                    // Fallback for non-YouTube videos (if any remaining)
                    return (
                      <div className="w-full h-full flex items-center justify-center bg-black rounded-2xl">
                        <p className="text-white">Video format not supported. Please use YouTube.</p>
                      </div>
                    );
                  }

                  // If we have bundle items but no specific selected image, show grid
                  if (bundleImages.length > 0 && !selectedImage && activeImage === 0 && (!product.images || product.images.length <= 1)) {
                    return (
                      <div className={`w-full h-full grid ${bundleImages.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
                        {bundleImages.slice(0, 4).map((img, idx) => (
                          <img
                            key={idx}
                            src={getDirectUrl(img)}
                            alt=""
                            className={`w-full h-full object-cover border-white/50
                                   ${bundleImages.length === 2 && idx === 0 ? 'border-r' : ''}
                                   ${bundleImages.length > 2 && idx === 0 ? 'border-r border-b' : ''}
                                   ${bundleImages.length > 2 && idx === 1 ? 'border-l border-b' : ''}
                                   ${bundleImages.length > 2 && idx === 2 ? 'border-r border-t' : ''}
                                   ${bundleImages.length > 2 && idx === 3 ? 'border-l border-t' : ''}
                                   ${bundleImages.length === 3 && idx === 2 ? 'col-span-2 border-r-0' : ''} 
                                 `}
                          />
                        ))}
                      </div>
                    );
                  }

                  if (!currentMedia) {
                    return (
                       <div className="w-full h-full flex items-center justify-center p-4 md:p-8 bg-muted/10 rounded-2xl">
                          <img src="/fallback-product.jpg" alt="Placeholder" className="h-full object-contain opacity-70" />
                       </div>
                    );
                  }

                  return (
                    <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
                      <img
                        key={currentMedia}
                        src={getDirectUrl(currentMedia)}
                        alt={product.name}
                        className="w-full h-full object-contain max-w-full max-h-full transition-all duration-500 group-hover:scale-105 animate-fade-in"
                        onError={(e) => {
                          e.currentTarget.src = "/fallback-product.jpg";
                        }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Column: Details (Scrollable) */}
            <div className="space-y-6 lg:space-y-8 flex flex-col h-full">
              <RevealOnScroll variant="slide-left" delay={300}>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <span className="bg-gold/10 text-gold px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] backdrop-blur-sm">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= Math.round(averageRating.average) ? 'fill-gold text-gold' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {averageRating.count} Reviews
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading leading-tight text-foreground break-words">
                    {product.name}
                  </h1>
                  <div className="flex flex-col gap-1">
                    {product.real_price && product.real_price > selectedPrice && (
                       <div className="flex items-center gap-3">
                         <span className="text-xl text-muted-foreground line-through decoration-destructive decoration-2">
                           {formatPrice(product.real_price)}
                         </span>
                         <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-bold rounded-full border border-green-500/20 uppercase tracking-wider">
                           {Math.round(((product.real_price - selectedPrice) / product.real_price) * 100)}% OFF
                         </span>
                       </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-medium gold-text-gradient italic">
                        {formatPrice(selectedPrice)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gradient-to-r from-gold via-yellow-500 to-gold text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-md shadow-gold/20 animate-pulse-slow">
                          Offer Price
                        </span>
                        {product.is_sold_out && (
                           <span className="px-3 py-1 bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-widest border border-destructive/20 rounded-md">
                             Out of Stock
                           </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-lg leading-relaxed border-l-2 border-gold/20 pl-6 italic break-words max-w-full overflow-hidden">
                  "{product.description}"
                </p>



                  <div className="bg-muted/30 p-6 md:p-8 rounded-3xl border border-border/50 space-y-6">
                    <h3 className="font-heading text-xl text-gold uppercase tracking-widest mb-4">Product Details</h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Fabric</span>
                        <p className="font-medium text-foreground">{product.fabric || "Pure Silk"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Weave</span>
                        <p className="font-medium text-foreground">{product.weave || "Handwoven"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Color</span>
                        <p className="font-medium text-foreground">{product.color || "Multicolor"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Wash Care</span>
                        <p className="font-medium text-foreground">{product.washCare || "Dry Clean Only"}</p>
                      </div>
                      <div className="col-span-2 border-t border-border/20 pt-4 mt-2 space-y-1">
                         <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Blouse Piece</span>
                         <p className="font-medium text-foreground">{product.blouseDetail || "Includes Unstitched Blouse Piece"}</p>
                      </div>
                    </div>
                  </div>



                {/* Desktop Action Buttons */}
                <div className="hidden lg:flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    variant="gold"
                    size="xl"
                    disabled={product.is_sold_out}
                    className="flex-1 h-14 shadow-xl shadow-gold/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    onClick={() => addToCart({ ...product, price: selectedPrice, size: selectedSize, images: [selectedImage, ...product.images.filter(i => i !== selectedImage)] })}
                  >
                    <ShoppingCart className="mr-3 h-5 w-5" />
                    {product.is_sold_out ? "SOLD OUT" : "ADD TO CART"}
                  </Button>
                  <Button
                    variant="luxuryOutline"
                    size="xl"
                    disabled={product.is_sold_out}
                    className="flex-1 h-14 border-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleBuyNow}
                  >
                    {product.is_sold_out ? "UNAVAILABLE" : "BUY NOW"}
                  </Button>
                </div>

                {/* Mobile Action Buttons (Visible only if not stuck) */}
                <div className="lg:hidden flex flex-col gap-4 pt-6">
                  <Button
                    variant="gold"
                    size="xl"
                    className="w-full h-14 shadow-xl shadow-gold/20"
                    onClick={() => addToCart({ ...product, price: selectedPrice, size: selectedSize, images: [selectedImage, ...product.images.filter(i => i !== selectedImage)] })}
                    disabled={product.is_sold_out}
                  >
                    <ShoppingCart className="mr-3 h-5 w-5" />
                    {product.is_sold_out ? "SOLD OUT" : "ADD TO CART"}
                  </Button>
                  <Button
                    variant="luxuryOutline"
                    size="xl"
                    className="w-full h-14"
                    onClick={handleBuyNow}
                    disabled={product.is_sold_out}
                  >
                    {product.is_sold_out ? "UNAVAILABLE" : "BUY NOW"}
                  </Button>
                </div>

                {/* Perks/Trust markers */}
                <div className="flex flex-wrap justify-between gap-y-6 pt-10 border-t border-border/50">
                  <div className="flex flex-col items-center gap-2 text-center w-20 sm:w-24">
                    <div className="bg-gold/5 p-3 rounded-full">
                      <ShieldCheck className="h-5 w-5 text-gold" />
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">Secure Transaction</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center w-20 sm:w-24">
                    <div className="bg-gold/5 p-3 rounded-full">
                      <Banknote className="h-5 w-5 text-gold" />
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">Pay on Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center w-20 sm:w-24">
                    <div className="bg-gold/5 p-3 rounded-full">
                      <MapPin className="h-5 w-5 text-gold" />
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">Easy Tracking</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center w-20 sm:w-24">
                    <div className="bg-gold/5 p-3 rounded-full">
                      <Truck className="h-5 w-5 text-gold" />
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">Free Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center w-20 sm:w-24">
                    <div className="bg-gold/5 p-3 rounded-full">
                      <Clock className="h-5 w-5 text-gold" />
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-tight">24 Hours Shipment</span>
                  </div>
                </div>
              </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-border/50 p-4 animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="flex flex-col gap-1">
              <span className="px-1.5 py-0.5 bg-gradient-to-r from-gold via-yellow-500 to-gold text-white text-[8px] font-bold uppercase tracking-wider rounded w-fit shadow-sm shadow-gold/20">
                Offer Price
              </span>
              <span className="text-xl font-heading text-gold leading-none">{formatPrice(product.price)}</span>
            </div>
            <Button
              variant="gold"
              className="flex-1 h-12 rounded-full shadow-lg shadow-gold/20 font-bold uppercase tracking-[0.2em] text-[10px] bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-gold text-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => addToCart({ ...product, price: selectedPrice, size: selectedSize, images: [selectedImage, ...product.images.filter(i => i !== selectedImage)] })}
              disabled={product.is_sold_out}
            >
              {product.is_sold_out ? "SOLD OUT" : "Add to Cart"}
            </Button>
          </div>
        </div>
        {/* Full Width Accordion Section */}
        {product.extraSections && product.extraSections.length > 0 && (
          <div className="container mx-auto px-6 mt-32 mb-24">
            <RevealOnScroll>
            <div className="w-full border-t border-gold/20">
              <Accordion type="single" collapsible className="w-full" defaultValue={undefined}>



                {product.extraSections.map((section, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`} className="border-b border-gold/20 py-4">
                    <AccordionTrigger className="text-xl md:text-2xl font-medium uppercase tracking-[0.15em] hover:text-gold hover:no-underline py-6 [&[data-state=open]]:text-gold transition-colors">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap px-4 pb-8">
                      {section.content}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            </RevealOnScroll>
          </div>
        )}

        {/* Product Gallery Section (Masonry) - Fallback to main images if gallery is empty */}
        {((product.gallery && product.gallery.length > 0) || (product.images && product.images.length > 0)) && (
          <div className="container mx-auto px-6 mt-32 mb-24">
            <RevealOnScroll variant="fade-up">
            <h2 className="text-3xl font-heading mb-8 text-center text-gold uppercase tracking-widest">Visual Story</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[300px]">
              {(product.gallery && product.gallery.length > 0 ? product.gallery : product.images).map((img, index) => (
                <div
                  key={index}
                  className={`relative rounded-2xl overflow-hidden group cursor-pointer ${index % 5 === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1"
                    } ${
                    // Add some more variety if we have many images
                    index % 5 === 3 ? "md:col-span-2" : ""
                    }`}
                  onClick={() => { setSelectedImage(img); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <img
                    src={getDirectUrl(img)}
                    alt={`Gallery ${index}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                </div>
              ))}
            </div>
            </RevealOnScroll>
          </div>
        )}

        {/* Related Products & Reviews */}
        <div className="container mx-auto px-6 mb-20 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <RevealOnScroll>
            <RelatedProducts currentProductId={product.id} category={product.category} />
          </RevealOnScroll> 
          <RevealOnScroll variant="fade-up" delay={200}>
            <ReviewSection productId={product.id} />
          </RevealOnScroll>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default ProductDetails;
