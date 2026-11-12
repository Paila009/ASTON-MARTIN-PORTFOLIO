'use client';

import { Component, type ComponentRef, type ReactNode, Suspense, memo, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import type { GarageCommand, GarageView, HotspotId } from './Garage';

type V3 = [number, number, number];
type SceneProps = { view: GarageView; selectedHotspot: HotspotId | null; autoRotate: boolean; airflow: boolean; visible: boolean; reducedMotion: boolean; command: GarageCommand; resetKey: number; onSelect: (id: HotspotId) => void; onInteract: () => void; onReady: () => void; onError: () => void; scrollProgress?: number };
type Section = { x: number; y: number; w: number; h: number };
const green = '#00543f';
const carbon = '#111816';
const lime = '#d7f000';
const paint = { color: green, metalness: .64, roughness: .26, clearcoat: 1, clearcoatRoughness: .16 };
const carbonFinish = { color: carbon, metalness: .4, roughness: .45 };
RectAreaLightUniformsLib.init();

function makeLoft(sections: Section[], count = 48) {
  const positions: number[] = [], indices: number[] = [];
  sections.forEach((section) => {
    for (let j = 0; j <= count; j++) {
      const a = j / count * Math.PI * 2;
      positions.push(section.x, section.y + Math.sin(a) * section.h, Math.cos(a) * section.w);
    }
  });
  for (let i = 0; i < sections.length - 1; i++) for (let j = 0; j < count; j++) {
    const a = i * (count + 1) + j, b = a + count + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  [0, sections.length - 1].forEach((sectionIndex, side) => {
    const s = sections[sectionIndex], center = positions.length / 3;
    positions.push(s.x, s.y, 0);
    for (let j = 0; j < count; j++) {
      const a = sectionIndex * (count + 1) + j;
      if (side) indices.push(center, a + 1, a); else indices.push(center, a, a + 1);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function Loft({ sections, position = [0, 0, 0], color = green, metallic = true }: { sections: Section[]; position?: V3; color?: string; metallic?: boolean }) {
  const geometry = useMemo(() => makeLoft(sections), [sections]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={position} castShadow receiveShadow><meshPhysicalMaterial {...paint} color={color} metalness={metallic ? .64 : .3}/></mesh>;
}

function Rod({ a, b, radius = .027, color = '#151b19' }: { a: V3; b: V3; radius?: number; color?: string }) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), delta = to.clone().sub(from);
    return { midpoint: from.clone().add(to).multiplyScalar(.5), quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize()), length: delta.length() };
  }, [a, b]);
  return <mesh position={midpoint} quaternion={quaternion} castShadow><cylinderGeometry args={[radius, radius, length, 10]}/><meshStandardMaterial color={color} roughness={.39} metalness={.65}/></mesh>;
}

function CurvedTube({ points, radius = .035, color = carbon, closed = false }: { points: V3[]; radius?: number; color?: string; closed?: boolean }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'centripetal'), [points, closed]);
  return <mesh castShadow><tubeGeometry args={[curve, 72, radius, 8, closed]}/><meshStandardMaterial color={color} roughness={.35} metalness={.6}/></mesh>;
}

function WingBlade({ x, y, span, chord, rise = .12, color = green }: { x: number; y: number; span: number; chord: number; rise?: number; color?: string }) {
  const geometry = useMemo(() => {
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= 40; i++) for (let j = 0; j <= 8; j++) {
      const z = (i / 40 - .5) * span, u = j / 8, tips = Math.pow(Math.abs(z) / (span / 2), 3);
      vertices.push(x + (u - .5) * chord + tips * .12, y + Math.sin(u * Math.PI) * .065 + tips * rise + u * .07, z);
    }
    for (let i = 0; i < 40; i++) for (let j = 0; j < 8; j++) { const a = i * 9 + j; indices.push(a, a + 9, a + 1, a + 1, a + 9, a + 10); }
    const result = new THREE.BufferGeometry(); result.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); result.setIndex(indices); result.computeVertexNormals(); return result;
  }, [x, y, span, chord, rise]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} castShadow receiveShadow><meshPhysicalMaterial {...paint} color={color} side={THREE.DoubleSide}/></mesh>;
}

