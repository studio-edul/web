import Head from 'next/head';
import Layout from '@/components/Layout';
import WorkContent from '@/components/WorkContent';
import CVContent from '@/components/CVContent';
import { getAllNotionDataServer } from '@/lib/notion-api-server';

export default function Home() {
  return (
    <Layout title="Portfolio - Home">
      {/* 인덱스 페이지 내용은 필요에 따라 추가 */}
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    // 데이터 미리 로드 (캐싱용)
    await getAllNotionDataServer();


    return {
      props: {},
      revalidate: 60 // ISR: 60초마다 재생성
    };
  } catch (error) {
    console.error('데이터 미리 로드 오류:', error);
    return {
      props: {}
    };
  }
}
