import CVDataItem from './CVDataItem';

export default function CVClassGroup({ className, items }) {
  return (
    <div className="cv-class-group">
      <div className="cv-class-item">{className}</div>
      <div className="cv-class-data">
        {items.map((item, idx) => (
          <CVDataItem key={idx} item={item} />
        ))}
      </div>
    </div>
  );
}

