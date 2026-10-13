const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v", ".avi"];

function isVideo(path: string) {
  const lower = path.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.includes(ext));
}

export function MediaThumb({ path, url, className }: { path: string; url: string; className?: string }) {
  if (isVideo(path)) {
    return <video src={url} controls className={className} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className={className} />;
}