function FlatShape({ points, thickness, position, color = carbon }: { points: [number, number][]; thickness: number; position: V3; color?: string }) {
  const shape = useMemo(() => { const s = new THREE.Shape(); points.forEach(([x, y], index) => index ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath(); return s; }, [points]);
  return <mesh position={position} castShadow><extrudeGeometry args={[shape, { depth: thickness, bevelEnabled: true, bevelThickness: .012, bevelSize: .018, bevelSegments: 2, steps: 1 }]}/><meshPhysicalMaterial {...paint} color={color}/></mesh>;
}

function makeTyreTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext('2d')!;
  context.clearRect(0, 0, 512, 512);
  const arc = (text: string, startAngle: number, radius: number) => {
    context.font = 'bold 36px Arial'; context.fillStyle = '#d6da69'; context.textAlign = 'center'; context.textBaseline = 'middle';
    [...text].forEach((letter, i) => { const angle = startAngle + (i - (text.length - 1) / 2) * .125; context.save(); context.translate(256 + Math.cos(angle) * radius, 256 + Math.sin(angle) * radius); context.rotate(angle + Math.PI / 2); context.fillText(letter, 0, 0); context.restore(); });
  };
  arc('P ZERO', -Math.PI / 2, 204); arc('P ZERO', Math.PI / 2, 204);
  context.strokeStyle = '#a8b34d'; context.lineWidth = 2; context.beginPath(); context.arc(256, 256, 176, 0, Math.PI * 2); context.stroke();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function Wheel({ position, side, rear, sidewall }: { position: V3; side: number; rear?: boolean; sidewall: THREE.Texture }) {
  const width = rear ? .67 : .58;
  const tyreGeometry = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(.48, -width / 2), new THREE.Vector2(.69, -width / 2), new THREE.Vector2(.79, -width * .46),
    new THREE.Vector2(.84, -width * .34), new THREE.Vector2(.85, -width * .18), new THREE.Vector2(.85, width * .18),
    new THREE.Vector2(.84, width * .34), new THREE.Vector2(.79, width * .46), new THREE.Vector2(.69, width / 2), new THREE.Vector2(.48, width / 2),
  ], 72), [width]);
  useEffect(() => () => tyreGeometry.dispose(), [tyreGeometry]);
  return <group position={position}>
    <mesh geometry={tyreGeometry} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow><meshStandardMaterial color="#101211" roughness={.87} metalness={.02}/></mesh>
    {[-1, 1].map((face) => <group key={face} position={[0, 0, face * (width / 2 + .003)]}>
      <mesh rotation={[0, face === -1 ? Math.PI : 0, 0]}><ringGeometry args={[.49, .83, 72]}/><meshStandardMaterial map={sidewall} transparent roughness={.85} polygonOffset polygonOffsetFactor={-1}/></mesh>
      <mesh><circleGeometry args={[.495, 48]}/><meshStandardMaterial color="#0d1312" metalness={.7} roughness={.45} side={THREE.DoubleSide}/></mesh>
      <mesh><torusGeometry args={[.487, .025, 8, 64]}/><meshStandardMaterial color="#475049" metalness={.8} roughness={.3}/></mesh>
      {Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * .285, Math.sin(a) * .285, .012 * face]} rotation={[0, 0, a]}><boxGeometry args={[.36, .033, .025]}/><meshStandardMaterial color="#303a34" metalness={.9} roughness={.34}/></mesh>; })}
      <mesh position={[0, 0, face * .027]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.125, .125, .055, 16]}/><meshStandardMaterial color={side > 0 ? '#8c4b33' : '#57676c'} metalness={.8} roughness={.28}/></mesh>
      <mesh><ringGeometry args={[.345, .358, 64]}/><meshStandardMaterial color="#72766c" metalness={.85} roughness={.58} side={THREE.DoubleSide}/></mesh>
    </group>)}
    {[-.16, .16].map((offset) => <mesh key={offset} position={[0, 0, offset]}><torusGeometry args={[.851, .004, 4, 72]}/><meshStandardMaterial color="#222723" roughness={.9}/></mesh>)}
  </group>;
}

