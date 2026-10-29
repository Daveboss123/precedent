import data from '../public/captures/captures.json';
import pristine from '../public/captures/states/pristine.json';
import answered from '../public/captures/states/answered.json';
import proof from '../public/captures/proof-response.json';

export const captures = data;
export const states = { pristine, answered };
export const verification = proof;

export const clip = (name) => {
  const found = captures.clips[name];
  if (!found) throw new Error(`No capture named ${name}; run npm run capture first.`);
  return found;
};

export const marker = (name, key, fallback = 0) =>
  clip(name).markers[key] ?? fallback;

export const stillPath = (name) => `captures/stills/${name}.png`;

export const rule = (id, state = 'pristine') => {
  const found = states[state].precedents.find((entry) => entry.id === id);
  if (!found) throw new Error(`The captured ${state} state has no rule #${id}.`);
  return found;
};
