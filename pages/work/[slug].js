import Layout from '../../components/Layout';
import { getArtworkBySlug, getAllArtworkSlugs } from '../../lib/artwork-detail-processor';

export default function ArtworkDetail({ artwork }) {
  if (!artwork) {
    return (
      <Layout title="Portfolio - Work Detail">
        <div>작품을 찾을 수 없습니다.</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Portfolio - ${artwork.name}`}>
      <div className="artwork-detail-name">{artwork.name}</div>
      {/* 추후 더 많은 내용 추가 예정 */}
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

