import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Product, formatPrice } from "@/lib/products";
import { productService } from "@/lib/services/productService";
import { useCart } from "@/context/CartContext";
import { Plus } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { getDirectUrl } from "@/lib/utils/imageUtils";

interface ProductCardProps {
  product: Product;
  index: number;
  overrideImages?: string[]; // Optional prop to override display images
}

const ProductCard = ({ product, index, overrideImages }: ProductCardProps) => {
  const { addToCart } = useCart();
  const cardRef = useRef<HTMLElement>(null);

  // Use the custom hook for scroll reveal
  useScrollReveal('animate-reveal');

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const [bundleImages, setBundleImages] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchBundleImages = async () => {
      // Only fetch if it's a gift set, has no main images (or just 1 placeholder/empty), and has bundle items to show
      if (product.isGiftSet && (!product.images || product.images.length === 0 || (product.images.length === 1 && !product.images[0]))) {
        if (product.bundleItems && product.bundleItems.length > 0) {
          try {
            const bundlePromises = product.bundleItems.map(bId => productService.getProductById(bId));
            const bundleResults = await Promise.all(bundlePromises);
            const validImages = bundleResults
              .filter(p => p !== null)
              .map(p => p!.images[0])
              .filter(Boolean);
            
            if (validImages.length > 0) {
              setBundleImages(validImages);
            }
          } catch (err) {
            console.error("Failed to fetch bundle images", err);
          }
        }
      }
    };
    
    fetchBundleImages();
  }, [product]);

  // Determine what to show: Override > Bundle Grid > Main Image
  const showBundleGrid = bundleImages.length > 0 && (!product.images || product.images.length === 0);
  const imagesToShow = showBundleGrid ? bundleImages : (overrideImages && overrideImages.length > 0 ? overrideImages : null);

  return (
    <article
      ref={cardRef}
      className="group relative opacity-0 reveal bg-white rounded-[1rem] overflow-hidden flex flex-col h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 ease-out border border-transparent hover:border-puniora-orange-100/50"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <Link to={`/products/${productService.createSlug(product.name)}`} className="block h-full relative flex flex-col">
        {/* Shine Element */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20" />

        {/* Image Container - Taller Aspect Ratio for Sarees */}
        <div className="relative aspect-[3/4] bg-puniora-void overflow-hidden">

          {imagesToShow && imagesToShow.length > 0 ? (
            <div className={`w-full h-full grid ${imagesToShow.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
              {imagesToShow.slice(0, 4).map((img, idx) => (
                <img
                  key={idx}
                  src={getDirectUrl(img, 800)}
                  alt=""
                  className={`w-full h-full object-cover opacity-100 transition-opacity duration-500
                    ${imagesToShow.length === 2 && idx === 0 ? 'border-r border-white/20' : ''}
                    ${imagesToShow.length > 2 && idx === 0 ? 'border-r border-b border-white/20' : ''}
                    ${imagesToShow.length > 2 && idx === 1 ? 'border-b border-white/20' : ''}
                    ${imagesToShow.length > 2 && idx === 2 ? 'border-r border-white/20' : ''}
                    ${imagesToShow.length === 3 && idx === 2 ? 'col-span-2 border-r-0' : ''} 
                  `}
                />
              ))}
            </div>
          ) : (
            <img
              src={product.images && product.images.length > 0 ? getDirectUrl(product.images[0], 800) : "/fallback-product.jpg"}
              alt={`${product.name} - ${product.category}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
            />
          )}

          {/* Vignette - Minimal */}
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500" />

          {/* Quick Add Button (Floating - Slide up) */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20">
            <Button
              className="w-full bg-white/95 backdrop-blur-md text-puniora-black hover:bg-puniora-orange hover:text-white font-body tracking-[0.2em] text-[10px] uppercase h-11 rounded-full shadow-lg border border-white/50"
              onClick={handleAddToCart}
              disabled={product.is_sold_out}
            >
              {product.is_sold_out ? "Sold Out" : "Add to Cart"}
            </Button>
          </div>

          {/* Out of Stock Overlay Badge */}
          {product.is_sold_out && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
              <span className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-xl transform -rotate-12">
                Sold Out
              </span>
            </div>
          )}

          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
             <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-sm border border-gray-100 shadow-sm">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold">
                  {product.category}
                </span>
             </div>
             {product.is_featured && (
                <div className="bg-puniora-orange/90 backdrop-blur-sm px-3 py-1 rounded-sm shadow-sm">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-white font-bold">
                      Featured
                    </span>
                 </div>
             )}
          </div>
        </div>

        {/* Minimalist Info (Below Image) */}
        <div className="pt-5 pb-6 px-4 text-center bg-white flex-1 flex flex-col justify-between relative z-10 transition-colors duration-500 group-hover:bg-puniora-void/30">
          <div className="space-y-2">
            <h3 className="font-heading text-lg text-puniora-black group-hover:text-puniora-orange transition-colors duration-300 line-clamp-2 px-1 leading-tight">
                {product.name}
            </h3>
            <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">
                {product.notes.slice(0, 3).join(" • ")}
            </p>
          </div>
          
          <div className="pt-3 mt-auto">
             <span className="font-body text-sm font-medium tracking-wide text-gray-900">
               {formatPrice(product.price)}
             </span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