function Body() {
  const sidewall = useMemo(makeTyreTexture, []);
  useEffect(() => () => sidewall.dispose(), [sidewall]);
  const wordmark = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 192;
    const context = canvas.getContext('2d')!; context.clearRect(0, 0, 1024, 192); context.fillStyle = '#eef2df'; context.textAlign = 'center'; context.font = '500 83px Arial'; context.fillText('THE PURSUIT', 512, 118); context.fillStyle = lime; context.fillRect(130, 148, 764, 5);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, []);
  useEffect(() => () => wordmark.dispose(), [wordmark]);
  const floorShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-2.55, -.6); shape.lineTo(-2.2, -1.4); shape.bezierCurveTo(-1.4, -1.52, 1.5, -1.5, 2.6, -1.38); shape.lineTo(3.98, -1.15); shape.lineTo(4.35, -.8); shape.lineTo(4.35, .8); shape.lineTo(3.98, 1.15); shape.lineTo(2.6, 1.38); shape.bezierCurveTo(1.5, 1.5, -1.4, 1.52, -2.2, 1.4); shape.lineTo(-2.55, .6); shape.closePath(); return shape;
  }, []);

  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .31, 0]} castShadow receiveShadow><extrudeGeometry args={[floorShape, { depth: .085, bevelEnabled: true, bevelSize: .025, bevelThickness: .02, bevelSegments: 2 }]}/><meshStandardMaterial {...carbonFinish}/></mesh>
    <Loft sections={[{ x: -4.96, y: .77, w: .11, h: .07 }, { x: -4.5, y: .84, w: .18, h: .12 }, { x: -3.8, y: .98, w: .24, h: .19 }, { x: -3.1, y: 1.11, w: .32, h: .24 }, { x: -2.3, y: 1.16, w: .43, h: .32 }, { x: -1.5, y: 1.1, w: .59, h: .36 }, { x: -.6, y: 1.02, w: .64, h: .38 }, { x: .6, y: .99, w: .65, h: .39 }, { x: 1.5, y: 1.02, w: .59, h: .38 }, { x: 2.7, y: .92, w: .42, h: .27 }, { x: 4.05, y: .82, w: .14, h: .16 }]}/>
    <Loft sections={[{ x: .62, y: 1.3, w: .44, h: .4 }, { x: 1.02, y: 1.55, w: .4, h: .57 }, { x: 1.4, y: 1.5, w: .37, h: .53 }, { x: 2.2, y: 1.23, w: .3, h: .4 }, { x: 3.3, y: 1, w: .18, h: .25 }, { x: 3.9, y: .93, w: .06, h: .13 }]}/>
    <mesh position={[1.01, 1.97, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow><circleGeometry args={[.21, 3]}/><meshStandardMaterial color="#091411" side={THREE.DoubleSide}/></mesh>
    <CurvedTube points={[[.89, 1.84, -.17], [.89, 2.15, 0], [.89, 1.84, .17]]} radius={.028} color={green}/>
    <CurvedTube points={[[1.13, 2.08, 0], [1.9, 1.76, 0], [2.7, 1.41, 0], [3.3, 1.23, 0]]} radius={.018} color={lime}/>
    <CurvedTube points={[[-4.8, .84, 0], [-3.8, 1.17, 0], [-2.7, 1.43, 0], [-2.04, 1.47, 0]]} radius={.024} color={lime}/>
    {[-1, 1].map((side) => <group key={side}>
      <Loft position={[0, 0, side * .9]} sections={[{ x: -1.48, y: 1.02, w: .27, h: .16 }, { x: -1.1, y: 1.05, w: .49, h: .27 }, { x: -.35, y: .98, w: .53, h: .31 }, { x: .8, y: .89, w: .51, h: .33 }, { x: 1.8, y: .74, w: .37, h: .27 }, { x: 2.65, y: .66, w: .12, h: .12 }]}/>
      <Loft position={[0, 0, side * .88]} color="#123b30" sections={[{ x: -1.25, y: .62, w: .3, h: .11 }, { x: -.5, y: .59, w: .4, h: .12 }, { x: 1.2, y: .55, w: .35, h: .12 }, { x: 2.6, y: .51, w: .09, h: .06 }]}/>
      <mesh position={[-1.505, 1.025, side * .9]} rotation={[0, -Math.PI / 2, 0]} scale={[.27, .143, 1]}><circleGeometry args={[1, 32]}/><meshStandardMaterial color="#07120d" roughness={.7} side={THREE.DoubleSide}/></mesh>
      <mesh position={[-1.51, 1.025, side * .9]} rotation={[0, Math.PI / 2, 0]} scale={[.27, .143, 1]}><torusGeometry args={[1, .06, 8, 32]}/><meshPhysicalMaterial {...paint}/></mesh>
      <mesh position={[.05, 1.03, side * 1.416]} rotation={[0, side < 0 ? Math.PI : 0, -.07 * side]}><planeGeometry args={[2.02, .38]}/><meshBasicMaterial map={wordmark} transparent depthWrite={false} toneMapped={false}/></mesh>
      <CurvedTube points={[[-2.18, .44, side * 1.41], [-.6, .44, side * 1.51], [1.1, .44, side * 1.49], [2.5, .44, side * 1.36]]} radius={.012} color="#719c58"/>
      <Rod a={[-1.21, 1.38, side * .54]} b={[-1.45, 1.48, side * 1.01]} radius={.029} color={green}/>
      <mesh position={[-1.43, 1.5, side * 1.13]} castShadow><boxGeometry args={[.32, .13, .26]}/><meshPhysicalMaterial {...paint}/></mesh>
      <mesh position={[-1.258, 1.5, side * 1.13]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[.2, .08]}/><meshStandardMaterial color="#afc1b0" metalness={1} roughness={.12}/></mesh>
      {[-3.15, 3.12].map((axle) => <group key={axle}>
        <Wheel position={[axle, .86, side * 1.66]} side={side} rear={axle > 0} sidewall={sidewall}/>
        <Rod a={[axle - .52, .92, side * .33]} b={[axle, 1.02, side * 1.53]} radius={.044}/>
        <Rod a={[axle + .5, .92, side * .36]} b={[axle, 1.02, side * 1.53]} radius={.044}/>
        <Rod a={[axle - .5, .48, side * .37]} b={[axle, .62, side * 1.53]} radius={.042}/>
        <Rod a={[axle + .5, .48, side * .37]} b={[axle, .62, side * 1.53]} radius={.042}/>
        <Rod a={[axle + .2, 1.13, side * .32]} b={[axle - .1, .64, side * 1.4]} radius={.031} color="#4a5650"/>
        <Rod a={[axle - .13, .72, side * .36]} b={[axle - .12, .78, side * 1.5]} radius={.023}/>
        <mesh position={[axle + .05, .86, side * 1.28]} castShadow><boxGeometry args={[.32, .34, .23]}/><meshStandardMaterial {...carbonFinish}/></mesh>
      </group>)}
    </group>)}
    <WingBlade x={-4.85} y={.3} span={3.94} chord={.72} rise={.1} color="#111c16"/>
    <WingBlade x={-4.55} y={.43} span={3.88} chord={.45} rise={.11}/>
    <WingBlade x={-4.29} y={.56} span={3.76} chord={.33} rise={.12}/>
    {[-1, 1].map((side) => <group key={side}>
      <FlatShape points={[[-5.22, .26], [-5.2, .64], [-4.82, .78], [-4.06, .76], [-4.03, .31]]} thickness={.05} position={[0, 0, side * 1.95]} color={green}/>
      <CurvedTube points={[[-5.18, .66, side * 1.96], [-4.84, .79, side * 1.96], [-4.08, .77, side * 1.96]]} radius={.015} color={lime}/>
      <Rod a={[-4.71, .45, side * .21]} b={[-4.54, .91, side * .2]} radius={.047}/>
    </group>)}
    <mesh position={[.03, 1.36, 0]} scale={[1.08, .19, .51]}><sphereGeometry args={[1, 48, 24]}/><meshStandardMaterial color="#050b08" roughness={.9}/></mesh>
    <CurvedTube points={[[-1.01, 1.39, 0], [-.81, 1.46, -.4], [.35, 1.48, -.51], [.96, 1.42, -.32], [1.04, 1.41, 0], [.96, 1.42, .32], [.35, 1.48, .51], [-.81, 1.46, .4]]} radius={.042} color="#0c2f24" closed/>
    <mesh position={[.55, 1.4, 0]} rotation={[0, 0, -.18]} castShadow><boxGeometry args={[.22, .53, .55]}/><meshStandardMaterial color="#18251a" roughness={.95}/></mesh>
    <CurvedTube points={[[-.94, 1.71, 0], [-.78, 1.96, -.3], [-.12, 2.02, -.52], [.73, 1.98, -.43], [.98, 1.73, -.2]]} radius={.054} color="#10281f"/>
    <CurvedTube points={[[-.94, 1.71, 0], [-.78, 1.96, .3], [-.12, 2.02, .52], [.73, 1.98, .43], [.98, 1.73, .2]]} radius={.054} color="#10281f"/>
    <Rod a={[-.94, 1.35, 0]} b={[-.94, 1.76, 0]} radius={.046} color="#122d23"/>
    <group position={[-.63, 1.53, 0]} rotation={[0, 0, -.15]}>
      <Rod a={[.18, -.05, 0]} b={[-.05, 0, 0]} radius={.045}/>
      <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[.53, .23, .055]}/><meshStandardMaterial color="#15231a" roughness={.5}/></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[0, 0, side * .29]}><boxGeometry args={[.11, .35, .095]}/><meshStandardMaterial color="#131b15" roughness={.9}/></mesh>)}
      <mesh position={[-.033, .055, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[.21, .09]}/><meshBasicMaterial color="#668e5c"/></mesh>
      {[-.17, .17].map((offset) => <mesh key={offset} position={[-.037, -.035, offset]} rotation={[0, -Math.PI / 2, 0]}><circleGeometry args={[.027, 12]}/><meshStandardMaterial color={offset > 0 ? lime : '#d56338'}/></mesh>)}
    </group>
    <WingBlade x={4.03} y={2.18} span={2.92} chord={.82} rise={.015}/>
    <WingBlade x={4.36} y={2.43} span={2.9} chord={.44} rise={.015}/>
    <WingBlade x={3.85} y={1.42} span={2.16} chord={.47} rise={.04} color={carbon}/>
    {[-1, 1].map((side) => <group key={side}>
      <FlatShape points={[[3.52, 1.5], [3.52, 2.6], [4.54, 2.6], [4.65, 2.25], [4.42, 1.54]]} thickness={.052} position={[0, 0, side * 1.49]} color={green}/>
      <Rod a={[3.58, 2.6, side * 1.515]} b={[4.53, 2.6, side * 1.515]} radius={.013} color={lime}/>
      <Rod a={[3.44, .98, side * .23]} b={[3.93, 2.16, side * .25]} radius={.047}/>
    </group>)}
    <Rod a={[4.55, 2.48, -1.46]} b={[4.55, 2.48, 1.46]} radius={.014} color={lime}/>
    <mesh position={[4.13, .6, 0]} rotation={[0, 0, .21]} castShadow><boxGeometry args={[.66, .06, 2.12]}/><meshStandardMaterial {...carbonFinish}/></mesh>
    {[-.9, -.6, -.3, 0, .3, .6, .9].map((z) => <mesh key={z} position={[4.13, .46, z]} rotation={[0, 0, .18]}><boxGeometry args={[.65, .31, .025]}/><meshStandardMaterial {...carbonFinish}/></mesh>)}
    <mesh position={[4.05, .97, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.1, .12, .6, 20]}/><meshStandardMaterial color="#696e65" metalness={.95} roughness={.4}/></mesh>
    <mesh position={[4.45, .72, 0]}><boxGeometry args={[.04, .12, .2]}/><meshStandardMaterial color="#6d1d12" emissive="#992a0a" emissiveIntensity={.4}/></mesh>
    <mesh position={[-2.12, 1.48, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}><planeGeometry args={[.31, .34]}/><meshBasicMaterial color="#dfe4cb"/></mesh>
  </group>;
}

const anchors: Record<HotspotId, { label: string; position: V3; camera: V3 }> = {
  'front-wing': { label: 'Front wing', position: [-4.55, .72, 1.05], camera: [-8, 3.2, 5.3] },
  'rear-wing': { label: 'Rear wing', position: [4.2, 2.7, .75], camera: [8, 4.5, 5.2] },
  floor: { label: 'Floor', position: [.9, .47, 1.49], camera: [1.2, 2.5, 7.8] },
  sidepods: { label: 'Sidepods', position: [-.5, 1.25, 1.2], camera: [-3.5, 3.6, 6.6] },
  suspension: { label: 'Suspension', position: [-3.1, 1.05, 1.03], camera: [-6.2, 3, 5.2] },
  cockpit: { label: 'Cockpit & halo', position: [0, 2.12, .36], camera: [-2.7, 4.4, 4.3] },
  steering: { label: 'Steering wheel', position: [-.7, 1.6, -.1], camera: [-1.9, 3.2, -3] },
  tyres: { label: 'Tyres', position: [3.15, 1.35, 2.03], camera: [5.8, 2.5, 6.3] },
  'power-unit': { label: 'Power unit', position: [1.75, 1.86, 0], camera: [3.3, 4.2, 5] },
};

function Hotspots({ selected, onSelect }: { selected: HotspotId | null; onSelect: (id: HotspotId) => void }) {
  return <group>{(Object.entries(anchors) as [HotspotId, typeof anchors[HotspotId]][]).map(([id, item], index) => <Html key={id} position={item.position} center zIndexRange={[4, 0]} distanceFactor={15} style={{ display: selected && selected !== id ? 'none' : 'block' }}><button className={`garage-marker${selected === id ? ' is-selected' : ''}`} aria-label={`Explore ${item.label}`} aria-pressed={selected === id} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSelect(id); }}>{String(index + 1).padStart(2, '0')}<span className="garage-marker-label">{item.label.toUpperCase()}</span></button></Html>)}</group>;
}

