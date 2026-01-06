import Layout from '../../../components/Layout';
import { getExhibitionBySlug, getAllExhibitionSlugs, getRelatedTextPage } from '../../../lib/exhibition-detail-processor';
import { createSlug } from '../../../lib/slug-utils';

export default function ExhibitionRelatedText({ exhibition, relatedText, relatedTextSlug }) {
  if (!exhibition || !relatedText) {
    return (
      <Layout title="Portfolio - Related Text">
        <div>관련 텍스트를 찾을 수 없습니다.</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Portfolio - ${relatedText.title || 'Related Text'}`}>
      <div className="related-text-page-container">
        <div className="related-text-page-title">{relatedText.title || 'Related Text'}</div>
        
        {relatedText.content && (
          <div className="related-text-page-content">
            {Array.isArray(relatedText.content) ? (
              relatedText.content.map((paragraph, idx) => {
                if (paragraph === null) {
                  return <div key={idx} className="artwork-detail-paragraph-break"></div>;
                }
                
                if (Array.isArray(paragraph)) {
                  return (
                    <p key={idx} className="artwork-detail-paragraph">
                      {paragraph.map((textItem, textIdx) => {
                        const text = textItem.plain_text || '';
                        const annotations = textItem.annotations || {};
                        
                        if (annotations.bold) {
                          return <strong key={textIdx}>{text}</strong>;
                        }
                        return <span key={textIdx}>{text}</span>;
                      })}
                    </p>
                  );
                }
                
                return <p key={idx} className="artwork-detail-paragraph">{paragraph}</p>;
              })
            ) : (
              <div>{relatedText.content}</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export async function getStaticPaths() {
  try {
    const exhibitionSlugs = await getAllExhibitionSlugs();
    const paths = [];

    // 각 전시의 Related Text들을 가져와서 경로 생성
    for (const slug of exhibitionSlugs) {
      const exhibition = await getExhibitionBySlug(slug);
      if (exhibition && exhibition.relatedTexts && exhibition.relatedTexts.length > 0) {
        for (const relatedText of exhibition.relatedTexts) {
          const relatedSlug = createSlug(relatedText.title);
          paths.push({
            params: {
              slug: slug,
              relatedSlug: relatedSlug
            }
          });
        }
      }
    }

    return {
      paths,
      fallback: 'blocking'
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
    const exhibition = await getExhibitionBySlug(params.slug);
    
    if (!exhibition) {
      return {
        notFound: true
      };
    }

    // Related Text 찾기
    const relatedText = exhibition.relatedTexts?.find(rt => {
      const rtSlug = createSlug(rt.title);
      return rtSlug === params.relatedSlug;
    });

    if (!relatedText) {
      return {
        notFound: true
      };
    }

    // Related Text 페이지 내용 가져오기
    const relatedTextContent = await getRelatedTextPage(relatedText.pageId);

    return {
      props: {
        exhibition,
        relatedText: {
          ...relatedText,
          content: relatedTextContent?.content || []
        },
        relatedTextSlug: params.relatedSlug
      },
      revalidate: 60
    };
  } catch (error) {
    console.error('getStaticProps 오류:', error);
    return {
      notFound: true
    };
  }
}

