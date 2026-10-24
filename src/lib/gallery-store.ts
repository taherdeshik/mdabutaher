import { read } from "@/lib/store";
import {
  galleryPhotos,
  galleryPosters,
  galleryVideos,
  type GalleryPhoto,
  type GalleryPoster,
} from "@/content/gallery";
import { campaignVideos, type VideoCategory } from "@/content/videos";

/**
 * Public gallery data = the curated archive coded in `src/content` **plus**
 * whatever the admin added from the panel, minus anything hidden there.
 *
 * Nothing is duplicated: an admin photo simply carries an `src` instead of a
 * registry `key`, and `SmartImage` already understands both.
 */

export type GalleryPhotoView = Omit<GalleryPhoto, "key"> & {
  id: string;
  /** Curated photos carry their registry key; uploads only carry `src`. */
  key?: string;
  /** Set for admin uploads; curated photos keep using `key`. */
  src?: string;
  /** true when added from the admin panel (can be deleted, not just hidden). */
  custom?: boolean;
  createdAt?: string;
};

export type GalleryPosterView = Omit<GalleryPoster, "key"> & {
  id: string;
  key?: string;
  src?: string;
  custom?: boolean;
  createdAt?: string;
};

export type GalleryVideoView = {
  id: string;
  title: string;
  category: VideoCategory | string;
  note?: string;
  featured?: boolean;
  custom?: boolean;
};

export type GalleryBundle = {
  photos: GalleryPhotoView[];
  posters: GalleryPosterView[];
  videos: GalleryVideoView[];
};

export const emptyGallery: GalleryBundle = { photos: [], posters: [], videos: [] };

function curatedPhotos(hidden: Set<string>): GalleryPhotoView[] {
  return galleryPhotos
    .filter((p) => !hidden.has(p.key))
    .map((p) => ({ ...p, id: p.key, custom: false }));
}

function curatedPosters(hidden: Set<string>): GalleryPosterView[] {
  return galleryPosters
    .filter((p) => !hidden.has(p.key))
    .map((p) => ({ ...p, id: p.key, custom: false }));
}

function curatedVideos(hidden: Set<string>): GalleryVideoView[] {
  return campaignVideos
    .filter((v) => !hidden.has(v.id))
    .map((v) => ({ ...v, custom: false }));
}

/** Reads the store; a failure (static mirror, first run) yields the curated set. */
export async function getGallery(): Promise<GalleryBundle> {
  let store: { photos: any[]; posters: any[]; videos: any[]; hidden: string[] } | undefined;
  try {
    store = (await read()).gallery;
  } catch {
    store = undefined;
  }

  if (!store) {
    return {
      photos: curatedPhotos(new Set()),
      posters: curatedPosters(new Set()),
      videos: curatedVideos(new Set()),
    };
  }

  const hidden = new Set(store.hidden || []);

  const photos: GalleryPhotoView[] = [
    // Admin uploads first: the newest work should lead the gallery.
    ...(store.photos || []).map((p) => ({
      id: p.id,
      src: p.src,
      caption: p.caption,
      tag: p.tag || "নতুন",
      tall: Boolean(p.tall),
      custom: true,
      createdAt: p.createdAt,
    })),
    ...curatedPhotos(hidden),
  ];

  const posters: GalleryPosterView[] = [
    ...(store.posters || []).map((p) => ({
      id: p.id,
      src: p.src,
      title: p.title,
      subtitle: p.subtitle,
      election: Boolean(p.election),
      custom: true,
      createdAt: p.createdAt,
    })),
    ...curatedPosters(hidden),
  ];

  const videos: GalleryVideoView[] = [
    ...(store.videos || []).map((v) => ({
      id: v.youtubeId,
      title: v.title,
      category: v.category || "প্রচারণা",
      note: v.note,
      custom: true,
    })),
    ...curatedVideos(hidden),
  ];

  return { photos, posters, videos };
}

/** Filter chips for the photo grid, in the order the tags first appear. */
export function photoTags(photos: GalleryPhotoView[]) {
  return Array.from(new Set(photos.map((p) => p.tag).filter(Boolean)));
}

/** Photos used by the legacy gallery-tabs "ভিডিও" tab (short list). */
export function shortVideoList(videos: GalleryVideoView[], limit = 5) {
  return videos.slice(0, limit).map((v) => ({ id: v.id, title: v.title }));
}

export { galleryVideos };