const componentBounds: Record<HotspotId, { center: V3; half: V3 }> = {
  'front-wing': { center: [-4.62, .52, 0], half: [.68, .35, 2.08] },
  'rear-wing': { center: [4.07, 2.08, 0], half: [.68, .61, 1.62] },
  floor: { center: [.75, .39, 0], half: [3.4, .18, 1.59] },
  sidepods: { center: [.3, .98, .94], half: [1.75, .46, .59] },
  suspension: { center: [-3.14, .8, 1.02], half: [.64, .43, .65] },
  cockpit: { center: [0, 1.69, 0], half: [1.16, .49, .64] },
  steering: { center: [-.65, 1.55, 0], half: [.23, .24, .4] },
  tyres: { center: [3.12, .86, 1.66], half: [.93, .93, .45] },
  'power-unit': { center: [1.82, 1.36, 0], half: [1.18, .82, .65] },
};

function SelectionBrackets({ selected }: { selected: HotspotId }) {
  const geometry = useMemo(() => {
    const { center, half } = componentBounds[selected], points: number[] = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      const corner = [center[0] + x * half[0], center[1] + y * half[1], center[2] + z * half[2]];
      [x, y, z].forEach((sign, axis) => { const end = [...corner]; end[axis] -= sign * Math.min(.23, half[axis] * .4); points.push(...corner, ...end); });
    }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  }, [selected]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <lineSegments geometry={geometry} renderOrder={2}><lineBasicMaterial color={lime} transparent opacity={.72} depthTest={false}/></lineSegments>;
}

