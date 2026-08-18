const GENRES = [
  "Blues",
  "Country",
  "Electronic",
  "Folk",
  "Hip-Hop",
  "Jazz",
  "Latin",
  "Metal",
  "Pop",
  "Punk",
  "R&B/Soul",
  "Reggae",
  "Rock",
  "World",
];

const ERAS = [
  "1950s",
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
];

const CONDITIONS = [
  "Good (G)",
  "Very Good (VG)",
  "Very Good Plus (VG+)",
  "Near Mint (NM)",
  "Mint (M)",
];

const toggleValue = (list: string[], value: string) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

export { GENRES, ERAS, CONDITIONS, toggleValue };
