import bobImg from "@/assets/hairstyles/bob.jpg";
import buzzCutImg from "@/assets/hairstyles/buzz-cut.jpg";
import crewCutImg from "@/assets/hairstyles/crew-cut.jpg";
import disconnectedImg from "@/assets/hairstyles/disconnected.jpg";
import fadeImg from "@/assets/hairstyles/fade.jpg";
import layersImg from "@/assets/hairstyles/layers.jpg";
import lineUpImg from "@/assets/hairstyles/line-up.jpg";
import lobImg from "@/assets/hairstyles/lob.jpg";
import pixieCutImg from "@/assets/hairstyles/pixie-cut.jpg";
import pompadourImg from "@/assets/hairstyles/pompadour.jpg";
import shagImg from "@/assets/hairstyles/shag.jpg";
import slickedBackImg from "@/assets/hairstyles/slicked-back.jpg";
import taperImg from "@/assets/hairstyles/taper.jpg";
import texturedCropImg from "@/assets/hairstyles/textured-crop.jpg";
import undercutImg from "@/assets/hairstyles/undercut.jpg";

const normalizeStyleName = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const hairstyleImageMap: Record<string, string> = {
  "bob": bobImg,
  "buzz-cut": buzzCutImg,
  "crew-cut": crewCutImg,
  "curtains": layersImg,
  "disconnected": disconnectedImg,
  "fade": fadeImg,
  "layers": layersImg,
  "line-up": lineUpImg,
  "lob": lobImg,
  "pixie-cut": pixieCutImg,
  "pompadour": pompadourImg,
  "shag": shagImg,
  "slicked-back": slickedBackImg,
  "taper": taperImg,
  "textured-crop": texturedCropImg,
  "undercut": undercutImg,
};

export const getHairstyleImage = (styleName: string) =>
  hairstyleImageMap[normalizeStyleName(styleName)] ?? disconnectedImg;

export const fallbackHairstyleImage = disconnectedImg;