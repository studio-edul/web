import { useEffect, useState } from 'react';

export default function ContactIcon({ src, alt }) {
  const [svgContent, setSvgContent] = useState(null);

  useEffect(() => {
    // SVG 파일을 fetch하여 인라인으로 삽입
    fetch(src)
      .then(res => res.text())
      .then(svg => {
        setSvgContent(svg);
      })
      .catch(err => {
        console.error('SVG 로드 오류:', err);
      });
  }, [src]);

  if (!svgContent) {
    return <div className="contact-icon-placeholder" />;
  }

  return (
    <div
      className="contact-icon-svg"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

