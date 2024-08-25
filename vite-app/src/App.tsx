import { Client, Room } from 'colyseus.js'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { Canvas, GroupProps, MeshProps, ThreeEvent } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Plane,
  Sphere,
  Html,
  Line,
} from '@react-three/drei'
import './App.css'
import { closestTown, MyRoomState, Vec, ToJSON } from 'server'
import { Vector3 } from 'three'

export const vec3 = (v: Vec): Vector3 => new Vector3(v.x, 0, v.y)
export const origin3: Vector3 = new Vector3(0, 0, 0)

const PlayerMesh = (props: MeshProps & { color: string }) => (
  <mesh
    scale={0.15}
    castShadow
    receiveShadow
    {...props}
  >
    <cylinderGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={props.color} />
  </mesh>
)

type TownMeshProps = GroupProps & { label: ReactNode }

const TownMesh = (props: TownMeshProps) => (
  <group {...props}>
    <mesh
      scale={[0.1, 0.2, 0.1]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={'#000000'} />
    </mesh>
    <Html
      center
      position={[0, 0.5, 0]}
    >
      {props.label}
    </Html>
  </group>
)

const TargetMesh = (props: MeshProps) => (
  <mesh
    scale={[0.03, 1, 0.03]}
    castShadow
    receiveShadow
    {...props}
  >
    <cylinderGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color={'red'} />
  </mesh>
)

const useGame = () => {
  const [state, setState] = useState<ToJSON<MyRoomState>>({
    players: {},
    towns: {
      a: {
        id: 'a',
        name: 'Town',
        population: 1000,
        maxPopulation: 1000,
        dailyRations: 1000,
        pos: { x: 0, y: 0 },
        color: [0, 0, 0]
      },
    },
    size: { width: 0, height: 0 },
  })

  const roomRef = useRef<Room>()

  useEffect(() => {
    const join = async () => {
      const client = new Client('ws://localhost:2567')
      console.log('Joining room...')
      try {
        roomRef.current = await client.joinOrCreate<MyRoomState>('my_room')
        console.log('Joined successfully!')

        const room = roomRef.current
        // Initialize state
        room.onStateChange.once((state) => {
          setState(() => room.state.toJSON())
        })

        // Subscribe to state changes
        const watchedEntityTypes = ['players', 'towns'] as const
        watchedEntityTypes.forEach((entityType) => {
          room.state[entityType].onChange((entity, id) => {
            const updateState = () =>
              setState((state) => ({
                ...state,
                [entityType]: {
                  ...state[entityType],
                  [id]: entity.toJSON(),
                },
              }))
            entity.onChange(updateState)
          })
        })
      } catch (e) {
        console.error(e)
      }
    }
    join()
    const handle = setInterval(() => {
      // Update
      const room = roomRef.current
      if (!room) {
        return
      }
      // room.send(0, inputPayload)
    }, 100)
    return () => clearInterval(handle)
  }, [])

  return !roomRef.current
    ? {
        tag: 'loading',
      }
    : {
        tag: 'loaded',
        room: roomRef.current,
        state,
      }
}

export default function App() {
  const s = useGame()

  if (s.tag === 'loading') {
    return <div>Loading...</div>
  }

  const { state, room } = s

  const me = state.players[room.sessionId ?? '']

  if (!me) {
    return <div>Loading...</div>
  }

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    room.send('click', {
      x: event.point.x,
      y: event.point.z,
    })
  }

  const towns = Object.values(state.towns)

  return (
    <div>
      <div className="header">
        {me && (
          <div>
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              Me ({me.color})
            </h2>
            <ul>
              <li>Soldiers: {Math.ceil(me.soldiers)}</li>
              <li>Hunger: {Math.ceil(me.hunger * 100)}%</li>
            </ul>
          </div>
        )}
        <div>
          <h2>Players:</h2>
          <ul>
            {Object.entries(state.players).map(([playerId, player]) => (
              <li>
                {playerId} ({player.color})
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Canvas
        className="canvas"
        shadows
      >
        <ambientLight intensity={1.5} />
        <Sphere position={[-5, 5, 5]}>
          <meshStandardMaterial color="yellow" />
        </Sphere>
        <directionalLight
          position={[-5, 5, 5]}
          intensity={1}
          shadow-mapSize={[1024, 1024]}
          castShadow
        ></directionalLight>
        <PerspectiveCamera
          position={[2, 2, 10]}
          makeDefault
        />
        <Plane
          args={[state.size.width, state.size.height]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          onClick={handleClick}
        >
          <meshStandardMaterial color="green" />
        </Plane>
        <OrbitControls />
        {Object.entries(state.players).map(([playerId, player]) => (
          <>
            <PlayerMesh
              position={[player.pos.x, 0, player.pos.y]}
              color={player.color}
            />
            <Line
              points={[
                vec3(player.pos),
                vec3(closestTown(player.pos, towns)?.pos),
              ]} // Array of points, Array<Vector3 | Vector2 | [number, number, number] | [number, number] | number>
              color={player.color} // Default
              lineWidth={3} // In pixels (default)
              segments // If true, renders a THREE.LineSegments2. Otherwise, renders a THREE.Line2
              dashed={false} // Default
            />
          </>
        ))}
        <TargetMesh position={[me.target.x ?? 0, 0, me.target.y ?? 0]} />
        {towns.map((town) => (
          <TownMesh
            position={[town.pos.x ?? 0, 0, town.pos.y ?? 0]}
            label={
              <div>
                <p style={{ color: 'white', textWrap: 'nowrap' }}>
                  {town.name}
                </p>
                <p style={{ color: 'white', textWrap: 'nowrap' }}>
                  🍏{' '}
                  {Math.ceil(
                    (town.dailyRations / (365 * town.population)) * 100,
                  )}
                </p>
                <p style={{ color: 'white', textWrap: 'nowrap' }}>
                  👥 {Math.ceil(town.population)}
                </p>
              </div>
            }
          />
        ))}
      </Canvas>
    </div>
  )
}
