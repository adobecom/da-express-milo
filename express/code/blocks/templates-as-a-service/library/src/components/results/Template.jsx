import { useCallback, useState } from 'react';
import {
  getTemplateTitle,
  extractRenditionLinkHref,
  extractComponentLinkHref,
  containsVideo,
  getImageThumbnailSrc,
  getVideoUrls,
} from '../../../../../../scripts/template-utils.js';
import useData from '../../utils/useData.js';

function ImageTemplate({ template }) {
  const componentLinkHref = extractComponentLinkHref(template);
  const renditionLinkHref = extractRenditionLinkHref(template);
  return (
    <img
      src={getImageThumbnailSrc(
        renditionLinkHref,
        componentLinkHref,
        template.pages[0]
      )}
      alt={getTemplateTitle(template)}
    ></img>
  );
}

function VideoTemplate({ template }) {
  const componentLinkHref = extractComponentLinkHref(template);
  const renditionLinkHref = extractRenditionLinkHref(template);
  const { loading, data, error } = useData(
    useCallback(
      () =>
        getVideoUrls(renditionLinkHref, componentLinkHref, template.pages[0]),
      [componentLinkHref, renditionLinkHref, template.pages]
    )
  );
  if (error) {
    return <div>Error loading video template.</div>;
  }
  if (loading) {
    return <ImageTemplate template={template} />;
  }
  return (
    <video poster={data.poster} muted={true} autoPlay loop>
      <source src={data.src}></source>
    </video>
  );
}

export default function Template({ template }) {
  const isVideo = containsVideo(template);
  const isPremium = template.licensingCategory === 'premium';
  const [showId, setShowId] = useState(false);

  return (
    <div
      className="flex flex-col template"
      onClick={() => setShowId((s) => !s)}
    >
      {isPremium && (
        <img
          className="icon icon-premium"
          src="https://www.adobe.com/express/code/icons/premium.svg"
          alt="premium"
        />
      )}
      {isVideo ? (
        <VideoTemplate template={template} />
      ) : (
        <ImageTemplate template={template} />
      )}
      {showId && <div className="template-id">{template.id}</div>}
    </div>
  );
}
