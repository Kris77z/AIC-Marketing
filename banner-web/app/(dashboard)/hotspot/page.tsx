import { HotspotWorkbench } from "@/components/hotspot/HotspotWorkbench";
import { listAssets } from "@/lib/db";
import { buildImageUrl } from "@/lib/image-routes";

export default function HotspotPage() {
  const assets = listAssets().map((asset) => ({
    ...asset,
    imageUrl: buildImageUrl(asset.filePath)
  }));

  return <HotspotWorkbench assets={assets} />;
}
