import "server-only";

import ogs from "open-graph-scraper";

export const getUrlMetadataTitle = async (url: string) => {
  try {
    const { result } = await ogs({
      url,
      onlyGetOpenGraphInfo: false,
      timeout: 10_000,
    });
    const metadata = result as typeof result & { title?: string };

    const title =
      metadata.ogTitle?.trim() ||
      metadata.twitterTitle?.trim() ||
      metadata.dcTitle?.trim() ||
      metadata.title?.trim() ||
      "";

    return {
      ok: Boolean(title),
      title,
    };
  } catch {
    return {
      ok: false,
      title: "",
    };
  }
};
