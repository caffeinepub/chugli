// Approximate centroid coordinates for Indian states and union territories
// Used only for in-memory closest-state calculation; never persisted
export interface StateCentroid {
  id: string;
  lat: number;
  lng: number;
}

export const INDIA_STATE_CENTROIDS: StateCentroid[] = [
  { id: 'andhra-pradesh', lat: 15.9129, lng: 79.7400 },
  { id: 'arunachal-pradesh', lat: 28.2180, lng: 94.7278 },
  { id: 'assam', lat: 26.2006, lng: 92.9376 },
  { id: 'bihar', lat: 25.0961, lng: 85.3131 },
  { id: 'chhattisgarh', lat: 21.2787, lng: 81.8661 },
  { id: 'goa', lat: 15.2993, lng: 74.1240 },
  { id: 'gujarat', lat: 22.2587, lng: 71.1924 },
  { id: 'haryana', lat: 29.0588, lng: 76.0856 },
  { id: 'himachal-pradesh', lat: 31.1048, lng: 77.1734 },
  { id: 'jharkhand', lat: 23.6102, lng: 85.2799 },
  { id: 'karnataka', lat: 15.3173, lng: 75.7139 },
  { id: 'kerala', lat: 10.8505, lng: 76.2711 },
  { id: 'madhya-pradesh', lat: 22.9734, lng: 78.6569 },
  { id: 'maharashtra', lat: 19.7515, lng: 75.7139 },
  { id: 'manipur', lat: 24.6637, lng: 93.9063 },
  { id: 'meghalaya', lat: 25.4670, lng: 91.3662 },
  { id: 'mizoram', lat: 23.1645, lng: 92.9376 },
  { id: 'nagaland', lat: 26.1584, lng: 94.5624 },
  { id: 'odisha', lat: 20.9517, lng: 85.0985 },
  { id: 'punjab', lat: 31.1471, lng: 75.3412 },
  { id: 'rajasthan', lat: 27.0238, lng: 74.2179 },
  { id: 'sikkim', lat: 27.5330, lng: 88.5122 },
  { id: 'tamil-nadu', lat: 11.1271, lng: 78.6569 },
  { id: 'telangana', lat: 18.1124, lng: 79.0193 },
  { id: 'tripura', lat: 23.9408, lng: 91.9882 },
  { id: 'uttar-pradesh', lat: 26.8467, lng: 80.9462 },
  { id: 'uttarakhand', lat: 30.0668, lng: 79.0193 },
  { id: 'west-bengal', lat: 22.9868, lng: 87.8550 },
  // Union Territories
  { id: 'andaman-nicobar', lat: 11.7401, lng: 92.6586 },
  { id: 'chandigarh', lat: 30.7333, lng: 76.7794 },
  { id: 'dadra-nagar-haveli-daman-diu', lat: 20.3974, lng: 72.8328 },
  { id: 'delhi', lat: 28.7041, lng: 77.1025 },
  { id: 'jammu-kashmir', lat: 33.7782, lng: 76.5762 },
  { id: 'ladakh', lat: 34.1526, lng: 77.5771 },
  { id: 'lakshadweep', lat: 10.5667, lng: 72.6417 },
  { id: 'puducherry', lat: 11.9416, lng: 79.8083 },
];
