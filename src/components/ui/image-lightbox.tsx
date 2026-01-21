import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: { url: string; alt?: string }[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImageLightbox = ({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: initialIndex,
    loop: true 
  });

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Reset to initial index when opening
  useEffect(() => {
    if (open && emblaApi) {
      emblaApi.scrollTo(initialIndex, true);
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex, emblaApi]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") scrollPrev();
      if (e.key === "ArrowRight") scrollNext();
      if (e.key === "Escape") onOpenChange(false);
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, scrollPrev, scrollNext, onOpenChange]);

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-black/95 border-none">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Image counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Carousel */}
        <div 
          ref={emblaRef} 
          className="overflow-hidden w-full h-full flex items-center"
        >
          <div className="flex h-full">
            {images.map((image, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] min-w-0 flex items-center justify-center p-4"
              >
                <img
                  src={image.url}
                  alt={image.alt || `Image ${index + 1}`}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full w-12 h-12"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full w-12 h-12"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentIndex === index
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
