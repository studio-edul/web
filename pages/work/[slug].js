import Layout from '../../components/Layout';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getArtworkBySlug, getAllArtworkSlugs } from '../../lib/artwork-detail-processor';

export default function ArtworkDetail({ artwork }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!artwork) {
    return (
      <Layout title="Portfolio - Work Detail">
        <div>작품을 찾을 수 없습니다.</div>
      </Layout>
    );
  }

  // 팝업용: 모든 이미지를 정렬된 순서로 (이미 정렬되어 있음)
  const sortedImages = artwork.images || [];
  
  // 이미지를 열별로 그룹화
  const column1Images = (artwork.images || []).filter(img => img.column === 1);
  const column2Images = (artwork.images || []).filter(img => img.column === 2);
  // 2열 레이아웃을 위해 모든 이미지 합치기
  const allImages = [...column1Images, ...column2Images];

  // 이미지 클릭 핸들러
  const handleImageClick = (imageIndex) => {
    setCurrentImageIndex(imageIndex);
    setIsPopupOpen(true);
  };

  // 팝업 닫기
  const closePopup = () => {
    setIsPopupOpen(false);
  };

  // 이전 이미지
  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => {
      if (prev === 0) {
        return sortedImages.length - 1;
      }
      return prev - 1;
    });
  };

  // 다음 이미지
  const goToNextImage = () => {
    setCurrentImageIndex((prev) => {
      if (prev === sortedImages.length - 1) {
        return 0;
      }
      return prev + 1;
    });
  };

  // 키보드 이벤트 처리
  useEffect(() => {
    if (!isPopupOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePopup();
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => {
          if (prev === 0) {
            return sortedImages.length - 1;
          }
          return prev - 1;
        });
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => {
          if (prev === sortedImages.length - 1) {
            return 0;
          }
          return prev + 1;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPopupOpen, sortedImages.length]);

  // body 스크롤 잠금
  useEffect(() => {
    if (isPopupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPopupOpen]);

  return (
    <Layout title={`Portfolio - ${artwork.name}`}>
      <div className="artwork-detail-container">
        {/* 1번째 열: 텍스트 정보 */}
        <div className="artwork-detail-text-column">
          <div className="artwork-detail-name">{artwork.name}</div>
          {(artwork.artist || artwork.timeline || artwork.caption) && (
            <div className="artwork-detail-metadata">
              {artwork.artist && (
                <div className="artwork-detail-artist">{artwork.artist}</div>
              )}
              {artwork.timeline && (
                <div className="artwork-detail-timeline">{artwork.timeline}</div>
              )}
              {artwork.caption && (
                <div className="artwork-detail-caption">{artwork.caption}</div>
              )}
            </div>
          )}
          {artwork.pageText && (
            <div className="artwork-detail-page-text">
              {Array.isArray(artwork.pageText) ? (
                artwork.pageText.map((paragraph, idx) => {
                  if (paragraph === null) {
                    // 문단 구분 (작은 간격)
                    return <div key={idx} className="artwork-detail-paragraph-break"></div>;
                  }
                  return <p key={idx} className="artwork-detail-paragraph">{paragraph}</p>;
                })
              ) : (
                <div>{artwork.pageText}</div>
              )}
            </div>
          )}
        </div>
        
        {/* 2번째 열: column이 1인 이미지들 */}
        <div className="artwork-detail-column artwork-detail-column-1">
          {column1Images.map((image, idx) => {
            const imageIndex = sortedImages.findIndex(img => img.path === image.path);
            return (
              <div 
                key={idx} 
                className="artwork-detail-image-wrapper"
                onClick={() => handleImageClick(imageIndex)}
                style={{ gridRow: image.row }}
              >
                <Image
                  src={image.path}
                  alt={`${artwork.name} - Image ${image.row}`}
                  width={500}
                  height={500}
                  className="artwork-detail-image"
                  loading={idx === 0 ? undefined : "lazy"}
                  priority={idx === 0}
                  quality={90}
                  style={{
                    width: '100%',
                    height: 'auto',
                    cursor: 'pointer',
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* 3번째 열: column이 2인 이미지들 */}
        <div className="artwork-detail-column artwork-detail-column-2">
          {column2Images.map((image, idx) => {
            const imageIndex = sortedImages.findIndex(img => img.path === image.path);
            return (
              <div 
                key={idx} 
                className="artwork-detail-image-wrapper"
                onClick={() => handleImageClick(imageIndex)}
                style={{ gridRow: image.row }}
              >
                <Image
                  src={image.path}
                  alt={`${artwork.name} - Image ${image.row}`}
                  width={500}
                  height={500}
                  className="artwork-detail-image"
                  loading={idx === 0 ? undefined : "lazy"}
                  priority={idx === 0}
                  quality={90}
                  style={{
                    width: '100%',
                    height: 'auto',
                    cursor: 'pointer',
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* 반응형: 2열 레이아웃용 이미지 컬럼 (1024px 미만) */}
        <div className="artwork-detail-column artwork-detail-column-responsive">
          {allImages.map((image, idx) => {
            const imageIndex = sortedImages.findIndex(img => img.path === image.path);
            return (
              <div 
                key={idx} 
                className="artwork-detail-image-wrapper"
                onClick={() => handleImageClick(imageIndex)}
              >
                <Image
                  src={image.path}
                  alt={`${artwork.name} - Image ${image.row}`}
                  width={500}
                  height={500}
                  className="artwork-detail-image"
                  loading="lazy"
                  quality={90}
                  style={{
                    width: '100%',
                    height: 'auto',
                    cursor: 'pointer',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 이미지 확대 팝업 */}
      {isPopupOpen && sortedImages.length > 0 && (
        <div className="artwork-image-popup-overlay" onClick={closePopup}>
          <div className="artwork-image-popup-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="artwork-image-popup-close"
              onClick={closePopup}
              aria-label="닫기"
            >
              ×
            </button>
            <button 
              className="artwork-image-popup-nav artwork-image-popup-prev"
              onClick={goToPreviousImage}
              aria-label="이전 이미지"
            >
              <Image
                src="/assets/icons/arrow_back.svg"
                alt="이전"
                width={24}
                height={24}
              />
            </button>
            <button 
              className="artwork-image-popup-nav artwork-image-popup-next"
              onClick={goToNextImage}
              aria-label="다음 이미지"
            >
              <Image
                src="/assets/icons/arrow_forward.svg"
                alt="다음"
                width={24}
                height={24}
              />
            </button>
            <div className="artwork-image-popup-image-wrapper">
              <Image
                src={sortedImages[currentImageIndex].path}
                alt={`${artwork.name} - Image ${currentImageIndex + 1}`}
                width={1920}
                height={1080}
                className="artwork-image-popup-image"
                quality={95}
                priority
              />
            </div>
            <div className="artwork-image-popup-counter">
              {currentImageIndex + 1} / {sortedImages.length}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export async function getStaticPaths() {
  try {
    const slugs = await getAllArtworkSlugs();
    
    return {
      paths: slugs.map(slug => ({
        params: { slug }
      })),
      fallback: 'blocking' // 새로운 slug는 빌드 시 생성, 없으면 404
    };
  } catch (error) {
    console.error('getStaticPaths 오류:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

export async function getStaticProps({ params }) {
  try {
    const artwork = await getArtworkBySlug(params.slug);
    
    if (!artwork) {
      return {
        notFound: true
      };
    }
    
    return {
      props: {
        artwork
      },
      revalidate: 60 // ISR: 60초마다 재생성
    };
  } catch (error) {
    console.error('getStaticProps 오류:', error);
    return {
      notFound: true
    };
  }
}

