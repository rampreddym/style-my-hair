import { Share2, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LookTicketProps {
  afterImage: string;
  beforeImage?: string;
  prompt?: string;
  referencePhotos?: string[];
}

/** Shareable "Look Ticket": the chosen AI look + reference angles to show a stylist. */
export const LookTicket = ({ afterImage, beforeImage, prompt, referencePhotos = [] }: LookTicketProps) => {
  const { toast } = useToast();

  const share = async () => {
    const text = `My Mirra look${prompt ? `: ${prompt}` : ""}\n${afterImage}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Mirra Look Ticket", text, url: afterImage });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Look Ticket link copied" });
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="editorial-card rim-light overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="eyebrow">Look Ticket</p>
        <span className="inline-flex items-center gap-1 rounded-pill bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-vapor">
          AI preview
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
        <img src={afterImage} alt="Chosen look" className="img-ring aspect-[4/5] w-full rounded-control object-cover" />
        <div className="flex flex-col gap-2 w-16">
          {[beforeImage, ...referencePhotos].filter(Boolean).slice(0, 4).map((src, i) => (
            <img key={i} src={src} alt={`Reference ${i + 1}`} className="img-ring h-16 w-16 rounded-control object-cover" />
          ))}
        </div>
      </div>
      {prompt && (
        <p className="px-4 text-sm text-muted-foreground line-clamp-3 flex gap-2">
          <Scissors className="w-4 h-4 shrink-0 mt-0.5 text-vapor" /> {prompt}
        </p>
      )}
      <div className="border-t border-dashed border-hairline-strong mt-4 p-4">
        <Button variant="outline" className="w-full min-h-[44px] rounded-pill" onClick={share}>
          <Share2 className="w-4 h-4 mr-2" /> Share with your stylist
        </Button>
      </div>
    </div>
  );
};
