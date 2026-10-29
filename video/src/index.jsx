import { cancelRender, continueRender, delayRender, registerRoot, staticFile } from 'remotion';
import { Root } from './root.jsx';

const fontHandle = delayRender('Load the bundled Inter font');
const font = new FontFace('InterVariable', `url('${staticFile('fonts/InterVariable.woff2')}') format('woff2')`, { weight: '100 900' });
font.load().then((loaded) => {
  document.fonts.add(loaded);
  continueRender(fontHandle);
}).catch(cancelRender);

registerRoot(Root);
