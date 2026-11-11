// The one take's stops the nav links go to (key ids in take-route.js). Labels are the masterplan legend's own names.
// The take marks each with an element #stop-<key>; #facilities and #residences sit on the first stop of their group.
export const STOPS = [
  { key: 'gate', label: 'Gate & Guard House', group: 'facilities' },
  { key: 'podium', label: 'Observation Pavilion', group: 'facilities' },
  { key: 'bridge', label: 'Pedestrian Bridges', group: 'facilities' },
  { key: 'track', label: 'Multipurpose Track', group: 'facilities' },
  { key: 'wall', label: 'Verdant Green Wall', group: 'facilities' },
  { key: 'lounge', label: 'Lounge Decks', group: 'facilities' },
  { key: 'pool', label: 'Swimming Pool', group: 'facilities' },
  { key: 'gym', label: 'Floating Gym', group: 'facilities' },
  { key: 'splash', label: 'Kids’ Splash Pool & Treehouse', group: 'facilities' },
  { key: 'homes', label: 'Courtyard Homes', group: 'residences' },
  { key: 'villas', label: 'Courtyard Villas', group: 'residences' },
]
