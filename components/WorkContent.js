import ProjectItem from './ProjectItem';
import ExhibitionItem from './ExhibitionItem';
import TimelineItem from './TimelineItem';

export default function WorkContent({ view, projects, artworkMap, exhibitions, timelines, timelineImageMap }) {
  if (view === 'project') {
    if (!projects || projects.length === 0) {
      return (
        <div className="columns-container">
          <div className="column">
            <div className="project-item">프로젝트 데이터가 없습니다.</div>
          </div>
          <div className="column"></div>
        </div>
      );
    }

    return (
      <div id="content-area">
        {projects.map((project, idx) => (
          <ProjectItem
            key={project.name || idx}
            project={project}
            artworkImages={artworkMap[project.name] || []}
          />
        ))}
      </div>
    );
  } else if (view === 'exhibition') {
    if (!exhibitions || exhibitions.length === 0) {
      return (
        <div className="columns-container">
          <div className="column">
            <div className="exhibition-name">전시 데이터가 없습니다.</div>
          </div>
          <div className="column"></div>
        </div>
      );
    }

    // SOLO와 GROUP 분리
    const soloExhibitions = exhibitions.filter(item => item.classType === 'SOLO EXHIBITION');
    const groupExhibitions = exhibitions.filter(item => item.classType === 'GROUP EXHIBITION');

    // Index에 따라 좌우 번갈아가면서 배치
    // Index 1 = 왼쪽, 2 = 오른쪽, 3 = 왼쪽, 4 = 오른쪽...
    const soloColumnArrays = {
      1: [],
      2: []
    };
    const groupColumnArrays = {
      1: [],
      2: []
    };

    // SOLO EXHIBITION 배치
    soloExhibitions.forEach((exhibition, idx) => {
      const exhibitionItem = (
        <ExhibitionItem
          key={`solo-${exhibition.name || idx}`}
          exhibition={exhibition}
        />
      );

      if (exhibition.index !== null && !isNaN(exhibition.index)) {
        // Index가 홀수면 왼쪽(1열), 짝수면 오른쪽(2열)
        const column = exhibition.index % 2 === 1 ? 1 : 2;
        soloColumnArrays[column].push(exhibitionItem);
      } else {
        // Index가 없으면 왼쪽에 순서대로 추가
        soloColumnArrays[1].push(exhibitionItem);
      }
    });

    // GROUP EXHIBITION 배치
    groupExhibitions.forEach((exhibition, idx) => {
      const exhibitionItem = (
        <ExhibitionItem
          key={`group-${exhibition.name || idx}`}
          exhibition={exhibition}
        />
      );

      if (exhibition.index !== null && !isNaN(exhibition.index)) {
        // Index가 홀수면 왼쪽(1열), 짝수면 오른쪽(2열)
        const column = exhibition.index % 2 === 1 ? 1 : 2;
        groupColumnArrays[column].push(exhibitionItem);
      } else {
        // Index가 없으면 왼쪽에 순서대로 추가
        groupColumnArrays[1].push(exhibitionItem);
      }
    });

    return (
      <div id="content-area">
        {/* SOLO EXHIBITION 그룹 */}
        <div className="exhibition-solo-group">
          <div className="columns-container">
            <div className="column">
              {soloColumnArrays[1]}
            </div>
            <div className="column">
              {soloColumnArrays[2]}
            </div>
          </div>
        </div>
        {/* GROUP EXHIBITION 그룹 */}
        <div className="exhibition-group-group">
          <div className="columns-container">
            <div className="column">
              {groupColumnArrays[1]}
            </div>
            <div className="column">
              {groupColumnArrays[2]}
            </div>
          </div>
        </div>
      </div>
    );
  } else if (view === 'timeline') {
    if (!timelines || timelines.length === 0) {
      return null;
    }

    // artwork 이미지가 있는 timeline만 필터링
    const timelinesWithImages = timelines.filter(timeline => {
      const images = timelineImageMap[timeline.name] || [];
      return images.length > 0;
    });

    if (timelinesWithImages.length === 0) {
      return null;
    }

    return (
      <div id="content-area">
        {timelinesWithImages.map((timeline, idx) => (
          <div key={timeline.name || idx} className="timeline-group">
            <TimelineItem
              timeline={timeline}
              artworkImages={timelineImageMap[timeline.name] || []}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