const presets: Record<GarageView, { position: V3; target: V3 }> = {
  'three-quarter': { position: [-10.8, 6.25, 10.9], target: [0, .85, 0] },
  front: { position: [-14, 3.25, .01], target: [-.5, .85, 0] },
  side: { position: [-.2, 3.5, 15.5], target: [0, 1, 0] },
  rear: { position: [13.7, 4, .01], target: [.4, 1.1, 0] },
  overhead: { position: [0, 16.5, .04], target: [0, 0, 0] },
  cockpit: { position: [-2.65, 3.7, 3.5], target: [-.1, 1.45, 0] },
};

function CameraRig(props: SceneProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, invalidate } = useThree();
  const desiredPosition = useRef(new THREE.Vector3(...presets['three-quarter'].position));
  const desiredTarget = useRef(new THREE.Vector3(...presets['three-quarter'].target));
  const transitioning = useRef(false);

  useEffect(() => {
    const selected = props.selectedHotspot ? anchors[props.selectedHotspot] : null;
    desiredPosition.current.set(...(selected ? selected.camera : presets[props.view].position));
    desiredTarget.current.set(...(selected ? selected.position : presets[props.view].target));
    transitioning.current = true;
    if (props.reducedMotion && controls.current) { camera.position.copy(desiredPosition.current); controls.current.target.copy(desiredTarget.current); controls.current.update(); transitioning.current = false; }
    invalidate();
  }, [props.view, props.selectedHotspot, props.resetKey, props.reducedMotion, camera, invalidate]);

  useEffect(() => {
    if (!props.command.sequence || !controls.current) return;
    const orbit = controls.current;
    transitioning.current = false;
    const { action } = props.command;
    if (action === 'left' || action === 'right') orbit.setAzimuthalAngle(orbit.getAzimuthalAngle() + (action === 'left' ? -.16 : .16));
    else if (action === 'up' || action === 'down') orbit.setPolarAngle(THREE.MathUtils.clamp(orbit.getPolarAngle() + (action === 'up' ? -.12 : .12), .04, 1.46));
    else {
      const offset = camera.position.clone().sub(orbit.target), nextDistance = THREE.MathUtils.clamp(offset.length() * (action === 'in' ? .84 : 1.19), 2.6, 21);
      camera.position.copy(orbit.target).add(offset.setLength(nextDistance));
    }
    orbit.update(); invalidate();
  }, [props.command, camera, invalidate]);

  useFrame((_, delta) => {
    if (!transitioning.current || !controls.current || !props.visible) return;
    const factor = 1 - Math.exp(-delta * 5.5);
    camera.position.lerp(desiredPosition.current, factor); controls.current.target.lerp(desiredTarget.current, factor); controls.current.update();
    if (camera.position.distanceTo(desiredPosition.current) < .018) transitioning.current = false;
  });

  return <OrbitControls ref={controls} makeDefault target={[0, .85, 0]} enablePan={false} enableDamping={!props.reducedMotion} dampingFactor={.075} rotateSpeed={.55} zoomSpeed={.65} minDistance={2.6} maxDistance={21} minPolarAngle={.035} maxPolarAngle={1.46} autoRotate={props.autoRotate && props.visible && !transitioning.current} autoRotateSpeed={.32} onStart={() => { transitioning.current = false; props.onInteract(); }} />;
}

