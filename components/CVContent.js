import { useMemo } from 'react';
import CVClassGroup from './CVClassGroup';
import { groupCVDataByClass } from '@/lib/cv-processor';

export default function CVContent({ cvData }) {
    const { sortedClasses, classGroups } = useMemo(() => {
        if (!cvData) return { sortedClasses: [], classGroups: {} };

        // 이미 처리된 데이터인지 확인 (sortedClasses가 있는지)
        if (cvData.sortedClasses && cvData.classGroups) {
            return cvData;
        }

        // 배열이면 처리
        if (Array.isArray(cvData)) {
            return groupCVDataByClass(cvData);
        }

        return { sortedClasses: [], classGroups: {} };
    }, [cvData]);

    if (!cvData) return null;

    return (
        <div className="cv-content">
            {sortedClasses.map((className, idx) => (
                <CVClassGroup
                    key={idx}
                    className={className}
                    items={classGroups[className]}
                />
            ))}
        </div>
    );
}
