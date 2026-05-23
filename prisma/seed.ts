import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // --- POSITION WEIGHTS ---
  const weights = [
    { position: 'LW', metricKey: 'dribbles_completed', weight: 0.30 },
    { position: 'LW', metricKey: 'pace_score', weight: 0.25 },
    { position: 'LW', metricKey: 'goals_per90', weight: 0.25 },
    { position: 'LW', metricKey: 'passing_accuracy', weight: 0.10 },
    { position: 'LW', metricKey: 'pressing_intensity', weight: 0.10 },
    { position: 'RW', metricKey: 'dribbles_completed', weight: 0.28 },
    { position: 'RW', metricKey: 'pace_score', weight: 0.25 },
    { position: 'RW', metricKey: 'goals_per90', weight: 0.27 },
    { position: 'RW', metricKey: 'passing_accuracy', weight: 0.10 },
    { position: 'RW', metricKey: 'pressing_intensity', weight: 0.10 },
    { position: 'CM', metricKey: 'passing_accuracy', weight: 0.35 },
    { position: 'CM', metricKey: 'vision_score', weight: 0.25 },
    { position: 'CM', metricKey: 'pressing_intensity', weight: 0.20 },
    { position: 'CM', metricKey: 'goals_per90', weight: 0.10 },
    { position: 'CM', metricKey: 'dribbles_completed', weight: 0.10 },
    { position: 'DM', metricKey: 'pressing_intensity', weight: 0.30 },
    { position: 'DM', metricKey: 'passing_accuracy', weight: 0.30 },
    { position: 'DM', metricKey: 'vision_score', weight: 0.20 },
    { position: 'DM', metricKey: 'dribbles_completed', weight: 0.10 },
    { position: 'DM', metricKey: 'goals_per90', weight: 0.10 },
  ]

  for (const w of weights) {
    await prisma.positionWeight.upsert({
      where: { id: `${w.position}-${w.metricKey}` },
      update: { weight: w.weight },
      create: { id: `${w.position}-${w.metricKey}`, ...w },
    })
  }

  // --- PLAYERS ---
  const playersData = [
    { id: 'player-vini', fullName: 'Vinícius Jr.', nationality: 'Brazil', age: 24, position: 'LW', photoUrl: 'https://tmssl.akamaized.net/images/foto/normal/vinicius-junior.jpg' },
    { id: 'player-pedri', fullName: 'Pedri', nationality: 'Spain', age: 22, position: 'CM', photoUrl: 'https://tmssl.akamaized.net/images/foto/normal/pedri.jpg' },
    { id: 'player-yamal', fullName: 'Lamine Yamal', nationality: 'Spain', age: 17, position: 'RW', photoUrl: 'https://tmssl.akamaized.net/images/foto/normal/lamine-yamal.jpg' },
    { id: 'player-saka', fullName: 'Bukayo Saka', nationality: 'England', age: 23, position: 'RW', photoUrl: 'https://tmssl.akamaized.net/images/foto/normal/bukayo-saka.jpg' },
    { id: 'player-rodri', fullName: 'Rodri', nationality: 'Spain', age: 28, position: 'DM', photoUrl: 'https://tmssl.akamaized.net/images/foto/normal/rodri.jpg' },
  ]

  for (const p of playersData) {
    await prisma.player.upsert({ where: { fullName: p.fullName }, update: {}, create: p })
  }

  // --- MATCHES ---
  const matchesData = [
    { id: 'match-1', homeTeam: 'FC Barcelona', awayTeam: 'Real Madrid', homeScore: 3, awayScore: 2, matchDate: new Date('2025-03-12'), competition: 'La Liga', season: '2024-25' },
    { id: 'match-2', homeTeam: 'Arsenal', awayTeam: 'Bayern München', homeScore: 1, awayScore: 1, matchDate: new Date('2025-03-05'), competition: 'Champions League', season: '2024-25' },
    { id: 'match-3', homeTeam: 'Real Madrid', awayTeam: 'Manchester City', homeScore: 2, awayScore: 0, matchDate: new Date('2025-02-20'), competition: 'Champions League', season: '2024-25' },
    { id: 'match-4', homeTeam: 'FC Barcelona', awayTeam: 'Atlético Madrid', homeScore: 2, awayScore: 1, matchDate: new Date('2025-02-08'), competition: 'La Liga', season: '2024-25' },
  ]

  for (const m of matchesData) {
    await prisma.match.upsert({ where: { id: m.id }, update: {}, create: m })
  }

  // --- PLAYER MATCHES ---
  const pmData = [
    { id: 'pm-vini-1', playerId: 'player-vini', matchId: 'match-1', minutesPlayed: 90, positionPlayed: 'LW' },
    { id: 'pm-vini-3', playerId: 'player-vini', matchId: 'match-3', minutesPlayed: 90, positionPlayed: 'LW' },
    { id: 'pm-pedri-1', playerId: 'player-pedri', matchId: 'match-1', minutesPlayed: 82, positionPlayed: 'CM' },
    { id: 'pm-pedri-4', playerId: 'player-pedri', matchId: 'match-4', minutesPlayed: 90, positionPlayed: 'CM' },
    { id: 'pm-yamal-1', playerId: 'player-yamal', matchId: 'match-1', minutesPlayed: 90, positionPlayed: 'RW' },
    { id: 'pm-yamal-4', playerId: 'player-yamal', matchId: 'match-4', minutesPlayed: 75, positionPlayed: 'RW' },
    { id: 'pm-saka-2', playerId: 'player-saka', matchId: 'match-2', minutesPlayed: 90, positionPlayed: 'RW' },
    { id: 'pm-rodri-3', playerId: 'player-rodri', matchId: 'match-3', minutesPlayed: 90, positionPlayed: 'DM' },
    { id: 'pm-rodri-4', playerId: 'player-rodri', matchId: 'match-4', minutesPlayed: 90, positionPlayed: 'DM' },
  ]

  for (const pm of pmData) {
    await prisma.playerMatch.upsert({ where: { id: pm.id }, update: {}, create: pm })
  }

  // --- PERFORMANCE METRICS ---
  const metricsData = [
    { id: 'm-vini-1a', playerMatchId: 'pm-vini-1', metricKey: 'dribbles_completed', metricValue: 94 },
    { id: 'm-vini-1b', playerMatchId: 'pm-vini-1', metricKey: 'pace_score', metricValue: 96 },
    { id: 'm-vini-1c', playerMatchId: 'pm-vini-1', metricKey: 'goals_per90', metricValue: 52 },
    { id: 'm-vini-1d', playerMatchId: 'pm-vini-1', metricKey: 'passing_accuracy', metricValue: 78 },
    { id: 'm-vini-1e', playerMatchId: 'pm-vini-1', metricKey: 'pressing_intensity', metricValue: 74 },
    { id: 'm-vini-3a', playerMatchId: 'pm-vini-3', metricKey: 'dribbles_completed', metricValue: 91 },
    { id: 'm-vini-3b', playerMatchId: 'pm-vini-3', metricKey: 'pace_score', metricValue: 97 },
    { id: 'm-vini-3c', playerMatchId: 'pm-vini-3', metricKey: 'goals_per90', metricValue: 55 },
    { id: 'm-vini-3d', playerMatchId: 'pm-vini-3', metricKey: 'passing_accuracy', metricValue: 76 },
    { id: 'm-vini-3e', playerMatchId: 'pm-vini-3', metricKey: 'pressing_intensity', metricValue: 71 },
    { id: 'm-pedri-1a', playerMatchId: 'pm-pedri-1', metricKey: 'passing_accuracy', metricValue: 91 },
    { id: 'm-pedri-1b', playerMatchId: 'pm-pedri-1', metricKey: 'vision_score', metricValue: 88 },
    { id: 'm-pedri-1c', playerMatchId: 'pm-pedri-1', metricKey: 'pressing_intensity', metricValue: 85 },
    { id: 'm-pedri-1d', playerMatchId: 'pm-pedri-1', metricKey: 'goals_per90', metricValue: 31 },
    { id: 'm-pedri-1e', playerMatchId: 'pm-pedri-1', metricKey: 'dribbles_completed', metricValue: 79 },
    { id: 'm-pedri-4a', playerMatchId: 'pm-pedri-4', metricKey: 'passing_accuracy', metricValue: 93 },
    { id: 'm-pedri-4b', playerMatchId: 'pm-pedri-4', metricKey: 'vision_score', metricValue: 90 },
    { id: 'm-pedri-4c', playerMatchId: 'pm-pedri-4', metricKey: 'pressing_intensity', metricValue: 83 },
    { id: 'm-pedri-4d', playerMatchId: 'pm-pedri-4', metricKey: 'goals_per90', metricValue: 33 },
    { id: 'm-pedri-4e', playerMatchId: 'pm-pedri-4', metricKey: 'dribbles_completed', metricValue: 81 },
    { id: 'm-yamal-1a', playerMatchId: 'pm-yamal-1', metricKey: 'dribbles_completed', metricValue: 89 },
    { id: 'm-yamal-1b', playerMatchId: 'pm-yamal-1', metricKey: 'pace_score', metricValue: 91 },
    { id: 'm-yamal-1c', playerMatchId: 'pm-yamal-1', metricKey: 'goals_per90', metricValue: 44 },
    { id: 'm-yamal-1d', playerMatchId: 'pm-yamal-1', metricKey: 'passing_accuracy', metricValue: 83 },
    { id: 'm-yamal-1e', playerMatchId: 'pm-yamal-1', metricKey: 'pressing_intensity', metricValue: 76 },
    { id: 'm-yamal-4a', playerMatchId: 'pm-yamal-4', metricKey: 'dribbles_completed', metricValue: 86 },
    { id: 'm-yamal-4b', playerMatchId: 'pm-yamal-4', metricKey: 'pace_score', metricValue: 90 },
    { id: 'm-yamal-4c', playerMatchId: 'pm-yamal-4', metricKey: 'goals_per90', metricValue: 40 },
    { id: 'm-yamal-4d', playerMatchId: 'pm-yamal-4', metricKey: 'passing_accuracy', metricValue: 85 },
    { id: 'm-yamal-4e', playerMatchId: 'pm-yamal-4', metricKey: 'pressing_intensity', metricValue: 72 },
    { id: 'm-saka-2a', playerMatchId: 'pm-saka-2', metricKey: 'dribbles_completed', metricValue: 85 },
    { id: 'm-saka-2b', playerMatchId: 'pm-saka-2', metricKey: 'pace_score', metricValue: 88 },
    { id: 'm-saka-2c', playerMatchId: 'pm-saka-2', metricKey: 'goals_per90', metricValue: 41 },
    { id: 'm-saka-2d', playerMatchId: 'pm-saka-2', metricKey: 'passing_accuracy', metricValue: 86 },
    { id: 'm-saka-2e', playerMatchId: 'pm-saka-2', metricKey: 'pressing_intensity', metricValue: 82 },
    { id: 'm-rodri-3a', playerMatchId: 'pm-rodri-3', metricKey: 'pressing_intensity', metricValue: 92 },
    { id: 'm-rodri-3b', playerMatchId: 'pm-rodri-3', metricKey: 'passing_accuracy', metricValue: 94 },
    { id: 'm-rodri-3c', playerMatchId: 'pm-rodri-3', metricKey: 'vision_score', metricValue: 88 },
    { id: 'm-rodri-3d', playerMatchId: 'pm-rodri-3', metricKey: 'dribbles_completed', metricValue: 71 },
    { id: 'm-rodri-3e', playerMatchId: 'pm-rodri-3', metricKey: 'goals_per90', metricValue: 18 },
    { id: 'm-rodri-4a', playerMatchId: 'pm-rodri-4', metricKey: 'pressing_intensity', metricValue: 90 },
    { id: 'm-rodri-4b', playerMatchId: 'pm-rodri-4', metricKey: 'passing_accuracy', metricValue: 92 },
    { id: 'm-rodri-4c', playerMatchId: 'pm-rodri-4', metricKey: 'vision_score', metricValue: 86 },
    { id: 'm-rodri-4d', playerMatchId: 'pm-rodri-4', metricKey: 'dribbles_completed', metricValue: 68 },
    { id: 'm-rodri-4e', playerMatchId: 'pm-rodri-4', metricKey: 'goals_per90', metricValue: 15 },
  ]

  for (const m of metricsData) {
    await prisma.performanceMetric.upsert({ where: { id: m.id }, update: {}, create: m })
  }

  // --- AGGREGATED RATINGS + RADAR SNAPSHOTS ---
  const ratingsData = [
    {
      id: 'rating-vini', playerId: 'player-vini', season: '2024-25', position: 'LW', overallRating: 88.4,
      radarSnapshot: [
        { axis: 'Dribbling', value: 93, maxValue: 100 },
        { axis: 'Pace', value: 97, maxValue: 100 },
        { axis: 'Goals/90', value: 84, maxValue: 100 },
        { axis: 'Passing', value: 77, maxValue: 100 },
        { axis: 'Pressing', value: 73, maxValue: 100 },
      ],
    },
    {
      id: 'rating-pedri', playerId: 'player-pedri', season: '2024-25', position: 'CM', overallRating: 85.1,
      radarSnapshot: [
        { axis: 'Passing', value: 92, maxValue: 100 },
        { axis: 'Vision', value: 89, maxValue: 100 },
        { axis: 'Pressing', value: 84, maxValue: 100 },
        { axis: 'Goals/90', value: 62, maxValue: 100 },
        { axis: 'Dribbling', value: 80, maxValue: 100 },
      ],
    },
    {
      id: 'rating-yamal', playerId: 'player-yamal', season: '2024-25', position: 'RW', overallRating: 83.7,
      radarSnapshot: [
        { axis: 'Dribbling', value: 88, maxValue: 100 },
        { axis: 'Pace', value: 91, maxValue: 100 },
        { axis: 'Goals/90', value: 72, maxValue: 100 },
        { axis: 'Passing', value: 84, maxValue: 100 },
        { axis: 'Pressing', value: 74, maxValue: 100 },
      ],
    },
    {
      id: 'rating-saka', playerId: 'player-saka', season: '2024-25', position: 'RW', overallRating: 82.0,
      radarSnapshot: [
        { axis: 'Dribbling', value: 85, maxValue: 100 },
        { axis: 'Pace', value: 88, maxValue: 100 },
        { axis: 'Goals/90', value: 71, maxValue: 100 },
        { axis: 'Passing', value: 86, maxValue: 100 },
        { axis: 'Pressing', value: 82, maxValue: 100 },
      ],
    },
    {
      id: 'rating-rodri', playerId: 'player-rodri', season: '2024-25', position: 'DM', overallRating: 80.3,
      radarSnapshot: [
        { axis: 'Pressing', value: 91, maxValue: 100 },
        { axis: 'Passing', value: 93, maxValue: 100 },
        { axis: 'Vision', value: 87, maxValue: 100 },
        { axis: 'Dribbling', value: 70, maxValue: 100 },
        { axis: 'Goals/90', value: 33, maxValue: 100 },
      ],
    },
  ]

  for (const r of ratingsData) {
    await prisma.aggregatedRating.upsert({
      where: { id: r.id },
      update: {},
      create: r,
    })
  }

  // --- CONTRACTS ---
  const contractsData = [
    { id: 'contract-vini', playerId: 'player-vini', club: 'Real Madrid', startDate: new Date('2022-07-01'), endDate: new Date('2027-06-30'), marketValueEur: 180000000, status: 'active' },
    { id: 'contract-pedri', playerId: 'player-pedri', club: 'FC Barcelona', startDate: new Date('2023-07-01'), endDate: new Date('2026-06-30'), marketValueEur: 120000000, status: 'active' },
    { id: 'contract-yamal', playerId: 'player-yamal', club: 'FC Barcelona', startDate: new Date('2024-07-01'), endDate: new Date('2029-06-30'), marketValueEur: 150000000, status: 'active' },
    { id: 'contract-saka', playerId: 'player-saka', club: 'Arsenal', startDate: new Date('2023-07-01'), endDate: new Date('2027-06-30'), marketValueEur: 130000000, status: 'active' },
    { id: 'contract-rodri', playerId: 'player-rodri', club: 'Manchester City', startDate: new Date('2023-07-01'), endDate: new Date('2027-06-30'), marketValueEur: 100000000, status: 'active' },
  ]

  for (const c of contractsData) {
    await prisma.contract.upsert({ where: { id: c.id }, update: {}, create: c })
  }

  console.log('✅ Seed completado exitosamente')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
