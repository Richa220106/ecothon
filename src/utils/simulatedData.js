export const generateSimulatedRoads = (numSegments = 10, startCoords = [19.076, 72.8777]) => {
  const roads = [];
  const roadTypes = ['Residential', 'Main Road', 'Highway', 'Sensitive Zone'];

  let currentLat = startCoords[0];
  let currentLng = startCoords[1];

  for (let i = 0; i < numSegments; i++) {
    const type = roadTypes[Math.floor(Math.random() * roadTypes.length)];
    const density = Math.floor(Math.random() * 10) + 1;
    const congestion = (Math.random() * 2 + 1).toFixed(1);
    const weight = type === 'Sensitive Zone' ? 1.5 : (type === 'Highway' ? 1.2 : 1.0);

    // Create a path segment
    const nextLat = currentLat + (Math.random() - 0.5) * 0.05;
    const nextLng = currentLng + (Math.random() - 0.5) * 0.05;

    roads.push({
      id: `road-${i}`,
      name: `${type} Segment ${i + 1}`,
      type,
      density,
      congestion,
      weight,
      length: (Math.random() * 2 + 0.5).toFixed(2),
      coordinates: [
        [currentLat, currentLng],
        [nextLat, nextLng]
      ]
    });

    currentLat = nextLat;
    currentLng = nextLng;
  }
  return roads;
};

export const MOCK_HISTORY = [
  { day: 'Mon', pollution: 45 },
  { day: 'Tue', pollution: 52 },
  { day: 'Wed', pollution: 48 },
  { day: 'Thu', pollution: 70 },
  { day: 'Fri', pollution: 65 },
  { day: 'Sat', pollution: 30 },
  { day: 'Sun', pollution: 25 },
];
