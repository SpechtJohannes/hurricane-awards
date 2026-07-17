export type Avatar = {
  id: string;
  label: string;
  imageSrc: string;
};

export const defaultAvatarId = "camp-sunrise";

const avatarImages = import.meta.glob("../assets/avatars/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const avatarImagePaths = Object.keys(avatarImages).sort();

const avatarDefinitions = [
  { id: "camp-sunrise", label: "Camp Sunrise" },
  { id: "neon-tent", label: "Neon Tent" },
  { id: "stage-spark", label: "Stage Spark" },
  { id: "rain-dancer", label: "Rain Dancer" },
  { id: "mellow-moon", label: "Mellow Moon" },
  { id: "bass-cloud", label: "Bass Cloud" },
  { id: "sun-hat", label: "Sun Hat" },
  { id: "campfire", label: "Campfire" },
  { id: "glitter", label: "Glitter" },
  { id: "mainstage", label: "Mainstage" },
  { id: "golden-hour", label: "Golden Hour" },
  { id: "laser-lime", label: "Laser Lime" },
  { id: "pink-noise", label: "Pink Noise" },
  { id: "blue-hour", label: "Blue Hour" },
  { id: "orange-amp", label: "Orange Amp" },
  { id: "green-room", label: "Green Room" },
  { id: "silver-rain", label: "Silver Rain" },
  { id: "violet-vibe", label: "Violet Vibe" },
  { id: "red-wristband", label: "Red Wristband" },
  { id: "aqua-echo", label: "Aqua Echo" },
  { id: "mud-proof", label: "Mud Proof" },
  { id: "disco-dot", label: "Disco Dot" },
  { id: "ticket-stub", label: "Ticket Stub" },
  { id: "late-shift", label: "Late Shift" },
  { id: "power-nap", label: "Power Nap" },
  { id: "circle-pit", label: "Circle Pit" },
  { id: "silent-disco", label: "Silent Disco" },
  { id: "fries-first", label: "Fries First" },
  { id: "camp-captain", label: "Camp Captain" },
  { id: "queue-hero", label: "Queue Hero" },
  { id: "poncho-pro", label: "Poncho Pro" },
  { id: "setlist", label: "Setlist" },
  { id: "blackout", label: "Blackout" },
  { id: "white-noise", label: "White Noise" },
  { id: "mint-mosh", label: "Mint Mosh" },
  { id: "ruby-riff", label: "Ruby Riff" },
  { id: "cobalt-crew", label: "Cobalt Crew" },
  { id: "banana-beat", label: "Banana Beat" },
  { id: "violet-amp", label: "Violet Amp" },
  { id: "coral-crowd", label: "Coral Crowd" },
  { id: "skyline", label: "Skyline" },
  { id: "forest-floor", label: "Forest Floor" },
  { id: "amber-anthem", label: "Amber Anthem" },
  { id: "indigo-intro", label: "Indigo Intro" },
  { id: "platinum-pass", label: "Platinum Pass" },
  { id: "turbo-teal", label: "Turbo Teal" },
  { id: "crimson-chorus", label: "Crimson Chorus" },
  { id: "olive-outro", label: "Olive Outro" },
  { id: "magenta-mix", label: "Magenta Mix" },
  { id: "denim-drop", label: "Denim Drop" },
  { id: "sunset-slot", label: "Sunset Slot" },
  { id: "lime-lineup", label: "Lime Lineup" },
] as const;

function avatarImageForIndex(index: number) {
  const imagePath = avatarImagePaths[index - 1];

  return imagePath ? avatarImages[imagePath] : "";
}

export const avatars: Avatar[] = avatarDefinitions.map((avatar, index) => ({
  ...avatar,
  imageSrc: avatarImageForIndex(index + 1),
}));

export function avatarById(avatarId?: string | null): Avatar {
  return avatars.find((avatar) => avatar.id === avatarId) ?? avatars[0];
}