function ScrollCameraRig({ progress, reducedMotion, visible, compact }: { progress: number; reducedMotion: boolean; visible: boolean; compact: boolean }) {
  const { camera, gl } = useThree();
  const easedProgress = useRef(progress);
  const path = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-12.9, 2.7, 4.6), new THREE.Vector3(-9.2, 4.1, 10.2),
    new THREE.Vector3(-1.8, 6.2, 14.6), new THREE.Vector3(6.8, 9.4, 10), new THREE.Vector3(8.3, 14.3, 1.4),
  ], false, 'centripetal'), []);
  useFrame((_, delta) => {
    if (!visible) return;
    const requested = reducedMotion ? .36 : THREE.MathUtils.clamp(progress, 0, 1);
    easedProgress.current += (requested - easedProgress.current) * (reducedMotion ? 1 : 1 - Math.exp(-delta * 10));
    const position = path.getPoint(THREE.MathUtils.clamp(easedProgress.current, 0, 1));
    if (compact) position.multiplyScalar(1.25);
    camera.position.copy(position);
    camera.lookAt(0, .8 + easedProgress.current * .18, 0);
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== (compact ? 48 : 39)) { camera.fov = compact ? 48 : 39; camera.updateProjectionMatrix(); }
    gl.domElement.dataset.scrollCamera = `${camera.position.x.toFixed(2)},${camera.position.y.toFixed(2)},${camera.position.z.toFixed(2)}`;
  });
  return null;
}

