import { useState } from 'react';
import Layout from '../components/Layout';
import WorkContent from '../components/WorkContent';

export default function Work({ projects, artworkMap, exhibitions, timelines, timelineImageMap }) {
  const [currentView, setCurrentView] = useState('project');

  const viewOptions = [
    { id: 'project', label: 'PROJECT' },
    { id: 'exhibition', label: 'EXHIBITION' },
    { id: 'timeline', label: 'TIMELINE' },
  ];

  return (
    <Layout title="Portfolio - Work">
      <aside className="side-menu">
        {viewOptions.map((option) => (
          <button
            key={option.id}
            className={`side-menu-item ${currentView === option.id ? 'active' : ''}`}
            onClick={() => setCurrentView(option.id)}
          >
            {option.label}
          </button>
        ))}
      </aside>

      <WorkContent view={currentView} projects={projects} artworkMap={artworkMap} exhibitions={exhibitions} timelines={timelines} timelineImageMap={timelineImageMap} />
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    const { getWORKDataServer, getARTWORKDataServer } = await import('../lib/notion-api-server');
    const { processWorkData } = await import('../lib/work-processor');
    const { processExhibitionData } = await import('../lib/exhibition-processor');
    const { processTimelineData } = await import('../lib/timeline-processor');
    const { preloadAllArtworkImages, preloadAllTimelineImages } = await import('../lib/artwork-processor');
    
    const [workData, artworkData] = await Promise.all([
      getWORKDataServer(),
      getARTWORKDataServer()
    ]);
    
    const projects = processWorkData(workData);
    const exhibitions = await processExhibitionData(workData);
    const timelines = processTimelineData(workData);
    const artworkMap = await preloadAllArtworkImages(workData, artworkData);
    const timelineImageMap = await preloadAllTimelineImages(timelines, artworkData);
    
    return {
      props: {
        projects,
        artworkMap,
        exhibitions,
        timelines,
        timelineImageMap
      },
      revalidate: 60 // ISR: 60초마다 재생성
    };
  } catch (error) {
    console.error('Work 데이터 로드 오류:', error);
    return {
      props: {
        projects: [],
        artworkMap: {},
        exhibitions: [],
        timelines: [],
        timelineImageMap: {}
      }
    };
  }
}
