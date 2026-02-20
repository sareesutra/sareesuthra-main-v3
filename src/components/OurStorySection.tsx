import { Link } from "react-router-dom";

const OurStorySection = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Dots Pattern */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-1/3 w-64 h-64 opacity-20 pointer-events-none">
        <div className="grid grid-cols-6 gap-4">
           {Array.from({ length: 36 }).map((_, i) => (
             <div key={i} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-puniora-orange-300" />
           ))}
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
          
          {/* Left: Image Grid/Collage */}
          <div className="w-full md:w-1/2 relative">
             <div className="aspect-[4/5] rounded-tl-[5rem] rounded-br-[5rem] overflow-hidden shadow-2xl relative z-20">
                <img 
                    src="/our-story-saree.jpg"
                    alt="Saree Sutra Artisans" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-top"
                />
             </div>
             {/* Offset Border decoration */}
             <div className="absolute -bottom-6 -right-6 w-full h-full rounded-tl-[5rem] rounded-br-[5rem] border-2 border-puniora-orange-200 z-10 hidden md:block" />
          </div>

          {/* Right: Content */}
          <div className="w-full md:w-1/2 text-center md:text-left space-y-6">
            <h2 className="font-heading text-4xl md:text-5xl text-puniora-black">
              Our Story
            </h2>
            
            <div className="space-y-4 text-gray-600 leading-relaxed font-light text-lg">
                <p>
                    Saree Sutra started with a simple goal: make premium sarees accessible without losing authenticity.
                    We curate every drape for quality, comfort, and occasion-fit styling.
                </p>
                <p>
                    From wedding-ready classics to elegant daily wear, every piece balances heritage weaving and modern taste.
                    We partner with trusted makers and focus on quality checks before delivery.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4">
                <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-puniora-orange mt-2 shrink-0" />
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Premium Fabrics, Styled for You</p>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-puniora-orange mt-2 shrink-0" />
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Authentic Craftsmanship</p>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-puniora-orange mt-2 shrink-0" />
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Honoring Heritage</p>
                </div>
                 <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-puniora-orange mt-2 shrink-0" />
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Expanded with Trust & Love</p>
                </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default OurStorySection;