function Airflow({ reducedMotion, visible }: { reducedMotion: boolean; visible: boolean }) {
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const phase = useRef(0);
  const curves = useMemo(() => [
    [[-7, .65, -1.2], [-4.7, .9, -1.3], [-3.3, 1.7, -1.35], [-1.8, 1.55, -1.6], [1, 1.2, -1.6], [4, 1.1, -1.4], [7, 1.4, -1.45]],
    [[-7, .65, 1.2], [-4.7, .9, 1.3], [-3.3, 1.7, 1.35], [-1.8, 1.55, 1.6], [1, 1.2, 1.6], [4, 1.1, 1.4], [7, 1.4, 1.45]],
    [[-7, 1.45, 0], [-4.5, 1.5, 0], [-2, 1.8, 0], [0, 2.6, 0], [2, 2.4, 0], [4.5, 3, 0], [7, 3.1, 0]],
    [[-7, .38, -.8], [-3.5, .3, -.8], [0, .25, -.8], [3.8, .32, -.8], [5.2, .7, -.8], [7, .95, -.8]],
    [[-7, .38, .8], [-3.5, .3, .8], [0, .25, .8], [3.8, .32, .8], [5.2, .7, .8], [7, .95, .8]],
    [[-7, .55, 2.1], [-4, .65, 2.25], [-2, 1, 2.45], [1.3, .8, 2.3], [4, .8, 2.35], [7, 1.2, 2.2]],
  ].map((points) => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal')), []);
  useFrame((_, delta) => { if (!visible || reducedMotion) return; phase.current += delta * .12; particleRefs.current.forEach((mesh, i) => { if (mesh) mesh.position.copy(curves[i].getPointAt((phase.current + i * .16) % 1)); }); });
  return <group>{curves.map((curve, i) => <group key={i}><Line points={curve.getPoints(90)} color={i > 2 ? '#98b9a7' : lime} lineWidth={1.4} transparent opacity={.44} dashed dashSize={.12} gapSize={.1}/><mesh ref={(node) => { particleRefs.current[i] = node; }} position={curve.getPointAt(i * .13)}><sphereGeometry args={[.045, 8, 8]}/><meshBasicMaterial color={i > 2 ? '#b1d3bd' : lime} transparent opacity={.85}/></mesh></group>)}</group>;
}

function Studio({ economy }: { economy: boolean }) {
  const tickGeometry = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < 72; i++) { const angle = i / 72 * Math.PI * 2, inner = i % 6 === 0 ? 6.2 : 6.33; points.push(Math.cos(angle) * inner, .013, Math.sin(angle) * inner, Math.cos(angle) * 6.45, .013, Math.sin(angle) * 6.45); }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  }, []);
  useEffect(() => () => tickGeometry.dispose(), [tickGeometry]);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, 0]} receiveShadow><planeGeometry args={[200, 200]}/><meshStandardMaterial color="#111d15" metalness={.18} roughness={.73}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.002, 0]} receiveShadow><circleGeometry args={[6.1, 100]}/><meshStandardMaterial color="#17251b" roughness={.63} metalness={.25}/></mesh>
    {[5.65, 6.05, 6.57].map((r) => <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, .009, 0]}><ringGeometry args={[r, r + .009, 128]}/><meshBasicMaterial color="#78805a" transparent opacity={r === 6.05 ? .34 : .13} depthWrite={false}/></mesh>)}
    <lineSegments geometry={tickGeometry}><lineBasicMaterial color="#9ba978" transparent opacity={.35}/></lineSegments>
    <ContactShadows position={[0, .025, 0]} opacity={.56} scale={18} blur={2.4} far={4.5} resolution={economy ? 256 : 512} frames={1} color="#000a03"/>
  </group>;
}

