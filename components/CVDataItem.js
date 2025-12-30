export default function CVDataItem({ item }) {
  const { period, name, client, place } = item;
  
  return (
    <div className="cv-data-item">
      <div className="cv-data-period">{period || ''}</div>
      <div className="cv-data-name-client">
        <span className="cv-data-name">{name || ''}</span>
        {client && (
          <>
            <span className="cv-data-separator"> | </span>
            <span className="cv-data-client">{client}</span>
          </>
        )}
      </div>
      <div className="cv-data-place">{place || ''}</div>
    </div>
  );
}

