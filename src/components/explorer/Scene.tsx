import { Fragment } from 'react';
import { planets, sun } from '@/data';
import { CameraRig } from './CameraRig';
import { OrbitRing } from './OrbitRing';
import { Planet } from './Planet';
import { Starfield } from './Starfield';
import { Sun } from './Sun';

/** Everything inside the 3D canvas. */
export function Scene() {
  return (
    <>
      <color attach="background" args={['#07060b']} />

      {/* Soft fill so the night side of a planet is dim, not pitch black. */}
      <ambientLight intensity={0.55} />
      {/* The Sun is the light source. decay=0 keeps the outer planets lit. */}
      <pointLight position={[0, 0, 0]} intensity={4} decay={0} color="#fff1d6" />

      <Starfield />
      <Sun body={sun} />
      {planets.map((planet) => (
        <Fragment key={planet.id}>
          <OrbitRing body={planet} />
          <Planet body={planet} />
        </Fragment>
      ))}

      <CameraRig />
    </>
  );
}