const StableBody = memo(Body);
const StableStudio = memo(Studio);

function Ready({ onReady, onError }: { onReady: () => void; onError: () => void }) {
  const { gl } = useThree();
  useEffect(() => { onReady(); const contextLost = (event: Event) => { event.preventDefault(); onError(); }; gl.domElement.addEventListener('webglcontextlost', contextLost); return () => gl.domElement.removeEventListener('webglcontextlost', contextLost); }, [gl, onReady, onError]);
  return null;
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function GarageScene(props: SceneProps) {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const limitedHardware = useMemo(() => {
    const device = navigator as Navigator & { deviceMemory?: number };
    return (device.deviceMemory !== undefined && device.deviceMemory <= 4) || (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4);
  }, []);
  useEffect(() => { const query = window.matchMedia('(max-width: 760px)'); const update = () => setCompact(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, []);
  const economy = compact || limitedHardware;
  return <SceneBoundary onError={props.onError}><Canvas camera={{ position: presets['three-quarter'].position, fov: 39, near: .1, far: 150 }} dpr={[1, economy ? 1.25 : 1.65]} shadows frameloop={props.visible ? 'always' : 'never'} gl={{ antialias: true, alpha: true, powerPreference: economy ? 'default' : 'high-performance' }} onCreated={({ gl }) => { gl.setClearColor('#000000', 0); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }} fallback={<div className="garage-fallback"><h3>Explore the engineering.</h3><p>3D is unavailable in this browser. The nine engineering systems below remain available.</p></div>}>
    <fog attach="fog" args={['#273021', 24, 57]}/>
    <ambientLight intensity={.18}/><hemisphereLight args={['#e7edca', '#17281c', .75]}/>
    <directionalLight position={[-5, 9, 5]} intensity={2.8} color="#f5f4d1" castShadow shadow-mapSize={economy ? [1024, 1024] : [2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-normalBias={.025} shadow-bias={-.0002}/>
    <directionalLight position={[5, 5, -6]} intensity={2.2} color="#c7deae"/>
    <rectAreaLight width={11} height={5} intensity={3.2} color="#fcffe3" position={[0, 7, 0]} rotation={[-Math.PI / 2, 0, 0]}/>
    <pointLight position={[-6, 2, -4]} intensity={8} color="#a7bb7b" distance={16}/>
    <Environment resolution={economy ? 64 : 128} frames={1}>
      <mesh scale={45}><sphereGeometry args={[1, 24, 16]}/><meshBasicMaterial color="#17251a" side={THREE.BackSide}/></mesh>
      <Lightformer form="rect" color="#f3f2d9" intensity={2.5} position={[-1, 7, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[11, 3, 1]}/>
      <Lightformer form="rect" color="#d7e7ce" intensity={1.7} position={[0, 4, -7]} scale={[13, 2, 1]}/>
      <Lightformer form="rect" color="#f1f6dc" intensity={1.6} position={[-8, 3, 3]} rotation={[0, Math.PI / 2, 0]} scale={[7, 2, 1]}/>
    </Environment>
    <Suspense fallback={null}><StableStudio economy={economy}/><StableBody/>{props.scrollProgress === undefined && <Hotspots selected={props.selectedHotspot} onSelect={props.onSelect}/>} {props.selectedHotspot && props.scrollProgress === undefined && <SelectionBrackets selected={props.selectedHotspot}/>} {props.airflow && <Airflow visible={props.visible} reducedMotion={props.reducedMotion}/>} {props.scrollProgress !== undefined ? <ScrollCameraRig progress={props.scrollProgress} reducedMotion={props.reducedMotion} visible={props.visible} compact={compact}/> : <CameraRig {...props}/>}<Ready onReady={props.onReady} onError={props.onError}/></Suspense>
  </Canvas></SceneBoundary>;
}
