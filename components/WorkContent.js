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
        {projects.map((project, idx) => {
          // 첫 번째 프로젝트의 첫 번째 이미지에 priority 적용
          const isFirstProject = idx === 0;
          return (
            <ProjectItem
              key={project.name || idx}
              project={project}
              artworkImages={artworkMap[project.name] || []}
              isFirstProject={isFirstProject}
            />
          );
        })}
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

    // Sort by index for mobile view (and consistency)
    const sortByIndex = (a, b) => {
      const getOrder = (item) => {
        if (item.index === null || item.index === undefined) return Infinity;
        const s = String(item.index).trim();
        // Handle "1,2" format -> treat as 1000*col + row
        if (s.includes(',')) {
          const parts = s.split(',');
          const col = parseFloat(parts[0]);
          const row = parseFloat(parts[1]);
          return col * 1000 + row;
        }
        return isNaN(s) ? Infinity : Number(s);
      };

      return getOrder(a) - getOrder(b);
    };

    soloExhibitions.sort(sortByIndex);
    groupExhibitions.sort(sortByIndex);

    // Index에 따라 좌우 번갈아가면서 배치 (Desktop Logic)
    const soloColumnArrays = {
      1: [],
      2: []
    };
    const groupColumnArrays = {
      1: [],
      2: []
    };

    // Helper to determine column
    const addToColumnArrays = (collection, arrays, isFirstCollection = false) => {
      collection.forEach((exhibition, idx) => {
        const indexStr = String(exhibition.index).trim();
        const isFull = indexStr.toLowerCase() === 'full';

        const exhibitionItem = (
          <ExhibitionItem
            key={`${exhibition.name || idx}`}
            exhibition={exhibition}
            isFull={isFull}
            priority={isFirstCollection && idx === 0}
          />
        );

        let targetCol = 1;

        if (indexStr.includes(',')) {
          // "2,1" style
          const parts = indexStr.split(',');
          const col = parseInt(parts[0], 10);
          if (col === 1 || col === 2) {
            targetCol = col;
          }
        } else if (!isNaN(indexStr) && indexStr !== '' && !isFull) {
          // "1", "2", "3" style -> Odd=1, Even=2
          const val = parseInt(indexStr, 10);
          targetCol = val % 2 === 1 ? 1 : 2;
        }

        // If 'full', it defaults to column 1 in desktop view (as strictly requested for desktop logic not specified for full)
        // But user said "1024 미만일 때 index를 full로..." implying full only special on mobile?
        // If full on desktop should be full width, we need separate logic, but assuming col 1 for now or 
        // if user wants it spanning 2 cols, that's a bigger change. 
        // Given current constraints, placing in col 1 is safe.

        arrays[targetCol].push(exhibitionItem);
      });
    };

    addToColumnArrays(soloExhibitions, soloColumnArrays, true);
    addToColumnArrays(groupExhibitions, groupColumnArrays, false);

    return (
      <div id="content-area">
        {/* SOLO EXHIBITION 그룹 */}
        <div className="exhibition-solo-group">
          {/* Desktop View (2 Columns) */}
          <div className="desktop-view columns-container">
            <div className="column">
              {soloColumnArrays[1]}
            </div>
            <div className="column">
              {soloColumnArrays[2]}
            </div>
          </div>
          {/* Mobile View (1 Column Sorted) */}
          <div className="mobile-view project-list-single">
            {soloExhibitions.map((exhibition, idx) => (
              <ExhibitionItem
                key={`solo-mobile-${exhibition.name || idx}`}
                exhibition={exhibition}
                isFull={String(exhibition.index || '').trim().toLowerCase() === 'full'}
                priority={idx === 0}
              />
            ))}
          </div>
        </div>

        {/* GROUP EXHIBITION 그룹 */}
        <div className="exhibition-group-group">
          {/* Desktop View (2 Columns) */}
          <div className="desktop-view columns-container">
            <div className="column">
              {groupColumnArrays[1]}
            </div>
            <div className="column">
              {groupColumnArrays[2]}
            </div>
          </div>
          {/* Mobile View (1 Column Sorted) */}
          <div className="mobile-view project-list-single">
            {groupExhibitions.map((exhibition, idx) => (
              <ExhibitionItem
                key={`group-mobile-${exhibition.name || idx}`}
                exhibition={exhibition}
                isFull={String(exhibition.index || '').trim().toLowerCase() === 'full'}
                priority={false}
              />
            ))}
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
              isFirstTimeline={idx === 0}
            />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
